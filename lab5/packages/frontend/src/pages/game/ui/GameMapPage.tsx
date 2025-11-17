import { useMemo, useState } from "react";
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
  terrain: TerrainType;
  structure?: StructureType;
  unit?: {
    type: UnitType;
    owner: string;
  };
}

const mockMap: MapTile[] = [
  { id: "0-0", terrain: "Plains", unit: { type: "Warrior", owner: "Player" } },
  { id: "0-1", terrain: "Forest" },
  { id: "0-2", terrain: "Hills", structure: "Fort" },
  { id: "1-0", terrain: "Water" },
  { id: "1-1", terrain: "Plains", structure: "City" },
  { id: "1-2", terrain: "Forest", unit: { type: "Archer", owner: "Ally" } },
  { id: "2-0", terrain: "Hills" },
  { id: "2-1", terrain: "Plains", unit: { type: "Spearman", owner: "Enemy" } },
  { id: "2-2", terrain: "Plains" },
];

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

export function GameMapPage() {
  const t = useMemo(() => translations.ru.game, []);
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);

  const handleSelect = (tile: MapTile) => setSelectedTile(tile);

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

      <section className="game__map">
        {mockMap.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`game__tile ${selectedTile?.id === tile.id ? "game__tile--selected" : ""}`}
            onClick={() => handleSelect(tile)}
            style={{ backgroundColor: terrainColor[tile.terrain] }}
          >
            {tile.structure ? <span className="game__tile-structure">🏰</span> : null}
            {tile.unit ? <span className="game__tile-unit">{unitEmoji[tile.unit.type]}</span> : null}
          </button>
        ))}
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
