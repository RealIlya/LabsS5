import { memo } from "react";
import { HEX_NEIGHBORS } from "../mapConfig";
import type { MapTile } from "../types";
import { MapTile as TileView } from "./MapTile";

interface MapTilesLayerProps {
  mapTiles: MapTile[];
  selectedTileId: string | null;
  needsCapital: boolean;
  effectivePlayerId: string | null;
  tileByCoord: Map<string, MapTile>;
  showCityBuffer: boolean;
  enemyCityBuffer: Set<string>;
  activeAction: null | "move" | "attack";
  moveTargets: Set<string>;
  attackTargets: Set<string>;
  playerColorMap: Map<string, string>;
  onSelect: (tile: MapTile) => void;
  hexConfig: { WIDTH: number; HEIGHT: number; ROW_SPACING_V: number };
  terrainColor: Record<MapTile["terrain"], string>;
  terrainTextures: Record<MapTile["terrain"], string>;
}

export const MapTilesLayer = memo(
	  function MapTilesLayer({
	    mapTiles,
	    selectedTileId,
	    needsCapital,
	    effectivePlayerId,
	    structureNoBuildZone,
	    tileByCoord,
	    showCityBuffer,
	    enemyCityBuffer,
	    activeAction,
	    moveTargets,
    attackTargets,
    playerColorMap,
    onSelect,
    hexConfig,
    terrainColor,
    terrainTextures,
  }: MapTilesLayerProps) {
    return (
      <>
        {mapTiles.map((tile) => {
          const proximityBlocked =
            showCityBuffer && enemyCityBuffer.has(tile.id);
          const highlighted =
            activeAction &&
            (moveTargets.has(tile.id) || attackTargets.has(tile.id));

          const isEligibleForCapital = (() => {
            if (!needsCapital || !effectivePlayerId) return false;
            if (tile.terrain === "Mountains" || tile.terrain === "Water") {
              return false;
            }
            if (tile.structure) return false;
            if (tile.unit?.type !== "Settler") return false;
            if (tile.unit.ownerId !== effectivePlayerId) return false;
            const parity = tile.y % 2 === 0 ? "even" : "odd";
            const hasEnemyAdjacentCity = HEX_NEIGHBORS[parity].some(
              ({ dx, dy }) => {
                const neighbor = tileByCoord.get(
                  `${tile.x + dx},${tile.y + dy}`
                );
                return (
                  neighbor?.structure?.type === "City" &&
                  neighbor.structure.ownerId !== effectivePlayerId
                );
              }
            );
            return !hasEnemyAdjacentCity;
          })();

          const blocked = needsCapital && !isEligibleForCapital;

          return (
            <TileView
              key={tile.id}
              tile={tile}
              selected={selectedTileId === tile.id}
              blocked={blocked}
              cityBlocked={proximityBlocked}
              highlighted={Boolean(highlighted)}
              isSelfUnit={tile.unit?.ownerId === effectivePlayerId}
              territoryColor={
                tile.ownerId ? playerColorMap.get(tile.ownerId) : undefined
              }
              controlColor={
                tile.structure?.type === "Fort"
                  ? playerColorMap.get(tile.structure.ownerId)
                  : undefined
              }
              hexConfig={hexConfig}
              terrainColor={terrainColor}
              terrainTextures={terrainTextures}
              onSelect={onSelect}
            />
          );
        })}
      </>
    );
  },
	  (prev, next) =>
	    prev.mapTiles === next.mapTiles &&
	    prev.selectedTileId === next.selectedTileId &&
	    prev.needsCapital === next.needsCapital &&
	    prev.effectivePlayerId === next.effectivePlayerId &&
	    prev.tileByCoord === next.tileByCoord &&
	    prev.showCityBuffer === next.showCityBuffer &&
	    prev.enemyCityBuffer === next.enemyCityBuffer &&
	    prev.activeAction === next.activeAction &&
    prev.moveTargets === next.moveTargets &&
    prev.attackTargets === next.attackTargets &&
    prev.playerColorMap === next.playerColorMap &&
    prev.onSelect === next.onSelect &&
    prev.hexConfig === next.hexConfig &&
    prev.terrainColor === next.terrainColor &&
    prev.terrainTextures === next.terrainTextures
);
