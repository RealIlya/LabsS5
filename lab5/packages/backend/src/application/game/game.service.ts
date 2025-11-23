import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Lobby } from "../../domain/lobby/lobby.types";
import type { GameState, GameTileState } from "../../domain/game/game-state";
import {
  PlayerData,
  STRUCTURE_RULES,
  TERRAIN_RULES,
  UNIT_RULES,
  type CityData,
  type CityImprovementType,
  type CityProductionItem,
  type HexCoord,
  type PlayerAction,
  type UnitData,
  type UnitType,
} from "@hex/shared";
import {
  CAPITAL_START_FORTIFICATION,
  CAPITAL_START_POPULATION,
  CITY_FORT_REGEN,
  CITY_MAX_FORTIFICATION,
  CITY_POPULATION_CAP_BONUS,
  MAP_COLUMNS,
  MAP_ROWS,
  PLAYER_COLORS,
} from "./game.constants";
import { getNeighbors, getTile, isTilePlaceable } from "./game.utils";
import type { StorePort } from "../../infrastructure/store/store.port";
import { MapService } from "./map.service";

@Injectable()
export class GameService {
  constructor(
    private readonly mapService: MapService,
    @Inject("StorePort") private readonly memoryStore: StorePort
  ) {}

  getGame(gameId: string): GameState {
    const game = this.memoryStore.getGame(gameId);
    if (!game) {
      throw new NotFoundException("Game not found");
    }
    return game;
  }

  createGameForLobby(lobby: Lobby): GameState {
    const gameState = this.buildGameState(lobby);
    this.memoryStore.saveGame(gameState);
    return gameState;
  }

  applyAction(
    gameId: string,
    playerId: string,
    action: PlayerAction
  ): GameState {
    const game = this.getGame(gameId);
    if (game.phase !== "running") {
      throw new BadRequestException("Game is not running");
    }
    if (game.currentPlayerId !== playerId) {
      throw new BadRequestException("Not your turn");
    }

    switch (action.type) {
      case "MOVE_UNIT":
        this.handleMoveUnit(
          game,
          playerId,
          action.payload.path,
          action.payload.unitId
        );
        break;
      case "BUILD_STRUCTURE":
        this.handleBuildStructure(game, playerId, action.payload);
        break;
      case "SET_CITY_PRODUCTION":
        this.handleSetCityProduction(
          game,
          playerId,
          action.payload.cityId,
          action.payload.item
        );
        break;
      case "FOUND_CITY":
        this.handleFoundCity(game, playerId, action.payload.settlerId);
        break;
      case "ATTACK_UNIT":
        this.handleAttackUnit(
          game,
          playerId,
          action.payload.attackerId,
          action.payload.defenderId
        );
        break;
      case "END_TURN":
        this.advanceTurn(game);
        break;
      default:
        throw new BadRequestException("Action not supported yet");
    }

    this.memoryStore.saveGame(game);
    return game;
  }

  placeCapital(gameId: string, playerId: string, tileId: string): GameState {
    const game = this.getGame(gameId);
    if (game.phase !== "capital-placement") {
      throw new BadRequestException("Capital placement already finished");
    }

    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new BadRequestException("Player not found");
    }
    if (player.capitalCityId) {
      throw new BadRequestException("Capital already placed");
    }

    const tile = game.tiles.find((t) => t.id === tileId);
    if (!tile) {
      throw new NotFoundException("Tile not found");
    }
    if (!isTilePlaceable(tile)) {
      throw new BadRequestException("Tile is not suitable for a capital");
    }
    if (tile.structure) {
      throw new BadRequestException("Tile already occupied");
    }
    if (this.isAdjacentToEnemyCity(game, tile.x, tile.y, player.id)) {
      throw new BadRequestException("Too close to another player's city");
    }

    const structureId = `city-${tile.id}`;
    const city: CityData = {
      id: structureId,
      type: "City",
      ownerId: player.id,
      ownerName: player.name,
      population: CAPITAL_START_POPULATION,
      improvement: null,
      fortification: CAPITAL_START_FORTIFICATION,
      isCapital: true,
      production: null,
    };
    tile.structure = city;
    tile.ownerId = player.id;
    const acquiredTileIds = this.claimInitialTerritory(game, tile, player.id);

    player.capitalCityId = structureId;
    player.populationCap = Math.max(player.populationCap, 50);
    this.recalculatePopulation(game);
    this.pushEvent(game, {
      type: "CITY_FOUNDED",
      payload: {
        newCity: city,
        acquiredTileIds,
      },
    });

    if (game.players.every((p) => p.capitalCityId)) {
      game.phase = "running";
      game.currentPlayerId = game.players[0]?.id ?? playerId;
      game.currentPlayerName = game.players[0]?.name ?? player.name;
      const firstPlayer = game.players[0];
      if (firstPlayer) {
        this.startPlayerTurn(game, firstPlayer);
      }
    }

    this.memoryStore.saveGame(game);
    return game;
  }

  private buildGameState(lobby: Lobby): GameState {
    const tiles = this.mapService.generateTiles(lobby.id);

    const players: PlayerData[] = lobby.players.map((player, index) => ({
      id: player.id,
      name: player.nickname,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      populationCap: 0,
      currentPopulation: 0,
      status: "playing",
      capitalCityId: null,
    }));

    return {
      id: lobby.gameId,
      turn: 1,
      currentPlayerId: lobby.players[0]?.id ?? "",
      currentPlayerName: lobby.players[0]?.nickname ?? "Commander",
      population: { current: 0, cap: 0 },
      phase: "capital-placement",
      map: {
        columns: MAP_COLUMNS,
        rows: MAP_ROWS,
      },
      players,
      tiles,
      events: [],
    };
  }

  private recalculatePopulation(game: GameState) {
    game.players.forEach((player) => {
      const population = this.getPlayerCities(game, player.id).reduce(
        (sum, city) => sum + city.population,
        0
      );
      player.currentPopulation = population;
    });

    game.population = game.players.reduce(
      (acc, player) => ({
        current: acc.current + player.currentPopulation,
        cap: acc.cap + player.populationCap,
      }),
      { current: 0, cap: 0 }
    );
  }

  private handleMoveUnit(
    game: GameState,
    playerId: string,
    path: HexCoord[],
    unitId: string
  ) {
    if (path.length !== 1) {
      throw new BadRequestException("Only single-step moves are supported");
    }
    const fromTile = this.findUnitTile(game, unitId);
    if (!fromTile || !fromTile.unit) {
      throw new BadRequestException("Unit not found");
    }
    if (fromTile.unit.ownerId !== playerId) {
      throw new BadRequestException("Cannot move foreign unit");
    }
    if (!fromTile.unit.movementPoints || fromTile.unit.movementPoints <= 0) {
      throw new BadRequestException("Unit has no movement points");
    }

    const destination = path[0];
    const toTile = getTile(game.tiles, destination.x, destination.y);
    if (!toTile) {
      throw new BadRequestException("Destination out of bounds");
    }
    if (!this.areTilesAdjacent(fromTile, toTile)) {
      throw new BadRequestException("Destination not adjacent");
    }
    if (!isTilePlaceable(toTile) && toTile.structure?.ownerId !== playerId) {
      throw new BadRequestException("Destination blocked");
    }
    if (toTile.unit) {
      throw new BadRequestException("Destination already occupied");
    }

    const movementCost = 1;
    if (fromTile.unit.movementPoints < movementCost) {
      throw new BadRequestException("Insufficient movement points");
    }

    const remaining = fromTile.unit.movementPoints - movementCost;
    toTile.unit = { ...fromTile.unit, movementPoints: remaining };
    fromTile.unit = undefined;

    this.pushEvent(game, {
      type: "UNIT_MOVED",
      payload: {
        unitId,
        path,
        newMovementPoints: remaining,
      },
    });
  }

  private handleSetCityProduction(
    game: GameState,
    playerId: string,
    cityId: string,
    item: CityProductionItem
  ) {
    const cityTile = this.getCityTile(game, cityId);
    if (!cityTile || cityTile.structure?.type !== "City") {
      throw new NotFoundException("City not found");
    }
    const city = cityTile.structure as CityData;
    if (city.ownerId !== playerId) {
      throw new BadRequestException("Cannot manage production in foreign city");
    }

    if (city.production) {
      const refund = this.getProductionCost(city.production.item);
      city.population += refund;
    }

    const cost = this.getProductionCost(item);
    if (city.population < cost) {
      throw new BadRequestException("Not enough population for production");
    }

    city.population -= cost;
    city.production = {
      item,
      progressTurns: 0,
    };
    this.recalculatePopulation(game);
  }

  private handleFoundCity(
    game: GameState,
    playerId: string,
    settlerId: string
  ) {
    const settlerTile = this.findUnitTile(game, settlerId);
    if (!settlerTile || !settlerTile.unit) {
      throw new NotFoundException("Settler not found");
    }
    const unit = settlerTile.unit;
    if (unit.ownerId !== playerId) {
      throw new BadRequestException("Cannot found city with foreign unit");
    }
    if (unit.type !== "Settler") {
      throw new BadRequestException("Only settlers can found cities");
    }
    if (!isTilePlaceable(settlerTile)) {
      throw new BadRequestException("Tile unsuitable for city");
    }
    if (settlerTile.structure) {
      throw new BadRequestException("Tile already occupied");
    }
    if (
      this.isAdjacentToEnemyCity(game, settlerTile.x, settlerTile.y, playerId)
    ) {
      throw new BadRequestException("Too close to another player's city");
    }

    const player = this.getPlayer(game, playerId);
    player.populationCap += CITY_POPULATION_CAP_BONUS;
    settlerTile.unit = undefined;
    const newCity: CityData = {
      id: `city-${settlerTile.id}`,
      type: "City",
      ownerId: player.id,
      ownerName: player.name,
      population: 20,
      improvement: null,
      fortification: 60,
      isCapital: false,
      production: null,
    };
    settlerTile.structure = newCity;
    settlerTile.ownerId = player.id;
    const acquired = this.claimInitialTerritory(game, settlerTile, player.id);
    this.recalculatePopulation(game);

    this.pushEvent(game, {
      type: "CITY_FOUNDED",
      payload: {
        newCity,
        acquiredTileIds: acquired,
      },
    });
  }

  private isAdjacentToEnemyCity(
    game: GameState,
    x: number,
    y: number,
    ownerId: string
  ): boolean {
    const neighborCoords = getNeighbors(x, y);
    return neighborCoords.some(({ x: nx, y: ny }) => {
      const neighbor = getTile(game.tiles, nx, ny);
      return (
        neighbor &&
        neighbor.structure?.type === "City" &&
        neighbor.structure.ownerId !== ownerId
      );
    });
  }

  private isWithinDistanceOfCity(
    game: GameState,
    tile: GameTileState,
    maxDistance: number
  ) {
    return game.tiles.some((t) => {
      if (t.structure?.type !== "City") return false;
      const dist = this.hexDistance(tile, t);
      return dist <= maxDistance;
    });
  }

  private hexDistance(a: GameTileState, b: GameTileState) {
    const toCube = (x: number, y: number) => {
      const xCube = x - (y - (y & 1)) / 2;
      const zCube = y;
      const yCube = -xCube - zCube;
      return { x: xCube, y: yCube, z: zCube };
    };
    const ac = toCube(a.x, a.y);
    const bc = toCube(b.x, b.y);
    return Math.max(
      Math.abs(ac.x - bc.x),
      Math.abs(ac.y - bc.y),
      Math.abs(ac.z - bc.z)
    );
  }

  private handleBuildStructure(
    game: GameState,
    playerId: string,
    payload: {
      workerId: string;
      structureType: "Farm" | "Fort";
      position: HexCoord;
      fromCityId: string;
    }
  ) {
    const { workerId, structureType, position, fromCityId } = payload;
    const workerTile = this.findUnitTile(game, workerId);
    if (!workerTile || !workerTile.unit) {
      throw new NotFoundException("Worker not found");
    }
    const worker = workerTile.unit;
    if (worker.ownerId !== playerId || worker.type !== "Worker") {
      throw new BadRequestException("Selected unit cannot build structures");
    }

    const targetTile = getTile(game.tiles, position.x, position.y);
    if (!targetTile) {
      throw new BadRequestException("Target tile not found");
    }
    if (targetTile.id !== workerTile.id) {
      throw new BadRequestException("Worker must stand on the target tile");
    }
    if (!isTilePlaceable(targetTile)) {
      throw new BadRequestException("Cannot build on this terrain");
    }
    if (targetTile.structure) {
      throw new BadRequestException("Tile already has a structure");
    }
    if (targetTile.ownerId && targetTile.ownerId !== playerId) {
      throw new BadRequestException("Cannot build in foreign territory");
    }

    const cityTile = this.getCityTile(game, fromCityId);
    if (!cityTile || cityTile.structure?.type !== "City") {
      throw new BadRequestException("City not found");
    }
    const sourceCity = cityTile.structure as CityData;
    if (sourceCity.ownerId !== playerId) {
      throw new BadRequestException(
        "Cannot spend population from foreign city"
      );
    }

    const rule = STRUCTURE_RULES[structureType];
    if (!rule || rule.category !== "Standalone") {
      throw new BadRequestException("Structure not buildable");
    }

    if (structureType === "Farm" && targetTile.ownerId !== playerId) {
      throw new BadRequestException(
        "Farm must be built within owned territory"
      );
    }
    if (structureType === "Farm" && targetTile.terrain !== "Plains") {
      throw new BadRequestException("Farm can only be built on Plains");
    }
    if (structureType === "Fort") {
      if (targetTile.terrain !== "Plains" && targetTile.terrain !== "Hills") {
        throw new BadRequestException("Fort can only be built on Plains or Hills");
      }
      const tooCloseToCity = this.isWithinDistanceOfCity(game, targetTile, 2);
      if (tooCloseToCity) {
        throw new BadRequestException("Fort too close to a city");
      }
    }

    if (sourceCity.population < rule.cost) {
      throw new BadRequestException("Not enough population in selected city");
    }

    sourceCity.population -= rule.cost;
    const structureId = `${structureType.toLowerCase()}-${
      targetTile.id
    }-${Date.now()}`;
    targetTile.structure = {
      id: structureId,
      type: structureType,
      ownerId: playerId,
      ownerName: worker.ownerName,
    };
    targetTile.ownerId = playerId;
    workerTile.unit.movementPoints = 0;

    const player = this.getPlayer(game, playerId);
    if (rule.effects.empirePopulationCapIncrease) {
      player.populationCap += rule.effects.empirePopulationCapIncrease;
    }

    this.recalculatePopulation(game);
    this.pushEvent(game, {
      type: "STRUCTURE_CREATED",
      payload: {
        newStructure: targetTile.structure,
        position,
      },
    });
  }

  private handleAttackUnit(
    game: GameState,
    playerId: string,
    attackerId: string,
    defenderId: string
  ) {
    const attackerTile = this.findUnitTile(game, attackerId);
    const defenderTile = this.findUnitTile(game, defenderId);
    if (!attackerTile?.unit || !defenderTile?.unit) {
      throw new NotFoundException("Attacker or defender not found");
    }
    const attacker = attackerTile.unit;
    const defender = defenderTile.unit;

    if (attacker.ownerId !== playerId) {
      throw new BadRequestException("Cannot attack with foreign unit");
    }
    if (attacker.ownerId === defender.ownerId) {
      throw new BadRequestException("Cannot attack your own unit");
    }
    if (!attacker.movementPoints || attacker.movementPoints <= 0) {
      throw new BadRequestException("Unit has no movement points");
    }
    if (!this.areTilesAdjacent(attackerTile, defenderTile)) {
      throw new BadRequestException("Defender not adjacent");
    }

    const attackPower = UNIT_RULES[attacker.type].baseStats.attack;
    defender.health -= attackPower;
    attacker.movementPoints = Math.max(0, attacker.movementPoints - 1);

    this.pushEvent(game, {
      type: "UNIT_ATTACKED",
      payload: { attackerId, defenderId },
    });
    if (defender.health > 0) {
      this.pushEvent(game, {
        type: "UNIT_TOOK_DAMAGE",
        payload: { unitId: defenderId, damageDealt: attackPower, newHealth: defender.health },
      });
    } else {
      defenderTile.unit = undefined;
      this.pushEvent(game, {
        type: "UNIT_DIED",
        payload: { unitId: defenderId },
      });
    }
  }

  private startPlayerTurn(
    game: GameState,
    player: GameState["players"][number]
  ) {
    this.applyPopulationGrowth(game, player);
    this.resetMovementForPlayer(game, player.id);
    this.regenerateFortifications(game, player.id);
    this.recalculatePopulation(game);
  }

  private applyPopulationGrowth(
    game: GameState,
    player: GameState["players"][number]
  ) {
    this.recalculatePopulation(game);
    if (
      player.populationCap <= 0 ||
      player.currentPopulation >= player.populationCap
    ) {
      return;
    }
    const cities = this.getPlayerCities(game, player.id);
    cities.forEach((city) => {
      const baseGrowth = 1;
      const granaryBonus = city.improvement === "Granary" ? 0.5 : 0;
      city.population += baseGrowth + granaryBonus;
    });
    this.recalculatePopulation(game);
  }

  private resetMovementForPlayer(game: GameState, playerId: string) {
    game.tiles.forEach((tile) => {
      if (tile.unit?.ownerId === playerId) {
        const baseMovement = UNIT_RULES[tile.unit.type].baseStats.movement;
        tile.unit.movementPoints = baseMovement;
      }
    });
  }

  private regenerateFortifications(game: GameState, playerId: string) {
    this.getPlayerCities(game, playerId).forEach((city) => {
      city.fortification = Math.min(
        CITY_MAX_FORTIFICATION,
        city.fortification + CITY_FORT_REGEN
      );
    });
  }

  private progressCityProduction(game: GameState, playerId: string) {
    const cities = this.getPlayerCities(game, playerId);
    cities.forEach((city) => {
      if (!city.production) {
        return;
      }
      city.production.progressTurns += 1;
      const required = this.getProductionTurns(city.production.item);
      if (city.production.progressTurns >= required) {
        this.finishProduction(game, city);
      }
    });
  }

  private finishProduction(game: GameState, city: CityData) {
    const item = city.production?.item;
    if (!item) {
      return;
    }

    let createdUnit: UnitData | undefined;
    let createdImprovement: CityImprovementType | undefined;

    if (item.type === "unit") {
      createdUnit = this.spawnUnit(game, city, item.unitType) ?? undefined;
    } else {
      city.improvement = item.improvementType;
      createdImprovement = item.improvementType;
    }

    city.production = null;

    this.pushEvent(game, {
      type: "PRODUCTION_COMPLETED",
      payload: {
        cityId: city.id,
        createdUnit,
        createdImprovement,
      },
    });
  }

  private spawnUnit(game: GameState, city: CityData, unitType: UnitType) {
    const cityTile = this.getCityTile(game, city.id);
    if (!cityTile) {
      return null;
    }
    const spawnTile = this.findSpawnTile(game, cityTile, city.ownerId);
    if (!spawnTile) {
      return null;
    }
    const unit = this.createUnit(city.ownerId, city.ownerName, unitType);
    spawnTile.unit = unit;
    return unit;
  }

  private findSpawnTile(
    game: GameState,
    origin: GameTileState,
    ownerId: string
  ) {
    if (!origin.unit) {
      return origin;
    }
    const candidates = getNeighbors(origin.x, origin.y)
      .map(({ x, y }) => getTile(game.tiles, x, y))
      .filter(
        (tile): tile is GameTileState =>
          Boolean(tile) &&
          !tile?.unit &&
          tile?.ownerId === ownerId &&
          isTilePlaceable(tile)
      );
    return candidates[0] ?? null;
  }

  private getCityTile(game: GameState, cityId: string) {
    return (
      game.tiles.find(
        (tile) =>
          tile.structure?.type === "City" && tile.structure.id === cityId
      ) ?? null
    );
  }

  private getPlayer(game: GameState, playerId: string) {
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      throw new NotFoundException("Player not found");
    }
    return player;
  }

  private getProductionCost(item: CityProductionItem) {
    if (item.type === "unit") {
      return UNIT_RULES[item.unitType].cost;
    }
    return STRUCTURE_RULES[item.improvementType].cost;
  }

  private getProductionTurns(item: CityProductionItem) {
    if (item.type === "unit") {
      return UNIT_RULES[item.unitType].productionTurns;
    }
    return STRUCTURE_RULES[item.improvementType].productionTurns;
  }

  private createUnit(ownerId: string, ownerName: string, type: UnitType) {
    const stats = UNIT_RULES[type].baseStats;
    return {
      id: `${ownerId}-${type}-${Math.random().toString(36).slice(2, 10)}`,
      ownerId,
      ownerName,
      type,
      health: stats.health,
      movementPoints: stats.movement,
      isVeteran: false,
    };
  }

  private findUnitTile(game: GameState, unitId: string) {
    return game.tiles.find((tile) => tile.unit?.id === unitId) ?? null;
  }

  private areTilesAdjacent(a: GameTileState, b: GameTileState) {
    return getNeighbors(a.x, a.y).some(({ x, y }) => x === b.x && y === b.y);
  }

  private pushEvent(
    game: GameState,
    event: NonNullable<GameState["events"]>[number]
  ) {
    if (!game.events) {
      game.events = [];
    }
    game.events.push(event);
    if (game.events.length > 50) {
      game.events.shift();
    }
  }

  private claimInitialTerritory(
    game: GameState,
    origin: GameTileState,
    ownerId: string
  ) {
    const tilesToClaim = [
      origin,
      ...getNeighbors(origin.x, origin.y)
        .map(({ x, y }) => getTile(game.tiles, x, y))
        .filter((tile): tile is GameTileState => Boolean(tile)),
    ];
    const claimed: string[] = [];
    tilesToClaim.forEach((tile) => {
      if (!tile.ownerId || tile.ownerId === ownerId) {
        if (tile.ownerId !== ownerId) {
          claimed.push(tile.id);
        } else if (!claimed.includes(tile.id)) {
          claimed.push(tile.id);
        }
        tile.ownerId = ownerId;
      }
    });
    return claimed;
  }

  private getPlayerCities(game: GameState, playerId: string): CityData[] {
    return game.tiles
      .map((tile) => tile.structure)
      .filter(
        (structure): structure is CityData =>
          Boolean(structure) &&
          structure?.type === "City" &&
          structure.ownerId === playerId
      );
  }

  private advanceTurn(game: GameState) {
    const currentIndex = game.players.findIndex(
      (player) => player.id === game.currentPlayerId
    );
    const currentPlayer = currentIndex >= 0 ? game.players[currentIndex] : null;
    if (currentPlayer) {
      this.progressCityProduction(game, currentPlayer.id);
    }

    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % game.players.length : 0;
    const nextPlayer = game.players[nextIndex];
    if (!nextPlayer) {
      throw new BadRequestException("No players available for turn rotation");
    }
    if (nextIndex === 0) {
      game.turn += 1;
    }

    game.currentPlayerId = nextPlayer.id;
    game.currentPlayerName = nextPlayer.name;
    this.startPlayerTurn(game, nextPlayer);

    this.pushEvent(game, {
      type: "TURN_CHANGED",
      payload: {
        nextPlayerId: nextPlayer.id,
        turnNumber: game.turn,
      },
    });
  }
}
