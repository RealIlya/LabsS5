import { describe, it, expect, beforeEach } from "vitest";
import { GameService } from "./game.service";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
  type CityData,
  type UnitData,
} from "@hex/shared";
import type { GameState } from "../../domain/game/game-state";
import type { Lobby } from "../../domain/lobby/lobby.types";
import { MemoryStore } from "../../infrastructure/store/memory-store";
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
      isHost: true,
      isReady: true,
    },
    {
      id: "player-2",
      nickname: "Bravo",
      isHost: false,
      isReady: true,
    },
  ],
});

const findPlaceableTile = (gameId: string, store: MemoryStore) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  return game.tiles.find(
    (tile) =>
      tile.terrain !== "Water" &&
      tile.terrain !== "Mountains" &&
      !tile.structure
  );
};

const findSecondTile = (
  gameId: string,
  excludeId: string,
  store: MemoryStore
) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  const excludeTile = game.tiles.find((t) => t.id === excludeId);
  const isAdjacent = (
    tile: (typeof game.tiles)[number],
    target: (typeof game.tiles)[number]
  ) => {
    const parity = target.y % 2 === 0 ? "even" : "odd";
    return offsets[parity].some(
      ({ dx, dy }) => tile.x === target.x + dx && tile.y === target.y + dy
    );
  };
  return game.tiles.find(
    (tile) =>
      tile.id !== excludeId &&
      tile.terrain !== "Water" &&
      tile.terrain !== "Mountains" &&
      !tile.structure &&
      (!excludeTile || !isAdjacent(tile, excludeTile))
  );
};

const isAdjacentToCityOfOther = (
  gameId: string,
  tileId: string,
  ownerId: string,
  store: MemoryStore
) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile) throw new Error("Tile not found");
  const parity = tile.y % 2 === 0 ? "even" : "odd";
  return offsets[parity].some(({ dx, dy }) => {
    const neighbor = game.tiles.find(
      (t) => t.x === tile.x + dx && t.y === tile.y + dy
    );
    return (
      neighbor?.structure?.type === "City" &&
      neighbor.structure.ownerId !== ownerId
    );
  });
};

const findSafeCityTile = (
  gameId: string,
  ownerId: string,
  store: MemoryStore
) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  return game.tiles.find(
    (t) =>
      t.terrain !== "Water" &&
      t.terrain !== "Mountains" &&
      !t.structure &&
      !isAdjacentToCityOfOther(gameId, t.id, ownerId, store)
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

const getCityTile = (gameId: string, ownerId: string, store: MemoryStore) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  return game.tiles.find((tile) => tile.structure?.ownerId === ownerId);
};

const addUnitToTile = (
  gameId: string,
  tileId: string,
  ownerId: string,
  unitType: UnitData["type"],
  overrides: Partial<UnitData> = {},
  store: MemoryStore
) => {
  const game = store.getGame(gameId) as GameState | null;
  if (!game) throw new Error("Game not found");
  const tile = game.tiles.find((t) => t.id === tileId);
  if (!tile) {
    throw new Error("Tile not found");
  }
  const base = UNIT_RULES[unitType].baseStats;
  const unit: UnitData = {
    id: `${ownerId}-${unitType}-${Date.now()}`,
    ownerId,
    ownerName: ownerId,
    type: unitType,
    health: base.health,
    maxHealth: base.health,
    attack: base.attack,
    movementPoints: base.movement,
    isVeteran: false,
    ...overrides,
  };
  tile.unit = unit;
  return unit;
};

const addWorkerToTile = (
  gameId: string,
  ownerId: string,
  tileId: string,
  store: MemoryStore
) => {
  return addUnitToTile(gameId, tileId, ownerId, "Worker", {}, store);
};

const addSettlerToTile = (
  gameId: string,
  ownerId: string,
  tileId: string,
  store: MemoryStore
) => {
  return addUnitToTile(gameId, tileId, ownerId, "Settler", {}, store);
};

const addWarriorToTile = (
  gameId: string,
  ownerId: string,
  tileId: string,
  store: MemoryStore
) => {
  return addUnitToTile(
    gameId,
    tileId,
    ownerId,
    "Warrior",
    {
      movementPoints: 1,
    },
    store
  );
};

const isTilePassable = (tile: GameState["tiles"][number]) =>
  tile.terrain !== "Water" &&
  tile.terrain !== "Mountains" &&
  !tile.structure &&
  !tile.unit;

const findAdjacentPair = (gameId: string, store: MemoryStore) => {
  const game = store.getGame(gameId) as GameState | null;
  if (!game) {
    throw new Error("Game not found");
  }
  for (const tile of game.tiles) {
    if (!isTilePassable(tile)) continue;
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

const hexDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
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
};

const findFortSpot = (gameId: string, store: MemoryStore) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  const cities = game.tiles.filter((t) => t.structure?.type === "City");
  return game.tiles.find((t) => {
    if (!isTilePassable(t) || t.structure || t.terrain === "Forest")
      return false;
    // distance > 2 from any city
    return cities.every((c) => hexDistance(c, t) > 2);
  });
};

const ensureFarmSpot = (
  gameId: string,
  ownerId: string,
  store: MemoryStore
) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  const cityTile = game.tiles.find(
    (tile) =>
      tile.structure?.type === "City" && tile.structure.ownerId === ownerId
  );
  if (!cityTile) {
    throw new Error("Owner city not found");
  }
  const parity = cityTile.y % 2 === 0 ? "even" : "odd";
  for (const { dx, dy } of offsets[parity]) {
    const neighbor = game.tiles.find(
      (tile) =>
        tile.x === cityTile.x + dx &&
        tile.y === cityTile.y + dy &&
        tile.ownerId === ownerId &&
        !tile.structure &&
        isTilePassable(tile)
    );
    if (neighbor) {
      return neighbor;
    }
  }
  throw new Error("No neighboring tile for farm");
};

const getSettlerTileForPlayer = (
  gameId: string,
  ownerId: string,
  store: MemoryStore
) => {
  const game = store.getGame(gameId);
  if (!game) throw new Error("Game not found");
  const tile = game.tiles.find(
    (t) => t.unit?.type === "Settler" && t.unit.ownerId === ownerId
  );
  if (!tile) {
    throw new Error(`Settler for ${ownerId} not found`);
  }
  return tile;
};

describe("GameService actions", () => {
  const testStore = new MemoryStore();
  const service = new GameService(new MapService(), testStore);

  beforeEach(() => {
    testStore.clear();
  });

  it("switches to running phase once every player has placed a capital", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);

    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );

    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    let game = service.getGame(lobby.gameId);
    expect(game.phase).toBe("capital-placement");

    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);
    game = service.getGame(lobby.gameId);
    expect(game.phase).toBe("running");
    expect(game.currentPlayerId).toBe("player-1");
  });

  it("advances the turn when END_TURN action is applied", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );

    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const before = service.getGame(lobby.gameId);
    expect(before.currentPlayerId).toBe("player-1");

    service.applyAction(lobby.gameId, "player-1", {
      type: "END_TURN",
      payload: {},
    });

    const after = service.getGame(lobby.gameId);
    expect(after.currentPlayerId).toBe("player-2");
  });

  it("automatically advances the turn when timer expires", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );

    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const storedGame = testStore.getGame(lobby.gameId);
    if (!storedGame) {
      throw new Error("Game not found");
    }
    storedGame.turnEndsAt = new Date(Date.now() - 5_000).toISOString();
    testStore.saveGame(storedGame);

    const updated = service.getGame(lobby.gameId);
    expect(updated.currentPlayerId).toBe("player-2");
  });

  it("completes warrior production after required turns", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);

    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );

    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const cityTile = getCityTile(lobby.gameId, "player-1", testStore);
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

    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );

    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const cityTile = getCityTile(lobby.gameId, "player-1", testStore);
    if (!cityTile?.structure) {
      throw new Error("City not found");
    }
    cityTile.unit = {
      id: "garrison",
      ownerId: "player-1",
      ownerName: "player-1",
      type: "Warrior",
      health: 20,
      maxHealth: 20,
      attack: 10,
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
    const originTile = updated.tiles.find((tile) => tile.id === cityTile.id);
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
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const fortSpot = findFortSpot(lobby.gameId, testStore);
    if (!fortSpot) {
      throw new Error("No valid fort spot");
    }

    const worker = addWorkerToTile(
      lobby.gameId,
      "player-1",
      fortSpot.id,
      testStore
    );
    const cityTile = getCityTile(lobby.gameId, "player-1", testStore);
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
        position: { x: fortSpot.x, y: fortSpot.y },
        fromCityId: city.id,
      },
    });

    const updated = service.getGame(lobby.gameId);
    const originTile = updated.tiles.find((tile) => tile.id === fortSpot.id);
    expect(originTile?.structure?.type).toBe("Fort");
    const updatedCity = updated.tiles.find((tile) => tile.id === cityTile.id)
      ?.structure as CityData | undefined;
    expect(updatedCity?.population).toBeLessThan(previousPopulation);
  });

  it("builds a farm using the population of the owning city", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const farmSpot = ensureFarmSpot(lobby.gameId, "player-1", testStore);
    farmSpot.ownerId = "player-1";
    farmSpot.structure = undefined;
    farmSpot.terrain = "Plains";
    const worker = addWorkerToTile(
      lobby.gameId,
      "player-1",
      farmSpot.id,
      testStore
    );
    const cityTile = getCityTile(lobby.gameId, "player-1", testStore);
    if (!cityTile?.structure) {
      throw new Error("City not found");
    }
    const city = cityTile.structure as CityData;
    city.population = 80;
    const before = city.population;

    service.applyAction(lobby.gameId, "player-1", {
      type: "BUILD_STRUCTURE",
      payload: {
        workerId: worker.id,
        structureType: "Farm",
        position: { x: farmSpot.x, y: farmSpot.y },
      },
    });

    const updated = service.getGame(lobby.gameId);
    const tileAfter = updated.tiles.find((t) => t.id === farmSpot.id);
    expect(tileAfter?.structure?.type).toBe("Farm");
    const updatedCity = updated.tiles.find((t) => t.id === cityTile.id)
      ?.structure as CityData | undefined;
    expect(updatedCity?.population).toBe(before - STRUCTURE_RULES.Farm.cost);
  });

  const ensureAdjacentAttackerTile = (
    gameId: string,
    enemyCityId: string,
    store: MemoryStore
  ) => {
    const game = store.getGame(gameId);
    if (!game) throw new Error("Game not found");
    const cityTile = game.tiles.find((tile) => tile.id === enemyCityId);
    if (!cityTile) throw new Error("City tile missing");
    const parity = cityTile.y % 2 === 0 ? "even" : "odd";
    const neighbor = offsets[parity]
      .map(({ dx, dy }) =>
        game.tiles.find(
          (candidate) =>
            candidate.x === cityTile.x + dx && candidate.y === cityTile.y + dy
        )
      )
      .find((tile) => tile);
    if (!neighbor) {
      throw new Error("No adjacent tile found");
    }
    neighbor.ownerId = "player-1";
    neighbor.structure = undefined;
    neighbor.unit = undefined;
    neighbor.terrain = "Plains";
    return neighbor.id;
  };

  it("destroys an enemy city when its fortification drops to zero", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const cityTile = getCityTile(lobby.gameId, "player-2", testStore);
    if (!cityTile?.structure) {
      throw new Error("Enemy city not found");
    }
    cityTile.unit = undefined;
    const neighborId = ensureAdjacentAttackerTile(
      lobby.gameId,
      cityTile.id,
      testStore
    );
    const attacker = addUnitToTile(
      lobby.gameId,
      neighborId,
      "player-1",
      "Archer",
      {},
      testStore
    );
    const enemyCity = cityTile.structure as CityData;
    enemyCity.isCapital = false;
    enemyCity.fortification = 5;

    service.applyAction(lobby.gameId, "player-1", {
      type: "ATTACK_UNIT",
      payload: {
        attackerId: attacker.id,
        defenderId: enemyCity.id,
      },
    });

    const updated = service.getGame(lobby.gameId);
    const destroyedTile = updated.tiles.find((t) => t.id === cityTile.id);
    expect(destroyedTile?.structure).toBeUndefined();
  });

  it("defeats a player when their capital is destroyed", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const cityTile = getCityTile(lobby.gameId, "player-2", testStore);
    if (!cityTile?.structure) {
      throw new Error("Enemy capital not found");
    }
    cityTile.unit = undefined;
    const neighborId = ensureAdjacentAttackerTile(
      lobby.gameId,
      cityTile.id,
      testStore
    );
    const attacker = addUnitToTile(
      lobby.gameId,
      neighborId,
      "player-1",
      "Archer",
      {},
      testStore
    );
    const enemyCapital = cityTile.structure as CityData;
    enemyCapital.fortification = 5;

    service.applyAction(lobby.gameId, "player-1", {
      type: "ATTACK_UNIT",
      payload: {
        attackerId: attacker.id,
        defenderId: enemyCapital.id,
      },
    });

    const updated = service.getGame(lobby.gameId);
    const destroyedTile = updated.tiles.find((t) => t.id === cityTile.id);
    expect(destroyedTile?.structure).toBeUndefined();
    const defeatedPlayer = updated.players.find((p) => p.id === "player-2");
    expect(defeatedPlayer?.status).toBe("defeated");
  });

  it("moves a warrior to adjacent tile and exhausts movement", () => {
    const lobby = makeLobby();
    service.createGameForLobby(lobby);

    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const pair = findAdjacentPair(lobby.gameId, testStore);
    if (!pair) {
      throw new Error("No adjacent pair");
    }
    const warrior = addWarriorToTile(
      lobby.gameId,
      "player-1",
      pair.origin.id,
      testStore
    );
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
    const p1SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-1",
      testStore
    );
    const p2SettlerTile = getSettlerTileForPlayer(
      lobby.gameId,
      "player-2",
      testStore
    );
    service.placeCapital(lobby.gameId, "player-1", p1SettlerTile.id);
    service.placeCapital(lobby.gameId, "player-2", p2SettlerTile.id);

    const safeTile = findSafeCityTile(lobby.gameId, "player-1", testStore);
    if (!safeTile) throw new Error("No safe tile for new city");
    const settler = addSettlerToTile(
      lobby.gameId,
      "player-1",
      safeTile.id,
      testStore
    );
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
