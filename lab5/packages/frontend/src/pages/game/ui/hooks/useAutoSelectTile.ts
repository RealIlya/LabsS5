import { useEffect } from "react";
import type { MapTile } from "../types";

export function useAutoSelectTile(
  mapTiles: MapTile[],
  needsCapital: boolean,
  selectedTile: MapTile | null,
  setSelectedTile: (tile: MapTile) => void
) {
  useEffect(() => {
    if (!selectedTile && mapTiles.length > 0 && !needsCapital) {
      setSelectedTile(mapTiles[0]);
    }
  }, [mapTiles, selectedTile, needsCapital, setSelectedTile]);
}
