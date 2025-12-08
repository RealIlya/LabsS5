import { type StandaloneStructureType, type CityData } from "@hex/shared";
import type { MapTile, MapUnit } from "../types";
import type { UNIT_RULES, UnitType } from "@hex/shared";
import { Button } from "../../../../shared/ui/button";

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
  onClose: () => void;
  className?: string;
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
  onClose,
  className,
}: InfoPanelProps) {
  if (!selectedTile) {
    return null;
  }

  const infoLabels = t.infoPanel;
  const standaloneStructure =
    selectedTile.structure && selectedTile.structure.type !== "City"
      ? selectedTile.structure
      : null;
  const standaloneHint = standaloneStructure
    ? t.hints.structures[standaloneStructure.type] ?? standaloneStructure.type
    : null;
  const standaloneStructureCard =
    standaloneStructure && t.structureCards
      ? t.structureCards[standaloneStructure.type as StandaloneStructureType]
      : null;
  const standaloneDescription =
    standaloneStructureCard?.description ?? standaloneHint ?? null;
  const structureOwnerSubtitle = standaloneStructure
    ? standaloneStructure.ownerName
      ? `${t.ownerLabel}: ${standaloneStructure.ownerName}`
      : `${t.ownerLabel}: ${standaloneStructure.ownerId}`
    : null;
  const structureIcons: Record<StandaloneStructureType, string> = {
    Farm: "🌾",
    Fort: "🛡️",
  };
  const ownerSubtitle = selectedTile.ownerName
    ? `${t.ownerLabel}: ${selectedTile.ownerName}`
    : selectedTile.ownerId
    ? `${t.ownerLabel}: ${selectedTile.ownerId}`
    : infoLabels.noOwner;
  const unitBonuses: string[] = [];
  if (selectedTileUnit) {
    if (selectedTileUnit.isVeteran) {
      unitBonuses.push(t.unitBonuses.veteran);
    }
    if (
      selectedTile.structure?.type === "City" &&
      selectedTile.structure.ownerId === selectedTileUnit.ownerId
    ) {
      unitBonuses.push(t.unitBonuses.cityGarrison);
    }
    if (
      selectedTile.structure?.type === "Fort" &&
      selectedTile.structure.ownerId === selectedTileUnit.ownerId
    ) {
      unitBonuses.push(t.unitBonuses.fortified);
    }
    const terrainBonus =
      t.unitBonuses.terrain?.[selectedTile.terrain as "Forest" | "Hills"];
    if (terrainBonus) {
      unitBonuses.push(terrainBonus);
    }
  }

  return (
    <div className={`game__hud-left ${className ?? ""}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="game__info-close"
        onClick={onClose}
        aria-label={t.infoPanel.close}
      >
        ✕
      </Button>
      <div className="game__info-header">
        <h3 className="game__info-title">{infoLabels.title}</h3>
        <span className="game__info-coords">
          X:{selectedTile.x} Y:{selectedTile.y}
        </span>
      </div>

      <div className="game__info-body">
        {selectedTileUnit && (
          <section className="game__info-section">
            <div className="game__section-header">
              <span className="game__section-title">
                {infoLabels.unit}:{" "}
                {t.units?.[selectedTileUnit.type] ?? selectedTileUnit.type}
              </span>
              <span className="game__section-subtitle">
                {t.ownerLabel}:{" "}
                <span
                  style={{
                    color:
                      selectedTileUnit.ownerColor ??
                      "var(--color-text-primary)",
                  }}
                >
                  {selectedTileUnit.ownerName}
                </span>
              </span>
            </div>
            <div className="game__section-content">
              <div className="game__portrait">
                {unitEmoji[selectedTileUnit.type] ?? "🎯"}
              </div>
              <div className="game__info-details">
                {selectedUnitStats && (
                  <>
                    <div className="game__stat-bar">
                      <span title={t.unitStats.health}>❤️</span>
                      <div className="game__progress-track">
                        {(() => {
                          const maxHealth =
                            selectedTileUnit.maxHealth ??
                            selectedUnitStats.baseStats.health;
                          const percent = Math.min(
                            100,
                            (selectedTileUnit.health / maxHealth) * 100
                          );
                          return (
                            <div
                              className="game__progress-fill"
                              style={{ width: `${percent}%` }}
                            />
                          );
                        })()}
                      </div>
                      {(() => {
                        const maxHealth =
                          selectedTileUnit.maxHealth ??
                          selectedUnitStats.baseStats.health;
                        return (
                          <span>
                            {selectedTileUnit.health} / {maxHealth}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="game__stat-bar">
                      <span title={t.unitStats.movement}>👟</span>
                      <span>
                        {selectedTileUnit.movementPoints ??
                          selectedUnitStats.baseStats.movement}{" "}
                        / {selectedUnitStats.baseStats.movement}
                      </span>
                    </div>
                    <div className="game__stat-bar">
                      <span title={t.unitStats.attack}>⚔️</span>
                      <span>
                        {selectedTileUnit.attack ??
                          selectedUnitStats.baseStats.attack}
                      </span>
                    </div>
                    {unitBonuses.length > 0 && (
                      <div className="game__unit-bonuses">
                        <span className="game__section-subtitle">
                          {t.unitBonuses.title}
                        </span>
                        <ul>
                          {unitBonuses.map((bonus) => (
                            <li key={bonus}>{bonus}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {selectedCity && (
          <section className="game__info-section">
            <div className="game__section-header">
              <span className="game__section-title">
                {infoLabels.city}
                {selectedCity.isCapital
                  ? ` · ${t.capitalPlacement.capitalLabel}`
                  : ""}
              </span>
              <span className="game__section-subtitle">
                {t.ownerLabel}:{" "}
                <span
                  style={{
                    color:
                      selectedTile.ownerColor ?? "var(--color-text-primary)",
                  }}
                >
                  {selectedCity.ownerName}
                </span>
              </span>
            </div>
            <div className="game__section-content">
              <div className="game__portrait">🏰</div>
              <div className="game__info-details">
                <div className="game__stat-bar">
                  <span>
                    👥 {t.cityPopulation}:{" "}
                    {Math.floor(selectedCity.population ?? 0)}
                  </span>
                </div>
                <div className="game__stat-bar">
                  <span>
                    🛡️ {t.cityFortification}:{" "}
                    {Math.max(0, Math.round(selectedCity.fortification ?? 0))}
                  </span>
                </div>
                {selectedCity.improvement && (
                  <div className="game__stat-bar">
                    <span>
                      🏗️{" "}
                      {t.hints.structures[selectedCity.improvement] ??
                        selectedCity.improvement}
                    </span>
                  </div>
                )}
                {activeProductionTurns !== null && (
                  <div className="game__stat-bar">
                    <span>
                      🔨 {activeProductionName} ({activeProductionProgress}/
                      {activeProductionTurns})
                    </span>
                  </div>
                )}
                {insufficientCityPopulation && (
                  <div
                    className="game__stat-bar"
                    style={{ color: "var(--color-error)" }}
                  >
                    {t.warnings.population}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {standaloneStructure && standaloneStructureCard && (
          <section className="game__info-section">
            <div className="game__section-header">
              <span className="game__section-title">
                {standaloneStructureCard.name}
              </span>
              <span className="game__section-subtitle">
                {structureOwnerSubtitle}
              </span>
            </div>
            <div className="game__section-content">
              <div className="game__portrait">
                {structureIcons[
                  standaloneStructure.type as StandaloneStructureType
                ] ?? "🏗️"}
              </div>
              <div className="game__info-details">
                {standaloneDescription ? (
                  <div className="game__structure-description">
                    {standaloneDescription}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        <section className="game__info-section">
          <div className="game__section-header">
            <span className="game__section-title">
              {infoLabels.tile}: {terrainName}
            </span>
            <span className="game__section-subtitle">{ownerSubtitle}</span>
          </div>
          <div className="game__info-details">
            {terrainDescription && (
              <div className="game__stat-bar">{terrainDescription}</div>
            )}
            {needsCapital && (
              <div
                style={{
                  color: isTileEligibleForCapital(selectedTile)
                    ? "var(--color-success)"
                    : "var(--color-error)",
                }}
              >
                {isTileEligibleForCapital(selectedTile)
                  ? t.capitalPlacement.action
                  : t.capitalPlacement.invalid}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
