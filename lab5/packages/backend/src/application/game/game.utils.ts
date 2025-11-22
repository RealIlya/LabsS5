import type { GameTileState } from "../../domain/game/game-state";
import {
  EVEN_NEIGHBORS,
  MAP_COLUMNS,
  MAP_ROWS,
  ODD_NEIGHBORS,
} from "./game.constants";

export const isTilePlaceable = (tile: GameTileState) =>
  tile.terrain !== "Water" && tile.terrain !== "Mountains";

export const getTile = (tiles: GameTileState[], x: number, y: number) => {
  if (x < 0 || x >= MAP_COLUMNS || y < 0 || y >= MAP_ROWS) {
    return null;
  }
  return tiles[y * MAP_COLUMNS + x] ?? null;
};

export const getNeighbors = (x: number, y: number) => {
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
};

export const pickTerrain = (value: number) => {
  if (value < 0.1) return "Water";
  if (value < 0.3) return "Plains";
  if (value < 0.55) return "Forest";
  if (value < 0.78) return "Hills";
  return "Mountains";
};

export const sampleHeight = (x: number, y: number, seed: number) => {
  const nx = x / MAP_COLUMNS - 0.5;
  const ny = y / MAP_ROWS - 0.5;
  const distance = Math.sqrt(nx * nx + ny * ny);
  const base = randomFromSeed(x, y, seed);
  const variation = randomFromSeed(x * 2, y * 2, seed + 37);
  return base * 0.7 + variation * 0.3 - distance * 0.5;
};

export const randomFromSeed = (x: number, y: number, seed: number) => {
  const value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 0.353);
  const fractional = value - Math.trunc(value);
  return fractional < 0 ? fractional + 1 : fractional;
};

export const stringToSeed = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
};
