import { useEffect } from "react";
import type { MapTile } from "../types";

export function useAutoSelectTile(
  mapTiles: MapTile[],
  needsCapital: boolean,
  selectedTile: MapTile | null,
  autoSelectEnabled: boolean,
  setSelectedTile: (tile: MapTile) => void
) {
  useEffect(() => {
    if (
      autoSelectEnabled &&
      !selectedTile &&
      mapTiles.length > 0 &&
      !needsCapital
    ) {
      setSelectedTile(mapTiles[0]);
    }
  }, [
    mapTiles,
    selectedTile,
    needsCapital,
    autoSelectEnabled,
    setSelectedTile,
  ]);
}
