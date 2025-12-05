import cn from "classnames";
import type { CityImprovementType } from "@hex/shared";
import type { MapStructure, MapTile as MapTileType } from "../types";

const unitEmoji: Record<string, string> = {
  Warrior: "/units/Warrior.png",
  Spearman: "/units/Spearman.png",
  Archer: "/units/Archer.png",
  Horseman: "/units/Horseman.png",
  Settler: "/units/Settler.png",
  Worker: "/units/Worker.png",
};

const structureTextures: Record<MapStructure["type"], string> = {
  City: "/tiles/City.png",
  Farm: "/tiles/Farm.png",
  Fort: "/tiles/Fort.png",
};

const cityImprovementTextures: Record<CityImprovementType, string> = {
  Barracks: "/tiles/Baracks.png",
  Granary: "/tiles/Granary.png",
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
  terrainTextures: Record<MapTileType["terrain"], string>;
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
  terrainTextures,
  onSelect,
}: MapTileProps) {
  const offsetX =
    tile.x * hexConfig.WIDTH + (tile.y % 2 ? hexConfig.WIDTH / 2 : 0);
  const offsetY = tile.y * hexConfig.ROW_SPACING_V;
  const structureImage = tile.structure
    ? structureTextures[tile.structure.type]
    : null;
  const improvementType =
    tile.structure && tile.structure.type === "City"
      ? tile.structure.improvement
      : null;
  const improvementImage = improvementType
    ? cityImprovementTextures[improvementType]
    : null;

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
        backgroundImage: `url(${terrainTextures[tile.terrain]})`,
        width: hexConfig.WIDTH,
        height: hexConfig.HEIGHT,
        left: offsetX,
        top: offsetY,
        ["--tile-territory-color" as string]: territoryColor,
        ["--tile-control-color" as string]: controlColor,
      }}
    >
      {tile.structure && structureImage && (
        <span className="game__tile-structure">
          <img src={structureImage} alt={tile.structure.type} loading="lazy" />
          {tile.structure.type === "City" && improvementImage && (
            <span
              className="game__tile-improvement"
              aria-label="City improvement"
            >
              <img
                src={improvementImage}
                alt={`${improvementType} improvement`}
                loading="lazy"
              />
            </span>
          )}
          {tile.structure.type === "City" && tile.structure.isCapital && (
            <span className="game__tile-capital-badge" aria-label="Capital">
              ★
            </span>
          )}
        </span>
      )}
      {tile.unit && (
        <img
          className="game__tile-unit"
          src={unitEmoji[tile.unit.type]}
          alt={tile.unit.type}
          loading="lazy"
        />
      )}
    </div>
  );
}
