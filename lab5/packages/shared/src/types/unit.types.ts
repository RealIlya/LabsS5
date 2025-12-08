import type { CityImprovementType, StructureType } from "./structure.types";

export type UnitType =
  | "Warrior"
  | "Spearman"
  | "Archer"
  | "Horseman"
  | "Settler"
  | "Worker";

export interface UnitData {
  id: string;
  ownerId: string;
  ownerName: string;
  type: UnitType;
  health: number;
  maxHealth: number;
  attack: number;
  movementPoints: number;
  isVeteran: boolean;
}

export interface UnitBaseStats {
  attack: number;
  health: number;
  movement: number;
}

export interface UnitAbility {
  range?: number;
  bonusVs?: { type: UnitType; multiplier: number }[];
  canBuildCity?: boolean;
  canBuildStructures?: Exclude<StructureType, "City" | CityImprovementType>[];
  canAttack?: boolean;
}

export interface UnitRule {
  cost: number;
  productionTurns: number;
  baseStats: UnitBaseStats;
  abilities: UnitAbility;
}

export type UnitRules = Record<UnitType, UnitRule>;

export const UNIT_RULES: UnitRules = {
  Warrior: {
    cost: 8,
    productionTurns: 1,
    baseStats: { attack: 10, health: 20, movement: 2 },
    abilities: {},
  },
  Spearman: {
    cost: 12,
    productionTurns: 1,
    baseStats: { attack: 8, health: 25, movement: 2 },
    abilities: {
      bonusVs: [{ type: "Horseman", multiplier: 2 }],
    },
  },
  Archer: {
    cost: 14,
    productionTurns: 1,
    baseStats: { attack: 7, health: 15, movement: 2 },
    abilities: {
      range: 2,
    },
  },
  Horseman: {
    cost: 18,
    productionTurns: 2,
    baseStats: { attack: 9, health: 20, movement: 4 },
    abilities: {},
  },
  Worker: {
    cost: 10,
    productionTurns: 2,
    baseStats: { attack: 0, health: 10, movement: 2 },
    abilities: {
      canAttack: false,
      canBuildStructures: ["Farm", "Fort"],
    },
  },
  Settler: {
    cost: 30,
    productionTurns: 3,
    baseStats: { attack: 0, health: 10, movement: 2 },
    abilities: {
      canAttack: false,
      canBuildCity: true,
    },
  },
};
