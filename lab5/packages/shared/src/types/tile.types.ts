import type { HexCoord } from "./hex.types";
import type { TerrainType } from "./terrain.types";
import type { StructureData } from "./structure.types";
import type { UnitData } from "./unit.types";

export interface TileData extends HexCoord {
  id: string;
  terrain: TerrainType;
  ownerId: string | null;
  unit?: UnitData;
  structure?: StructureData;
}
