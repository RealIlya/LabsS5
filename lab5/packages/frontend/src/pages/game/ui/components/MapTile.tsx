import type { MapStructure, MapTile as MapTileType } from "../types";
import cn from "classnames";

const unitEmoji: Record<string, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🏳️",
  Worker: "🔨",
};

const structureEmoji: Record<MapStructure["type"], string> = {
  City: "🏰",
  Farm: "🌾",
  Fort: "🧱",
};

interface MapTileProps {
  tile: MapTileType;
  selected: boolean;
  blocked: boolean;
  cityBlocked?: boolean;
  highlighted?: boolean;
  territoryColor?: string;
  controlColor?: string;
  hexConfig: { WIDTH: number; HEIGHT: number; ROW_SPACING_V: number };
  terrainColor: Record<MapTileType["terrain"], string>;
  onSelect: (tile: MapTileType) => void;
}

export function MapTile({
  tile,
  selected,
  blocked,
  cityBlocked = false,
  highlighted = false,
  territoryColor,
  controlColor,
  hexConfig,
  terrainColor,
  onSelect,
}: MapTileProps) {
  const offsetX =
    tile.x * hexConfig.WIDTH + (tile.y % 2 ? hexConfig.WIDTH / 2 : 0);
  const offsetY = tile.y * hexConfig.ROW_SPACING_V;

  return (
    <div
      key={tile.id}
      className={cn("game__tile", {
        "game__tile--selected": selected,
        "game__tile--blocked": blocked,
        "game__tile--city-blocked": cityBlocked,
        "game__tile--highlight": highlighted,
        "game__tile--owned": Boolean(territoryColor),
        "game__tile--control": Boolean(controlColor),
      })}
      onClick={() => onSelect(tile)}
      style={{
        backgroundColor: terrainColor[tile.terrain],
        width: hexConfig.WIDTH,
        height: hexConfig.HEIGHT,
        left: offsetX,
        top: offsetY,
        // Inline CSS vars for overlays
        ["--tile-territory-color" as string]: territoryColor,
        ["--tile-control-color" as string]: controlColor,
      }}
    >
      {tile.structure && (
        <span className="game__tile-structure">
          {tile.structure.type === "City" && tile.structure.isCapital
            ? "🏠"
            : structureEmoji[tile.structure.type] ?? "🏗️"}
        </span>
      )}
      {tile.unit && (
        <span className="game__tile-unit">
          {unitEmoji[tile.unit.type] ?? "🎯"}
        </span>
      )}
    </div>
  );
}
