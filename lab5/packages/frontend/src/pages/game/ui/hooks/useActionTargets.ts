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
  const moveTargets = useMemo(() => {
    if (
      activeAction !== "move" ||
      !selectedTile ||
      !selectedTileUnit ||
      !canUseActions
    )
      return new Set<string>();

    const targets = new Set<string>();
    // Выбираем правильный набор смещений в зависимости от четности ряда (y)
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
    const parity = selectedTile.y % 2 === 0 ? "even" : "odd";

    HEX_NEIGHBORS[parity]
      .map(({ dx, dy }) => ({ x: selectedTile.x + dx, y: selectedTile.y + dy }))
      .forEach(({ x, y }) => {
        const candidate = mapTiles.find((t) => t.x === x && t.y === y);
        // Теперь передаем selfId, чтобы подсвечивать только врагов
        if (candidate && isTileAttackTarget(candidate, selfId)) {
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

  return { moveTargets, attackTargets };
};
