import { MAP_COLUMNS, MAP_ROWS } from "@hex/shared";
import { Injectable } from "@nestjs/common";
import type { GameTileState } from "../../domain/game/game-state";
import { pickTerrain, sampleHeight, stringToSeed } from "./game.utils";

@Injectable()
export class MapService {
  generateTiles(seedSource: string): GameTileState[] {
    const seed = stringToSeed(seedSource);
    const tiles: GameTileState[] = [];
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLUMNS; x += 1) {
        const elevation = sampleHeight(x, y, seed);
        tiles.push({
          id: `${x}-${y}`,
          x,
          y,
          terrain: pickTerrain(elevation),
          ownerId: null,
        });
      }
    }
    return tiles;
  }
}
