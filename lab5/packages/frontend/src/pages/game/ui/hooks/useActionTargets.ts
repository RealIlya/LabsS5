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

  const moveTargets = useMemo(() => {
    if (
      activeAction !== "move" ||
      !selectedTile ||
      !selectedTileUnit ||
      !canUseActions
    )
      return new Set<string>();

    const targets = new Set<string>();
    const parity = selectedTile.y % 2 === 0 ? "even" : "odd";

    HEX_NEIGHBORS[parity]
      .map(({ dx, dy }) => ({ x: selectedTile.x + dx, y: selectedTile.y + dy }))
      .forEach(({ x, y }) => {
        const candidate = mapTiles.find((t) => t.x === x && t.y === y);
        if (candidate && isTilePassable(candidate, selfId)) {
          targets.add(candidate.id);
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

  return { moveTargets, attackTargets };
};
