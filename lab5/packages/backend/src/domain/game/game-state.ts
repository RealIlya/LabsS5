import type {
  PlayerData,
  TerrainType,
  StructureType,
  UnitType,
} from "@hex/shared";

export type GamePhase = "capital-placement" | "running";

export interface GameStructureState {
  id: string;
  type: StructureType;
  ownerId: string;
  ownerName: string;
  isCapital?: boolean;
}

export interface GameTileState {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  structure?: GameStructureState;
  unit?: {
    type: UnitType;
    owner: string;
  };
}

export interface GameState {
  id: string;
  turn: number;
  currentPlayer: string;
  population: {
    current: number;
    cap: number;
  };
  phase: GamePhase;
  map: {
    columns: number;
    rows: number;
  };
  players: PlayerData[];
  tiles: GameTileState[];
}
