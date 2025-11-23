import type { MapTile, MapUnit } from "../types";
import type { UNIT_RULES, UnitType } from "@hex/shared";
import type { CityData } from "@hex/shared";

interface InfoPanelProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  selectedTile: MapTile | null;
  selectedCity: CityData | null;
  selectedTileUnit: MapUnit | null;
  selectedUnitStats: (typeof UNIT_RULES)[keyof typeof UNIT_RULES] | null;
  terrainName: string;
  terrainDescription?: string;
  needsCapital: boolean;
  isTileEligibleForCapital: (tile: MapTile | null) => boolean;
  insufficientCityPopulation: boolean;
  unitEmoji: Record<UnitType, string>;
  activeProductionTurns: number | null;
  activeProductionProgress: number;
  activeProductionName: string | null;
}

export function InfoPanel({
  t,
  selectedTile,
  selectedCity,
  selectedTileUnit,
  selectedUnitStats,
  terrainName,
  terrainDescription,
  needsCapital,
  isTileEligibleForCapital,
  insufficientCityPopulation,
  unitEmoji,
  activeProductionTurns,
  activeProductionProgress,
  activeProductionName,
}: InfoPanelProps) {
  return (
    <div className="game__hud-left game__hud-panel">
      {selectedTile ? (
        <>
          <div className="game__hud-header">
            <h2>
              {terrainName}
              <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: 8 }}>
                ({selectedTile.x}, {selectedTile.y})
              </span>
            </h2>
            {terrainDescription ? (
              <p className="game__hud-subtext">{terrainDescription}</p>
            ) : null}
            {selectedTile.structure && (
              <p className="game__hud-subtext">
                {selectedTile.structure.type}
                {selectedTile.structure.type === "City" &&
                selectedTile.structure.isCapital
                  ? ` (${t.capitalPlacement.capitalLabel})`
                  : ""}
              </p>
            )}
          </div>

          {selectedCity && (
            <div className="game__city-stats">
              <span>
                {t.ownerLabel}: {selectedCity.ownerName}
              </span>
              <span>
                {t.cityPopulation}: {Math.floor(selectedCity.population ?? 0)}
              </span>
              {activeProductionTurns !== null && (
                <span>
                  {t.actions.productionMenu}:{" "}
                  {activeProductionName ? `${activeProductionName} · ` : ""}{" "}
                  {activeProductionProgress} / {activeProductionTurns} {t.turn}
                </span>
              )}
            </div>
          )}

          {selectedUnitStats && selectedTileUnit && (
            <div className="game__unit-stats">
              <div>
                <span>
                  {unitEmoji[selectedTileUnit.type]} {selectedTileUnit.type}
                </span>
                <span>
                  {t.ownerLabel}: {selectedTileUnit.ownerName}
                </span>
              </div>
              <div>
                <div className="game__stat-row" title={t.unitStats.attack}>
                  ⚔️ {selectedUnitStats.baseStats.attack}
                </div>
                <div className="game__stat-row" title={t.unitStats.health}>
                  ❤️ {selectedUnitStats.baseStats.health}
                </div>
                <div className="game__stat-row" title={t.unitStats.movement}>
                  👟
                  {selectedTileUnit.movementPoints ??
                    selectedUnitStats.baseStats.movement}
                </div>
              </div>
            </div>
          )}

          {!selectedCity && !selectedUnitStats && !needsCapital && (
            <p>{t.selectPrompt}</p>
          )}

          {insufficientCityPopulation && (
            <p className="game__warning">{t.warnings.population}</p>
          )}

          {needsCapital && (
            <div>
              {isTileEligibleForCapital(selectedTile)
                ? t.capitalPlacement.action
                : t.capitalPlacement.invalid}
            </div>
          )}
        </>
      ) : (
        <p>{t.selectPrompt}</p>
      )}
    </div>
  );
}
