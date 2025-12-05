import type {
  CityData,
  StandaloneStructureData,
  StructureData,
  TerrainType,
  UnitType,
} from "@hex/shared";

export type MapStructure = StructureData;
export type CityStructure = CityData;
export type StandaloneStructure = StandaloneStructureData;

export interface MapUnit {
  id: string;
  type: UnitType;
  ownerId: string;
  ownerName: string;
  health: number;
  isVeteran: boolean;
  movementPoints?: number;
}

export interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  ownerId: string | null;
  ownerName: string | null;
  structure?: MapStructure;
  unit?: MapUnit;
}
