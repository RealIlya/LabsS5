import { describe, it, expect, beforeEach } from "vitest";
import { GameService } from "./game.service";
import type { CityData, UnitData } from "@hex/shared";
import type { GameState } from "../../domain/game/game-state";
import type { Lobby } from "../../domain/lobby/lobby.types";
import { memoryStore } from "../../infrastructure/store/memory-store";
import { MapService } from "./map.service";

const makeLobby = (): Lobby => ({
  id: "lobby-1",
  name: "Test Lobby",
  code: "ABCD",
  hostId: "player-1",
  gameId: "game-1",
  maxPlayers: 4,
  status: "waiting",
  players: [
    {
      id: "player-1",
      nickname: "Alpha",
      rank: "Commander",
      isHost: true,
      isReady: true,
    },
    {
      id: "player-2",
      nickname: "Bravo",
      rank: "Lieutenant",
      isHost: false,
      isReady: true,
    },
  ],
});

const findPlaceableTile = (gameId: string) => {
  const game = memoryStore.getGame(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  return game.tiles.find(
    (tile) =>
      tile.terrain !== "Water" &&
      tile.terrain !== "Mountains" &&
      !tile.structure
  );
};

const findSecondTile = (gameId: string, excludeId: string) => {
  const game = memoryStore.getGame(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  return game.tiles.find(
    (tile) =>
      tile.id !== excludeId &&
      tile.terrain !== "Water" &&
      tile.terrain !== "Mountains" &&
      !tile.structure
  );
};

const offsets = {
  even: [
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ],
  odd: [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
  ],
};

const findAdjacent = (gameId: string, x: number, y: number) => {
  const game = memoryStore.getGame(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  const list = offsets[y % 2 === 0 ? "even" : "odd"];
  return list
    .map(({ dx, dy }) =>
      game.tiles.find((tile) => tile.x === x + dx && tile.y === y + dy)
    )
    .find(
      (tile) =>
        tile &&
        !tile.unit &&
        tile.terrain !== "Water" &&
        tile.terrain !== "Mountains"
    );
};

const getCityTile = (gameId: string, ownerId: string) => {
  const game = memoryStore.getGame(gameId);
  if (!game) {
    throw new Error("Game not found");
  }
  return game.tiles.find((tile) => tile.structure?.ownerId === ownerId);
};

const addUnitToTile = (
  gameId: string,
  tileId: string,
  ownerId: string,
  unitType: UnitData["type"],
  overrides?: Partial<UnitData>
) => {
  const game = memoryStore.getGame(gameId) as GameState | null;
  if (!game) {
    throw new Error("Game not found");
  }
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile) {
    throw new Error("Tile not found");
  }
  const unit: UnitData = {
    id: `${ownerId}-${unitType}-${Date.now()}`,
    ownerId,
    ownerName: ownerId,
    type: unitType,
    health: 10,
    movementPoints: 2,
    isVeteran: false,
    ...overrides,
  };
  tile.unit = unit;
  return unit;
};

const addWorkerToTile = (gameId: string, ownerId: string, tileId: string) => {
  return addUnitToTile(gameId, tileId, ownerId, "Worker");
};

const addSettlerToTile = (gameId: string, ownerId: string, tileId: string) => {
  const game = memoryStore.getGame(gameId) as GameState | null;
  if (!game) {
    throw new Error("Game not found");
  }
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile) {
    throw new Error("Tile not found");
  }
  const unit: UnitData = {
    id: `${ownerId}-settler-${Date.now()}`,
    ownerId,
    ownerName: ownerId,
    type: "Settler",
    health: 10,
    movementPoints: 2,
    isVeteran: false,
  };
  tile.unit = unit;
  return unit;
};

const addWarriorToTile = (gameId: string, ownerId: string, tileId: string) => {
  return addUnitToTile(gameId, tileId, ownerId, "Warrior", {
    movementPoints: 1,
  });
};

const isTilePassable = (tile: GameState["tiles"][number]) =>
  tile.terrain !== "Water" && tile.terrain !== "Mountains" && !tile.structure;

const findAdjacentPair = (gameId: string) => {
  const game = memoryStore.getGame(gameId) as GameState | null;
  if (!game) {
    throw new Error("Game not found");
  }
  for (const tile of game.tiles) {
    if (!isTilePassable(tile) || tile.unit) continue;
    const neighbor = offsets[tile.y % 2 === 0 ? "even" : "odd"]
      .map(({ dx, dy }) =>
        game.tiles.find(
          (candidate) =>
            candidate.x === tile.x + dx && candidate.y === tile.y + dy
        )
      )
      .find(
        (candidate) => candidate && isTilePassable(candidate) && !candidate.unit
      );
    if (neighbor) {
      return { origin: tile, neighbor };
    }
  }
  return null;
};

describe("GameService actions", () => {
  const service = new GameService(new MapService());

  beforeEach(() => {
    memoryStore.clear();
  });

  it("switches to running phase once every player has placed a capital", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);

    const firstTile = findPlaceableTile(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, firstTile?.id ?? "");
    if (!firstTile || !secondTile) {
      throw new Error("Tiles missing");
    }

    service.placeCapital(lobby.gameId, "player-1", firstTile.id);
    let game = service.getGame(lobby.gameId);
    expect(game.phase).toBe("capital-placement");

    service.placeCapital(lobby.gameId, "player-2", secondTile.id);
    game = service.getGame(lobby.gameId);
    expect(game.phase).toBe("running");
    expect(game.currentPlayerId).toBe("player-1");
  });

  it("advances the turn when END_TURN action is applied", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const firstTile = findPlaceableTile(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, firstTile?.id ?? "");
    if (!firstTile || !secondTile) {
      throw new Error("Tiles missing");
    }
    service.placeCapital(lobby.gameId, "player-1", firstTile.id);
    service.placeCapital(lobby.gameId, "player-2", secondTile.id);

    const before = service.getGame(lobby.gameId);
    expect(before.currentPlayerId).toBe("player-1");

    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });

    const after = service.getGame(lobby.gameId);
    expect(after.currentPlayerId).toBe("player-2");
  });

  it("completes warrior production after required turns", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const pair = findAdjacentPair(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, pair?.origin.id ?? "");
    if (!pair || !secondTile) {
      throw new Error("Tiles missing");
    }
    service.placeCapital(lobby.gameId, "player-1", pair.origin.id);
    service.placeCapital(lobby.gameId, "player-2", secondTile.id);
    // гарантируем свободный соседний тайл для спавна
    pair.neighbor.ownerId = "player-1";
    pair.neighbor.structure = undefined;

    const cityTile = getCityTile(lobby.gameId, "player-1");
    if (!cityTile?.structure) {
      throw new Error("City not found");
    }

    service.applyAction(lobby.gameId, "player-1", {
      type: "SET_CITY_PRODUCTION",
      payload: {
        cityId: cityTile.structure.id,
        item: { type: "unit", unitType: "Warrior" },
      },
    });

    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });
    service.applyAction(lobby.gameId, "player-2", {
      type: "END_TURN",
      payload: {},
    });
    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });

    const updated = service.getGame(lobby.gameId);
    const updatedCityTile = updated.tiles.find(
      (tile) => tile.id === cityTile.id
    );
    expect(updatedCityTile?.unit?.type).toBe("Warrior");
    const updatedCity = updatedCityTile?.structure as CityData | undefined;
    expect(updatedCity?.production).toBeNull();
  });

  it("spawns produced unit next to city when tile occupied", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const pair = findAdjacentPair(lobby.gameId);
    if (!pair) {
      throw new Error("No adjacent pair");
    }
    const second = findSecondTile(lobby.gameId, pair.origin.id ?? "");
    if (!second) throw new Error("Second tile not found");
    service.placeCapital(lobby.gameId, "player-1", pair.origin.id);
    service.placeCapital(lobby.gameId, "player-2", second.id);

    const cityTile = getCityTile(lobby.gameId, "player-1");
    if (!cityTile?.structure) {
      throw new Error("City not found");
    }
    cityTile.unit = {
      id: "garrison",
      ownerId: "player-1",
      ownerName: "player-1",
      type: "Warrior",
      health: 20,
      movementPoints: 0,
      isVeteran: false,
    };

    service.applyAction(lobby.gameId, "player-1", {
      type: "SET_CITY_PRODUCTION",
      payload: {
        cityId: cityTile.structure.id,
        item: { type: "unit", unitType: "Warrior" },
      },
    });

    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });
    service.applyAction(lobby.gameId, "player-2", {
      type: "END_TURN",
      payload: {},
    });
    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });

    const updated = service.getGame(lobby.gameId);
    const originTile = updated.tiles.find((tile) => tile.id === pair.origin.id);
    expect(originTile?.unit?.id).toBe("garrison");
    const producedTile = updated.tiles.find(
      (tile) =>
        tile.unit &&
        tile.unit.id !== "garrison" &&
        tile.unit.ownerId === "player-1"
    );
    expect(producedTile).toBeTruthy();
  });

  it("lets a worker build a fort consuming population", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const buildPair = findAdjacentPair(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, buildPair?.origin.id ?? "");
    if (!buildPair || !secondTile) {
      throw new Error("Tiles missing");
    }
    service.placeCapital(lobby.gameId, "player-1", buildPair.origin.id);
    service.placeCapital(lobby.gameId, "player-2", secondTile.id);

    const worker = addWorkerToTile(
      lobby.gameId,
      "player-1",
      buildPair.neighbor.id
    );
    const cityTile = getCityTile(lobby.gameId, "player-1");
    if (!cityTile?.structure) {
      throw new Error("City not found");
    }
    const city = cityTile.structure as CityData;
    city.population = 100;
    const previousPopulation = city.population;

    service.applyAction(lobby.gameId, "player-1", {
      type: "BUILD_STRUCTURE",
      payload: {
        workerId: worker.id,
        structureType: "Fort",
        position: { x: buildPair.neighbor.x, y: buildPair.neighbor.y },
        fromCityId: city.id,
      },
    });

    const updated = service.getGame(lobby.gameId);
    const originTile = updated.tiles.find(
      (tile) => tile.id === buildPair.neighbor.id
    );
    expect(originTile?.structure?.type).toBe("Fort");
    const updatedCity = updated.tiles.find((tile) => tile.id === cityTile.id)
      ?.structure as CityData | undefined;
    expect(updatedCity?.population).toBeLessThan(previousPopulation);
  });

  it("moves a warrior to adjacent tile and exhausts movement", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const pair = findAdjacentPair(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, pair?.origin.id ?? "");
    if (!pair || !secondTile) {
      throw new Error("Tiles missing");
    }
    service.placeCapital(lobby.gameId, "player-1", pair.origin.id);
    service.placeCapital(lobby.gameId, "player-2", secondTile.id);

    const warrior = addWarriorToTile(lobby.gameId, "player-1", pair.origin.id);
    warrior.movementPoints = 1;
    const destination = pair.neighbor;

    service.applyAction(lobby.gameId, "player-1", {
      type: "MOVE_UNIT",
      payload: {
        unitId: warrior?.id,
        path: [{ x: destination.x, y: destination.y }],
      },
    });

    const updated = service.getGame(lobby.gameId);
    const origin = updated.tiles.find((tile) => tile.id === pair.origin.id);
    const moved = updated.tiles.find((tile) => tile.id === destination.id);
    expect(origin?.unit).toBeFalsy();
    expect(moved?.unit?.id).toBe(warrior?.id);
    expect(moved?.unit?.movementPoints).toBe(0);
  });

  it("founding a new city increases population cap", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const firstTile = findPlaceableTile(lobby.gameId);
    const secondTile = findSecondTile(lobby.gameId, firstTile?.id ?? "");
    if (!firstTile || !secondTile) {
      throw new Error("Tiles missing");
    }
    service.placeCapital(lobby.gameId, "player-1", firstTile.id);
    service.placeCapital(lobby.gameId, "player-2", secondTile.id);

    const pair = findAdjacentPair(lobby.gameId);
    if (!pair) {
      throw new Error("No adjacent tile for settler");
    }
    const settler = addSettlerToTile(lobby.gameId, "player-1", pair.origin.id);
    const before = service
      .getGame(lobby.gameId)
      .players.find((p) => p.id === "player-1")?.populationCap;

    service.applyAction(lobby.gameId, "player-1", {
      type: "FOUND_CITY",
      payload: {
        settlerId: settler.id,
      },
    });

    const afterPlayer = service
      .getGame(lobby.gameId)
      .players.find((p) => p.id === "player-1");
    expect(afterPlayer?.populationCap).toBeGreaterThan(before ?? 0);
  });
});
