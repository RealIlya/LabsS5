export type TerrainType =
  | "Plains"
  | "Forest"
  | "Hills"
  | "Mountains"
  | "Water";

export interface TerrainRule {
  movementCost: number;
  defenseBonus: number;
}

export const TERRAIN_RULES: Record<TerrainType, TerrainRule> = {
  Plains: {
    movementCost: 1,
    defenseBonus: 0,
  },
  Forest: {
    movementCost: 2,
    defenseBonus: 0.2,
  },
  Hills: {
    movementCost: 2,
    defenseBonus: 0.3,
  },
  Mountains: {
    movementCost: Number.POSITIVE_INFINITY,
    defenseBonus: 0,
  },
  Water: {
    movementCost: Number.POSITIVE_INFINITY,
    defenseBonus: 0,
  },
};
