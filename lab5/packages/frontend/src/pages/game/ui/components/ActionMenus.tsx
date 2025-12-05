import { useEffect, useState } from "react";
import { Button } from "../../../../shared/ui/button";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
  type CityData,
  type CityImprovementType,
  type UnitType,
} from "@hex/shared";
import type { MapTile } from "../types";

type MenuType = null | "city-production" | "city-improvement" | "worker-build";

interface CityOption {
  key: string;
  label: string;
  cost: number;
  payload:
    | { type: "unit"; unitType: UnitType }
    | { type: "improvement"; improvementType: CityImprovementType };
}

interface WorkerOption {
  key: string;
  label: string;
  cost: number;
  structureType: "Farm" | "Fort";
  turns: number;
}

type CityTile = MapTile & { structure: CityData };

interface ActionMenusProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  menuType: MenuType;
  setMenuType: (value: MenuType) => void;
  cityProductionOptions: CityOption[];
  workerBuildOptions: WorkerOption[];
  selectedCity: Extract<MapTile["structure"], { type: "City" }> | null;
  canBuild: boolean;
  playerCities: CityTile[];
  farmCityId: string | null;
  canBuildFarm: boolean;
  canBuildFort: boolean;
  submitPending: boolean;
  submitCityProduction: (item: CityOption["payload"]) => void;
  submitWorkerBuild: (
    structureType: "Farm" | "Fort",
    donorCityId?: string | null
  ) => void;
}

const unitEmojis: Record<string, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🏳️",
  Worker: "🔨",
  Barracks: "🏕️",
  Granary: "🌾",
  Farm: "🌾",
  Fort: "🧱",
};

export function ActionMenus({
  t,
  menuType,
  setMenuType,
  cityProductionOptions,
  workerBuildOptions,
  selectedCity,
  canBuild,
  playerCities,
  farmCityId,
  canBuildFarm,
  canBuildFort,
  submitPending,
  submitCityProduction,
  submitWorkerBuild,
}: ActionMenusProps) {
  if (menuType === null) return null;

  const filteredCityOptions =
    menuType === "city-improvement"
      ? cityProductionOptions.filter(
          (option) => option.payload.type === "improvement"
        )
      : cityProductionOptions;
  const hasImprovement = Boolean(selectedCity?.improvement);
  const unitHints = t.hints.units;
  const structureHints = t.hints.structures;
  const cityOptions = playerCities.map((cityTile) => ({
    id: cityTile.structure.id,
    label: `${
      cityTile.structure.isCapital
        ? t.capitalPlacement.capitalLabel
        : t.infoPanel.city
    } (${cityTile.x}, ${cityTile.y})`,
  }));
  const farmCityOption =
    cityOptions.find((city) => city.id === farmCityId) ?? null;
  const [fortCityId, setFortCityId] = useState<string | null>(
    cityOptions[0]?.id ?? null
  );

  useEffect(() => {
    setFortCityId((prev) => {
      if (prev && cityOptions.some((city) => city.id === prev)) {
        return prev;
      }
      return cityOptions[0]?.id ?? null;
    });
  }, [cityOptions]);

  return (
    <>
      {(menuType === "city-production" || menuType === "city-improvement") && (
        <div className="game__menu" role="dialog">
          <div className="game__menu-content">
            <div className="game__menu-header">
              <h4>{t.actions.productionMenu}</h4>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMenuType(null)}
              >
                ✖
              </Button>
            </div>
            <div className="game__menu-list">
              {filteredCityOptions.map((option) => {
                const turns =
                  option.payload.type === "unit"
                    ? UNIT_RULES[option.payload.unitType]?.productionTurns
                    : STRUCTURE_RULES[option.payload.improvementType]
                        .productionTurns;
                const disabled =
                  submitPending ||
                  !selectedCity ||
                  (selectedCity.population ?? 0) < option.cost ||
                  (hasImprovement && option.payload.type === "improvement");
                const description =
                  option.payload.type === "unit"
                    ? unitHints[option.payload.unitType]
                    : structureHints[option.payload.improvementType];

                const typeKey =
                  option.payload.type === "unit"
                    ? option.payload.unitType
                    : option.payload.improvementType;
                const icon = unitEmojis[typeKey] || "🏗️";

                return (
                  <button
                    key={option.key}
                    className="game__production-card"
                    onClick={() => submitCityProduction(option.payload)}
                    disabled={disabled}
                  >
                    <div className="game__prod-icon">{icon}</div>
                    <div className="game__prod-info">
                      <span className="game__prod-name">{option.label}</span>
                      <span className="game__prod-desc">{description}</span>
                    </div>
                    <div className="game__prod-cost">
                      <div>-{option.cost} Pop</div>
                      <div>
                        {turns} {t.turn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {menuType === "worker-build" && (
        <div className="game__menu" role="dialog">
          <div className="game__menu-content">
            <div className="game__menu-header">
              <h4>{t.actions.buildMenu}</h4>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMenuType(null)}
              >
                ✖
              </Button>
            </div>
            <div className="game__menu-list">
              {workerBuildOptions.map((option) => {
                const allowedByTerrain =
                  option.structureType === "Farm" ? canBuildFarm : canBuildFort;
                const donorCityId =
                  option.structureType === "Fort" ? fortCityId : farmCityId;
                const donorCity = playerCities.find(
                  (cityTile) => cityTile.structure.id === donorCityId
                );
                const populationAvailable =
                  (donorCity?.structure.population ?? 0) >= option.cost;
                const disabled =
                  submitPending ||
                  !canBuild ||
                  !allowedByTerrain ||
                  !donorCityId ||
                  !populationAvailable;
                const description = structureHints[option.structureType];
                const icon = unitEmojis[option.structureType] || "🔨";

                return (
                  <button
                    key={option.key}
                    className="game__production-card"
                    onClick={() =>
                      submitWorkerBuild(option.structureType, donorCityId)
                    }
                    disabled={disabled}
                  >
                    <div className="game__prod-icon">{icon}</div>
                    <div className="game__prod-info">
                      <span className="game__prod-name">{option.label}</span>
                      <span className="game__prod-desc">{description}</span>
                      {option.structureType === "Farm" && (
                        <div className="game__build-note">
                          {farmCityOption ? (
                            <>
                              {t.actions.autoDonorCity}{" "}
                              <strong>{farmCityOption.label}</strong>
                            </>
                          ) : (
                            t.actions.noCitiesAvailable
                          )}
                        </div>
                      )}
                      {option.structureType === "Fort" && (
                        <div className="game__build-select">
                          <label htmlFor="fort-city-select">
                            {t.actions.selectDonorCity}
                          </label>
                          <select
                            id="fort-city-select"
                            value={fortCityId ?? ""}
                            onChange={(event) =>
                              setFortCityId(event.target.value || null)
                            }
                            disabled={cityOptions.length === 0}
                          >
                            {cityOptions.map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="game__prod-cost">
                      <div>-{option.cost} Pop</div>
                      <div>
                        {option.turns} {t.turn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
