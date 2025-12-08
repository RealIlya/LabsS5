import type { GameStateDto } from "../../../../entities/game/api/gameApi";

import { type Ref } from "react";
import { Button } from "../../../../shared/ui/button";

interface TopBarProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  gameState: GameStateDto;
  isPlacementPhase: boolean;
  needsCapital: boolean;
  selfPlayer: GameStateDto["players"][number] | null;
  playerDefeated: boolean;
  onShowPlayers: () => void;
  headerRef?: Ref<HTMLDivElement>;
}

export function TopBar({
  t,
  gameState,
  isPlacementPhase,
  needsCapital,
  selfPlayer,
  playerDefeated,
  onShowPlayers,
  headerRef,
}: TopBarProps) {
  const populationCurrent =
    selfPlayer?.currentPopulation ?? gameState.population.current;
  const populationCap = selfPlayer?.populationCap ?? gameState.population.cap;

  const phaseNode = playerDefeated ? (
    <div className="game__phase-banner game__phase-banner--defeat">
      {t.defeatedBanner}
    </div>
  ) : isPlacementPhase ? (
    <div className="game__phase-banner">
      {needsCapital ? t.capitalPlacement.hint : t.capitalPlacement.waiting}
    </div>
  ) : (
    <div style={{ width: 24 }} />
  );

  return (
    <header className="game__top-bar" ref={headerRef}>
      <div className="game__stats-group">
        <div className="game__stat-item">
          <span className="game__stat-label">{t.turn}</span>
          <span className="game__stat-value">{gameState.turn}</span>
        </div>
        <div className="game__stat-item">
          <span className="game__stat-label">{t.population}</span>
          <span className="game__stat-value">
            {populationCurrent} / {populationCap}
          </span>
        </div>
        <div className="game__stat-item">
          <span className="game__stat-label">{t.currentPlayer}</span>
          <span className="game__stat-value" style={{ color: "#60a5fa" }}>
            {gameState.currentPlayerName ?? gameState.currentPlayerId}
          </span>
        </div>
      </div>

      <div className="game__top-controls">
        {phaseNode}
        <Button
          type="button"
          className="game__players-btn"
          onClick={onShowPlayers}
          title={t.playersList}
          variant="ghost"
          size="compact"
        >
          👥 <span>{t.playersList}</span>
        </Button>
      </div>
    </header>
  );
}
