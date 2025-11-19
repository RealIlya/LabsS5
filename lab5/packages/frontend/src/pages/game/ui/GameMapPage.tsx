import { useMemo, useRef, useState } from "react";
import { Button } from "../../../shared/ui/button";
import {
  TERRAIN_RULES,
  type TerrainType,
  STRUCTURE_RULES,
  UNIT_RULES,
  type UnitType,
  type StructureType,
} from "@hex/shared";
import { translations } from "../../../shared/i18n";
import "./GameMapPage.css";

interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  structure?: StructureType;
  unit?: {
    type: UnitType;
    owner: string;
  };
}

const MAP_COLUMNS = 12;
const MAP_ROWS = 10;
const VIEWPORT_COLUMNS = 8;
const VIEWPORT_ROWS = 6;
const HEX_SIZE = 110;
const HORIZONTAL_SPACING = HEX_SIZE * 0.75;
const VERTICAL_SPACING = HEX_SIZE * 0.866; // расстояние между рядами (sin 60°)
const viewportWidth = VIEWPORT_COLUMNS * HORIZONTAL_SPACING + HEX_SIZE;
const viewportHeight = VIEWPORT_ROWS * VERTICAL_SPACING + HEX_SIZE;
const mapWidth = HORIZONTAL_SPACING * (MAP_COLUMNS - 1) + HEX_SIZE;
const mapHeight = VERTICAL_SPACING * (MAP_ROWS - 1) + HEX_SIZE;
const maxOffsetX = Math.max(0, mapWidth - viewportWidth);
const maxOffsetY = Math.max(0, mapHeight - viewportHeight);

const terrainColor: Record<TerrainType, string> = {
  Plains: "#9bd770",
  Forest: "#5d9c59",
  Hills: "#c3a572",
  Mountains: "#8d99ae",
  Water: "#7ec8e3",
};

const unitEmoji: Record<UnitType, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🧳",
  Worker: "🛠️",
};

const terrainPool: TerrainType[] = ["Plains", "Forest", "Hills", "Plains", "Plains", "Water", "Mountains"];
const structurePool: StructureType[] = ["City", "Farm", "Fort", "Barracks", "Granary"];
const unitPool: UnitType[] = ["Warrior", "Spearman", "Archer", "Horseman"];

function generateMap(): MapTile[] {
  const tiles: MapTile[] = [];
  for (let y = 0; y < MAP_ROWS; y += 1) {
    for (let x = 0; x < MAP_COLUMNS; x += 1) {
      const terrain = terrainPool[(x + y) % terrainPool.length];
      const id = `${x}-${y}`;
      const tile: MapTile = { id, x, y, terrain };

      if ((x + y) % 11 === 0) {
        tile.structure = structurePool[(x + y) % structurePool.length];
      }
      if ((x * y) % 13 === 0 && x !== 0 && y !== 0) {
        tile.unit = {
          type: unitPool[(x + y) % unitPool.length],
          owner: (x + y) % 2 === 0 ? "Player" : "Enemy",
        };
      }

      tiles.push(tile);
    }
  }
  return tiles;
}

export function GameMapPage() {
  const t = useMemo(() => translations.ru.game, []);
  const mapTiles = useMemo(() => generateMap(), []);
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    active: false,
    pointerId: 0,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
  });

  const handleSelect = (tile: MapTile) => setSelectedTile(tile);
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      startOffset: { ...offset },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragState.current.active) {
      return;
    }

    event.preventDefault();
    const dx = event.clientX - dragState.current.start.x;
    const dy = event.clientY - dragState.current.start.y;

    setOffset({
      x: clamp(dragState.current.startOffset.x - dx, 0, maxOffsetX),
      y: clamp(dragState.current.startOffset.y - dy, 0, maxOffsetY),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      event.currentTarget.releasePointerCapture?.(dragState.current.pointerId);
    }
  };

  const selectedUnit = selectedTile?.unit ? UNIT_RULES[selectedTile.unit.type] : null;
  const selectedStructure = selectedTile?.structure ? STRUCTURE_RULES[selectedTile.structure] : null;

  return (
    <div className="game">
      <header className="game__topbar">
        <div>
          <strong>
            {t.turn}: 12
          </strong>
          <span>
            {t.currentPlayer}: Player One
          </span>
        </div>
        <div>
          {t.population}: 85 / 100
        </div>
      </header>

      <section
        className="game__map-wrapper"
        style={{ width: viewportWidth, height: viewportHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div
          className="game__map"
          style={{
            width: mapWidth + HEX_SIZE,
            height: mapHeight + HEX_SIZE,
            transform: `translate(${-offset.x}px, ${-offset.y}px)`,
          }}
        >
          {mapTiles.map((tile) => {
            const offsetX = tile.x * HORIZONTAL_SPACING + (tile.y % 2 ? HORIZONTAL_SPACING / 2 : 0);
            const offsetY = tile.y * VERTICAL_SPACING;
            return (
              <button
                key={tile.id}
                type="button"
                className={`game__tile ${selectedTile?.id === tile.id ? "game__tile--selected" : ""}`}
                onClick={() => handleSelect(tile)}
                style={{
                  backgroundColor: terrainColor[tile.terrain],
                  width: HEX_SIZE,
                  height: HEX_SIZE,
                  left: offsetX,
                  top: offsetY,
                }}
              >
                {tile.structure ? <span className="game__tile-structure">🏰</span> : null}
                {tile.unit ? <span className="game__tile-unit">{unitEmoji[tile.unit.type]}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="game__panel">
        {selectedTile ? (
          <div>
            <h2>{t.tileInfo}</h2>
            <p>{selectedTile.terrain}</p>
            {selectedStructure ? (
              <p>{t.structures}: {selectedTile.structure}</p>
            ) : null}
            {selectedUnit ? (
              <div>
                <h3>{t.unitInfo}</h3>
                <p>
                  {selectedTile.unit?.owner}: {selectedTile.unit?.type}
                </p>
                <ul>
                  <li>
                    {t.attack}: {selectedUnit.baseStats.attack}
                  </li>
                  <li>
                    {t.health}: {selectedUnit.baseStats.health}
                  </li>
                  <li>
                    {t.movement}: {selectedUnit.baseStats.movement}
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p>{t.selectPrompt}</p>
        )}
        <Button className="game__end-turn" disabled>
          {t.endTurnDisabled}
        </Button>
      </section>
    </div>
  );
}

export default GameMapPage;
