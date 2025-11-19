import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Lobby } from "../../domain/lobby/lobby.types";
import type {
  GameState,
  GameTileState,
  GameStructureState,
} from "../../domain/game/game-state";
import { memoryStore } from "../../infrastructure/store/memory-store";

const MAP_COLUMNS = 18;
const MAP_ROWS = 14;
const PLAYER_COLORS = ["#5FB49C", "#FFB347", "#6C63FF", "#FF6F91"];
const EVEN_NEIGHBORS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
];
const ODD_NEIGHBORS = [
  { dx: -1, dy: -1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: -1, dy: 1 },
  { dx: 0, dy: 1 },
];

@Injectable()
export class GameService {
  getGame(gameId: string) {
    const game = memoryStore.getGame(gameId);
    if (!game) {
      throw new NotFoundException("Game not found");
    }
    return game;
  }

  createGameForLobby(lobby: Lobby): GameState {
    const gameState = this.buildGameState(lobby);
    memoryStore.saveGame(gameState);
    return gameState;
  }

  placeCapital(gameId: string, playerId: string, tileId: string) {
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
    if (!this.isTilePlaceable(tile)) {
      throw new BadRequestException("Tile is not suitable for a capital");
    }
    if (tile.structure) {
      throw new BadRequestException("Tile already occupied");
    }

    const structureId = `city-${tile.id}`;
    tile.structure = {
      id: structureId,
      type: "City",
      ownerId: player.id,
      ownerName: player.name,
      isCapital: true,
    };

    player.capitalCityId = structureId;
    player.populationCap = Math.max(player.populationCap, 50);
    player.currentPopulation = Math.max(player.currentPopulation, 35);
    game.population = this.calculatePopulation(game.players);

    if (game.players.every((p) => p.capitalCityId)) {
      game.phase = "running";
    }

    memoryStore.saveGame(game);
    return game;
  }

  private buildGameState(lobby: Lobby): GameState {
    const seed = this.stringToSeed(lobby.id);
    const tiles = this.generateTiles(seed);

    const players = lobby.players.map((player, index) => ({
      id: player.id,
      name: player.nickname,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      populationCap: 0,
      currentPopulation: 0,
      status: "playing" as const,
      capitalCityId: null,
    }));

    return {
      id: lobby.gameId,
      turn: 1,
      currentPlayer: lobby.players[0]?.nickname ?? "Commander",
      population: this.calculatePopulation(players),
      phase: "capital-placement",
      map: {
        columns: MAP_COLUMNS,
        rows: MAP_ROWS,
      },
      players,
      tiles,
    };
  }

  private generateTiles(seed: number): GameTileState[] {
    const tiles: GameTileState[] = [];
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLUMNS; x += 1) {
        const elevation = this.sampleHeight(x, y, seed);
        tiles.push({
          id: `${x}-${y}`,
          x,
          y,
          terrain: this.pickTerrain(elevation),
        });
      }
    }
    return tiles;
  }

  private isTilePlaceable(tile: GameTileState) {
    return tile.terrain !== "Water" && tile.terrain !== "Mountains";
  }

  private decorateStartingArea(
    tiles: GameTileState[],
    x: number,
    y: number,
    ownerId: string,
    ownerName: string,
    seed: number
  ) {
    const neighbors = this.getNeighbors(x, y);
    neighbors.forEach((coord, index) => {
      const tile = this.getTile(tiles, coord.x, coord.y);
      if (!tile || tile.terrain === "Water") {
        return;
      }

      // Ensure starting ring is easy to traverse
      if (tile.terrain === "Mountains") {
        tile.terrain = "Hills";
      }

      if (!tile.structure && index < 2) {
        tile.structure = {
          id: `farm-${tile.id}`,
          type: "Farm",
          ownerId,
          ownerName,
        };
      } else if (!tile.unit && index === 2) {
        tile.unit = { type: "Settler", owner: ownerName };
      } else if (!tile.unit && index === 3) {
        tile.unit = { type: "Worker", owner: ownerName };
      } else if (!tile.structure && this.randomFromSeed(coord.x, coord.y, seed) > 0.7) {
        tile.structure = {
          id: `fort-${tile.id}`,
          type: "Fort",
          ownerId,
          ownerName,
        };
      }
    });
  }

  private decorateNeutralTiles(tiles: GameTileState[], seed: number) {
    for (const tile of tiles) {
      if (tile.structure || tile.terrain === "Water") {
        continue;
      }
      const roll = this.randomFromSeed(tile.x + 11, tile.y + 19, seed);
      if (tile.terrain === "Mountains" && roll > 0.92) {
        tile.structure = {
          id: `neutral-fort-${tile.id}`,
          type: "Fort",
          ownerId: "neutral",
          ownerName: "Neutral",
        };
        continue;
      }
      if (roll > 0.965 && !tile.unit) {
        tile.unit = {
          type: roll > 0.985 ? "Horseman" : "Spearman",
          owner: "Neutral",
        };
      } else if (roll > 0.93 && !tile.structure) {
        const type = roll > 0.975 ? "Granary" : "Farm";
        tile.structure = {
          id: `neutral-${type.toLowerCase()}-${tile.id}`,
          type,
          ownerId: "neutral",
          ownerName: "Neutral",
        };
      }
    }
  }

  private getTile(tiles: GameTileState[], x: number, y: number) {
    if (x < 0 || x >= MAP_COLUMNS || y < 0 || y >= MAP_ROWS) {
      return null;
    }
    return tiles[y * MAP_COLUMNS + x];
  }

  private getNeighbors(x: number, y: number) {
    const offsets = y % 2 === 0 ? EVEN_NEIGHBORS : ODD_NEIGHBORS;
    return offsets
      .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
      .filter(
        (coord) =>
          coord.x >= 0 &&
          coord.x < MAP_COLUMNS &&
          coord.y >= 0 &&
          coord.y < MAP_ROWS
      );
  }

  private getSpawnPositions(count: number) {
    const marginX = 3;
    const marginY = 2;
    const presets = [
      { x: marginX, y: marginY },
      { x: MAP_COLUMNS - marginX - 1, y: MAP_ROWS - marginY - 1 },
      { x: marginX, y: MAP_ROWS - marginY - 1 },
      { x: MAP_COLUMNS - marginX - 1, y: marginY },
    ];
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i += 1) {
      positions.push(presets[i] ?? { x: marginX + i, y: marginY + (i % 3) });
    }
    return positions;
  }

  private pickTerrain(value: number) {
    if (value < 0.1) {
      return "Water";
    }
    if (value < 0.3) {
      return "Plains";
    }
    if (value < 0.55) {
      return "Forest";
    }
    if (value < 0.78) {
      return "Hills";
    }
    return "Mountains";
  }

  private sampleHeight(x: number, y: number, seed: number) {
    const nx = x / MAP_COLUMNS - 0.5;
    const ny = y / MAP_ROWS - 0.5;
    const distance = Math.sqrt(nx * nx + ny * ny);
    const base = this.randomFromSeed(x, y, seed);
    const variation = this.randomFromSeed(x * 2, y * 2, seed + 37);
    return base * 0.7 + variation * 0.3 - distance * 0.5;
  }

  private randomFromSeed(x: number, y: number, seed: number) {
    const value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 0.353);
    const fractional = value - Math.trunc(value);
    return fractional < 0 ? fractional + 1 : fractional;
  }

  private stringToSeed(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) + 1;
  }

  private calculatePopulation(players: GameState["players"]) {
    return players.reduce(
      (acc, player) => ({
        current: acc.current + player.currentPopulation,
        cap: acc.cap + player.populationCap,
      }),
      { current: 0, cap: 0 }
    );
  }
}
