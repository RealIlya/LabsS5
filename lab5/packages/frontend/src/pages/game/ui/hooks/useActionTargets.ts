import { useMemo } from "react";
import type { MapTile, MapUnit } from "../types";
import {
  HEX_NEIGHBORS,
  isTileAttackTarget,
  isTilePassable,
} from "../mapConfig";

interface Params {
  activeAction: null | "move" | "attack";
  selectedTile: MapTile | null;
  selectedTileUnit: MapUnit | null;
  mapTiles: MapTile[];
  selfId: string | null;
  canUseActions: boolean;
}

export const useActionTargets = ({
  activeAction,
  selectedTile,
  selectedTileUnit,
  mapTiles,
  selfId,
  canUseActions,
}: Params) => {
  const hexDistance = (a: MapTile, b: MapTile) => {
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

  const { moveTargets, movePaths } = useMemo(() => {
    if (
      activeAction !== "move" ||
      !selectedTile ||
      !selectedTileUnit ||
      !canUseActions
    ) {
      return {
        moveTargets: new Set<string>(),
        movePaths: new Map<string, { x: number; y: number }[]>(),
      };
    }

    const maxSteps = selectedTileUnit.movementPoints ?? 0;
    if (maxSteps <= 0) {
      return {
        moveTargets: new Set<string>(),
        movePaths: new Map<string, { x: number; y: number }[]>(),
      };
    }

    const coordKey = (x: number, y: number) => `${x},${y}`;
    const tileByCoord = new Map<string, MapTile>();
    mapTiles.forEach((tile) => {
      tileByCoord.set(coordKey(tile.x, tile.y), tile);
    });

    const startKey = coordKey(selectedTile.x, selectedTile.y);
    const queue: string[] = [startKey];
    const distances = new Map<string, number>([[startKey, 0]]);
    const parents = new Map<string, string | null>([[startKey, null]]);

    // Логика BFS
    while (queue.length > 0) {
      const currentKey = queue.shift() as string;
      const currentDist = distances.get(currentKey) ?? 0;
      if (currentDist >= maxSteps) continue;
      const currentTile = tileByCoord.get(currentKey);
      if (!currentTile) continue;
      const parity = currentTile.y % 2 === 0 ? "even" : "odd";
      HEX_NEIGHBORS[parity].forEach(({ dx, dy }) => {
        const nx = currentTile.x + dx;
        const ny = currentTile.y + dy;
        const neighborKey = coordKey(nx, ny);
        if (distances.has(neighborKey)) return;
        const neighbor = tileByCoord.get(neighborKey);
        if (!neighbor) return;
        if (!isTilePassable(neighbor, selfId)) return;
        const nextDist = currentDist + 1;
        if (nextDist > maxSteps) return;
        distances.set(neighborKey, nextDist);
        parents.set(neighborKey, currentKey);
        queue.push(neighborKey);
      });
    }

    const moveTargets = new Set<string>();
    const movePaths = new Map<string, { x: number; y: number }[]>();

    parents.forEach((parentKey, key) => {
      if (key === startKey) return;
      const tile = tileByCoord.get(key);
      if (!tile) return;
      moveTargets.add(tile.id);
      const path: { x: number; y: number }[] = [];
      let currentKey: string | null = key;
      while (currentKey && currentKey !== startKey) {
        const currentTile = tileByCoord.get(currentKey);
        if (!currentTile) break;
        path.push({ x: currentTile.x, y: currentTile.y });
        currentKey = parents.get(currentKey) ?? null;
      }
      path.reverse();
      movePaths.set(tile.id, path);
    });

    return { moveTargets, movePaths };
  }, [
    activeAction,
    mapTiles,
    selectedTile,
    selectedTileUnit,
    selfId,
    canUseActions,
  ]);

  const attackTargets = useMemo(() => {
    if (
      activeAction !== "attack" ||
      !selectedTile ||
      !selectedTileUnit ||
      !canUseActions
    )
      return new Set<string>();

    const targets = new Set<string>();
    const baseRange = selectedTileUnit.type === "Archer" ? 2 : 1;
    const range =
      selectedTileUnit.type === "Archer" && selectedTile.terrain === "Hills"
        ? baseRange + 1
        : baseRange;

    mapTiles.forEach((candidate) => {
      if (hexDistance(selectedTile, candidate) <= range) {
        if (isTileAttackTarget(candidate, selfId)) {
          targets.add(candidate.id);
        }
      }
    });
    return targets;
  }, [
    activeAction,
    mapTiles,
    selectedTile,
    selectedTileUnit,
    selfId,
    canUseActions,
  ]);

  return { moveTargets, movePaths, attackTargets };
};
