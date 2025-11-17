import type { UnitType } from "./unit.types";

export type CityImprovementType = "Barracks" | "Granary";
export type StandaloneStructureType = "Farm" | "Fort";
export type StructureType =
  | "City"
  | CityImprovementType
  | StandaloneStructureType;

export interface BaseStructure {
  id: string;
  ownerId: string;
}

export type CityProductionItem =
  | { type: "unit"; unitType: UnitType }
  | { type: "improvement"; improvementType: CityImprovementType };

export interface CityData extends BaseStructure {
  type: "City";
  population: number;
  improvement: CityImprovementType | null;
  fortification: number;
  production: {
    item: CityProductionItem;
    progressTurns: number;
  } | null;
}

export interface StandaloneStructureData extends BaseStructure {
  type: StandaloneStructureType;
}

export type StructureData = CityData | StandaloneStructureData;

export interface StructureRule {
  cost: number;
  productionTurns: number;
  category: "City" | "CityImprovement" | "Standalone";
  effects: {
    populationGrowthBonus?: number;
    basePopulationGrowth?: number;
    empirePopulationCapIncrease?: number;
    garrisonDefenseBonus?: number;
    veteranBonus?: { attack: number; health: number };
    hasZoneOfControl?: boolean;
  };
}

export type StructureRules = Record<StructureType, StructureRule>;

export const STRUCTURE_RULES: StructureRules = {
  City: {
    cost: 0,
    productionTurns: 0,
    category: "City",
    effects: {
      basePopulationGrowth: 1,
      garrisonDefenseBonus: 0.5,
    },
  },
  Barracks: {
    cost: 40,
    productionTurns: 5,
    category: "CityImprovement",
    effects: {
      veteranBonus: { attack: 0.1, health: 0.1 },
    },
  },
  Granary: {
    cost: 40,
    productionTurns: 5,
    category: "CityImprovement",
    effects: {
      populationGrowthBonus: 0.5,
    },
  },
  Farm: {
    cost: 20,
    productionTurns: 6,
    category: "Standalone",
    effects: {
      empirePopulationCapIncrease: 5,
    },
  },
  Fort: {
    cost: 50,
    productionTurns: 10,
    category: "Standalone",
    effects: {
      garrisonDefenseBonus: 1,
      hasZoneOfControl: true,
    },
  },
};
