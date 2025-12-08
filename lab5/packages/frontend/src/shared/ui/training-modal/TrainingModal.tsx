import { useMemo, useState } from "react";
import cn from "classnames";
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
    <div className="main-menu__tutorial-overlay">
      <div className="main-menu__tutorial">
        <div className="main-menu__tutorial-header">
          <div>
            <p className="main-menu__tutorial-label">{tutorialT.title}</p>
            <h3 className="main-menu__tutorial-title">{tutorialT.subtitle}</h3>
          </div>
          <Button
            type="button"
            className="main-menu__tutorial-close"
            onClick={onClose}
            unstyled
          >
            ✖
          </Button>
        </div>
        <div className="main-menu__tutorial-tabs">
          <Button
            type="button"
            className={cn(
              "main-menu__tutorial-tab",
              activeTab === "rules" && "main-menu__tutorial-tab--active"
            )}
            onClick={() => setActiveTab("rules")}
            unstyled
          >
            {tutorialT.tabs.rules}
          </Button>
          <Button
            type="button"
            className={cn(
              "main-menu__tutorial-tab",
              activeTab === "units" && "main-menu__tutorial-tab--active"
            )}
            onClick={() => setActiveTab("units")}
            unstyled
          >
            {tutorialT.tabs.units}
          </Button>
          <Button
            type="button"
            className={cn(
              "main-menu__tutorial-tab",
              activeTab === "structures" && "main-menu__tutorial-tab--active"
            )}
            onClick={() => setActiveTab("structures")}
            unstyled
          >
            {tutorialT.tabs.structures}
          </Button>
        </div>

        {activeTab === "rules" ? (
          <div className="main-menu__tutorial-grid">
            {mainMenuT.tutorialModal.steps.map((step, index) => (
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

        <Button
          type="button"
          className="main-menu__tutorial-close-btn"
          onClick={onClose}
          unstyled
        >
          {mainMenuT.tutorialModal.close}
        </Button>
      </div>
    </div>
  );
}
