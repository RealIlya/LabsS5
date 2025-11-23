import { Button } from "../../../../shared/ui/button";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
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

interface ActionMenusProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  menuType: MenuType;
  setMenuType: (value: MenuType) => void;
  cityProductionOptions: CityOption[];
  workerBuildOptions: WorkerOption[];
  selectedCity: Extract<MapTile["structure"], { type: "City" }> | null;
  canBuild: boolean;
  capitalPopulation: number;
  canBuildFarm: boolean;
  canBuildFort: boolean;
  submitPending: boolean;
  submitCityProduction: (item: CityOption["payload"]) => void;
  submitWorkerBuild: (structureType: "Farm" | "Fort") => void;
}

export function ActionMenus({
  t,
  menuType,
  setMenuType,
  cityProductionOptions,
  workerBuildOptions,
  selectedCity,
  canBuild,
  capitalPopulation,
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
                return (
                  <button
                    key={option.key}
                    className="game__menu-item"
                    onClick={() => submitCityProduction(option.payload)}
                    disabled={disabled}
                    title={`${option.label} · ${option.cost} / ${turns} ${t.turn}`}
                  >
                    <span>
                      {option.label} ({option.cost} / {turns} {t.turn})
                    </span>
                    <span className="game__menu-cost">-{option.cost}</span>
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
                const disabled =
                  submitPending ||
                  !canBuild ||
                  capitalPopulation < option.cost ||
                  !allowedByTerrain;
                return (
                  <button
                    key={option.key}
                    className="game__menu-item"
                    onClick={() => submitWorkerBuild(option.structureType)}
                    disabled={disabled}
                    title={`${option.label} · ${option.cost} / ${option.turns} ${t.turn}`}
                  >
                    <span>
                      {option.label} ({option.cost} / {option.turns} {t.turn})
                    </span>
                    <span className="game__menu-cost">-{option.cost}</span>
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
