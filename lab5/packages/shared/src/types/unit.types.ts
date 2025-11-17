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
  type: UnitType;
  health: number;
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
    cost: 10,
    productionTurns: 2,
    baseStats: { attack: 10, health: 20, movement: 2 },
    abilities: {},
  },
  Spearman: {
    cost: 15,
    productionTurns: 8,
    baseStats: { attack: 8, health: 25, movement: 2 },
    abilities: {
      bonusVs: [{ type: "Horseman", multiplier: 2 }],
    },
  },
  Archer: {
    cost: 15,
    productionTurns: 5,
    baseStats: { attack: 7, health: 15, movement: 2 },
    abilities: {
      range: 2,
    },
  },
  Horseman: {
    cost: 25,
    productionTurns: 9,
    baseStats: { attack: 9, health: 20, movement: 4 },
    abilities: {},
  },
  Worker: {
    cost: 20,
    productionTurns: 5,
    baseStats: { attack: 0, health: 10, movement: 2 },
    abilities: {
      canAttack: false,
      canBuildStructures: ["Farm", "Fort"],
    },
  },
  Settler: {
    cost: 50,
    productionTurns: 20,
    baseStats: { attack: 0, health: 10, movement: 2 },
    abilities: {
      canAttack: false,
      canBuildCity: true,
    },
  },
};
