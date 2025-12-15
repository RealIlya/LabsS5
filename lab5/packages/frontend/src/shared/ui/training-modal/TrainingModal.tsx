import { useMemo, useState } from "react";
import {
  FORT_HEAL_MULTIPLIER,
  STRUCTURE_RULES,
  UNIT_HEAL_NEUTRAL_TERRITORY,
  UNIT_HEAL_OWN_TERRITORY,
  UNIT_RULES,
} from "@hex/shared";
import { translations } from "../../i18n";
import { Button } from "../button";
import "./training-modal.css";

type TutorialTab = "units" | "structures" | "rules";

interface TrainingModalProps {
  open: boolean;
  onClose: () => void;
}

export function TrainingModal({ open, onClose }: TrainingModalProps) {
  const tutorialT = useMemo(() => translations.ru.tutorialCards, []);
  const tutorialGameT = useMemo(() => translations.ru.game, []);
  const mainMenuT = useMemo(() => translations.ru.mainMenu, []);
  const [activeTab, setActiveTab] = useState<TutorialTab>("rules");

  const rulesSteps = useMemo(() => {
    const baseGrowth = STRUCTURE_RULES.City.effects.basePopulationGrowth ?? 1;
    const granaryBonus =
      STRUCTURE_RULES.Granary.effects.populationGrowthBonus ?? 0;
    const farmCap =
      STRUCTURE_RULES.Farm.effects.empirePopulationCapIncrease ?? 0;
    const fortHeal = Math.round(UNIT_HEAL_OWN_TERRITORY * FORT_HEAL_MULTIPLIER);

    return [
      "Цель: Остаться единственным правителем. Потеря Столицы — это мгновенное поражение.",
      "Начало: У вашего Поселенца 8 очков движения. Найдите место и создайте Столицу.",
      `Производство: Воин/Копейщик/Лучник строятся ${UNIT_RULES.Warrior.productionTurns} ход, Всадник — ${UNIT_RULES.Horseman.productionTurns}, Рабочий — ${UNIT_RULES.Worker.productionTurns}, Поселенец — ${UNIT_RULES.Settler.productionTurns}. Казармы — ${STRUCTURE_RULES.Barracks.productionTurns} хода, Амбар — ${STRUCTURE_RULES.Granary.productionTurns} хода.`,
      `Рост: базовый прирост населения +${baseGrowth} за ход. Амбар добавляет ещё +${granaryBonus} (итого +${
        baseGrowth + granaryBonus
      }). Ферма увеличивает лимит населения на +${farmCap}.`,
      `Лечение: юниты восстанавливают ${UNIT_HEAL_OWN_TERRITORY} HP/ход на своей территории, ${UNIT_HEAL_NEUTRAL_TERRITORY} HP/ход на нейтральной, на территории врага лечения нет. На клетке Форта лечение x${FORT_HEAL_MULTIPLIER} (то есть ${fortHeal} HP/ход на своей территории).`,
      "Карта: движение стоит 1 ОД за клетку. Лес и Холмы дают защиту, Горы непроходимы. Всадник может заходить на воду, но не может заканчивать ход на воде.",
      "Ход: отдайте приказы и нажмите «Завершить ход». Очки движения восстановятся в начале вашего следующего хода.",
    ];
  }, []);

  const unitCards = useMemo(
    () =>
      Object.entries(tutorialGameT.units).map(([key, label]) => ({
        key,
        title: label,
        description:
          tutorialGameT.hints.units[
            key as keyof typeof tutorialGameT.hints.units
          ] ?? "",
      })),
    [tutorialGameT]
  );

  const structureCards = useMemo(() => {
    const anyGame = tutorialGameT as any;
    const hints = anyGame.hints.structures as Record<string, string>;
    const structureMeta =
      (anyGame.structureCards as Record<
        string,
        { name: string; description: string }
      >) ?? {};
    return Object.entries(structureMeta).map(([key, meta]) => ({
      key,
      title: meta.name ?? key,
      description: meta.description ?? hints[key] ?? "",
    }));
  }, [tutorialGameT]);

  if (!open) return null;

  return (
    <div className="main-menu__modal main-menu__modal--tutorial">
      <div className="main-menu__modal-content main-menu__modal-content--tutorial">
        <div className="main-menu__tutorial-heading">
          <h2>{mainMenuT.tutorialModal.title}</h2>
          <Button type="button" onClick={onClose} variant="ghost" size="icon">
            ✕
          </Button>
        </div>
        <p className="main-menu__tutorial-description">
          {mainMenuT.tutorialModal.description ?? tutorialT.subtitle}
        </p>
        <div className="main-menu__tutorial-tabs">
          <Button
            type="button"
            className="main-menu__tutorial-tab"
            onClick={() => setActiveTab("rules")}
            variant={activeTab === "rules" ? "primary" : "secondary"}
            size="compact"
          >
            {tutorialT.tabs.rules}
          </Button>
          <Button
            type="button"
            className="main-menu__tutorial-tab"
            onClick={() => setActiveTab("units")}
            variant={activeTab === "units" ? "primary" : "secondary"}
            size="compact"
          >
            {tutorialT.tabs.units}
          </Button>
          <Button
            type="button"
            className="main-menu__tutorial-tab"
            onClick={() => setActiveTab("structures")}
            variant={activeTab === "structures" ? "primary" : "secondary"}
            size="compact"
          >
            {tutorialT.tabs.structures}
          </Button>
        </div>

        {activeTab === "rules" ? (
          <div className="main-menu__tutorial-grid">
            {rulesSteps.map((step, index) => (
              <div key={step} className="main-menu__tutorial-card">
                <div className="main-menu__tutorial-card-title">
                  {index + 1}.
                </div>
                <p className="main-menu__tutorial-card-text">{step}</p>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "units" ? (
          <div className="main-menu__tutorial-grid">
            {unitCards.map((card) => (
              <div key={card.key} className="main-menu__tutorial-card">
                <div className="main-menu__tutorial-card-title">
                  {card.title}
                </div>
                <p className="main-menu__tutorial-card-text">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {activeTab === "structures" ? (
          <div className="main-menu__tutorial-grid">
            {structureCards.map((card) => (
              <div key={card.key} className="main-menu__tutorial-card">
                <div className="main-menu__tutorial-card-title">
                  {card.title}
                </div>
                <p className="main-menu__tutorial-card-text">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <Button type="button" variant="secondary" onClick={onClose} block>
          {mainMenuT.tutorialModal.close}
        </Button>
      </div>
    </div>
  );
}
