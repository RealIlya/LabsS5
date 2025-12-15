import type { TerrainType, UnitType } from "@hex/shared";
import { EVEN_NEIGHBORS, ODD_NEIGHBORS } from "@hex/shared";
import type { MapTile } from "./types";

export const HEX_CONFIG = {
  SIZE: 60,
  get HEIGHT() {
    return this.SIZE * 2;
  },
  get WIDTH() {
    return (Math.sqrt(3) / 2) * this.HEIGHT;
  },
  get ROW_SPACING_V() {
    return this.HEIGHT * 0.75;
  },
};

// Offset coordinates: odd rows are shifted to the right (odd-r layout)
// See https://www.redblobgames.com/grids/hex-grids/coordinates/#offset
export const HEX_NEIGHBORS = {
  // even rows (row index % 2 === 0)
  even: EVEN_NEIGHBORS,
  // odd rows are shifted right
  odd: ODD_NEIGHBORS,
};

export const terrainColor: Record<TerrainType, string> = {
  Plains: "#86bb63",
  Forest: "#4a7c47",
  Hills: "#d4b483",
  Mountains: "#718096",
  Water: "#63b3ed",
};

export const terrainTexture: Record<TerrainType, string> = {
  Plains: "/tiles/Plain.png",
  Forest: "/tiles/Forest.png",
  Hills: "/tiles/Hill.png",
  Mountains: "/tiles/Mountain.png",
  Water: "/tiles/Water.png",
};

export const unitEmoji: Record<UnitType, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🏳️",
  Worker: "🔨",
};

export const isTilePassable = (
  tile: MapTile,
  playerId: string | null,
  unitType?: UnitType
) => {
  const canCrossWater = unitType === "Horseman" && tile.terrain === "Water";
  // Нельзя ходить по горам; воду может пересечь только Всадник
  if (tile.terrain === "Mountains") return false;
  if (tile.terrain === "Water" && !canCrossWater) return false;

  // Нельзя вставать на клетку, где уже есть юнит (свой или чужой)
  // (Предполагаем отсутствие стеков)
  if (tile.unit) return false;

  // Нельзя проходить сквозь чужие постройки (если это правило игры)
  // Обычно постройки не блокируют, если там нет юнита, но оставим на усмотрение правил
  // if (tile.structure && tile.structure.ownerId !== playerId) return false;

  return true;
};

export const isTileAttackTarget = (
  tile: MapTile,
  attackerId: string | null
) => {
  if (tile.terrain === "Water" || tile.terrain === "Mountains") return false;

  // Целью атаки может быть только клетка с вражеским юнитом или вражеской постройкой
  const hasEnemyUnit = tile.unit && tile.unit.ownerId !== attackerId;
  const hasEnemyStructure =
    tile.structure && tile.structure.ownerId !== attackerId;

  return Boolean(hasEnemyUnit || hasEnemyStructure);
};
