import type { GameStateDto } from "../../../../entities/game/api/gameApi";

interface TopBarProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  gameState: GameStateDto;
  isPlacementPhase: boolean;
  needsCapital: boolean;
  selfPlayer: GameStateDto["players"][number] | null;
  playerDefeated: boolean;
  onShowPlayers: () => void;
}

export function TopBar({
  t,
  gameState,
  isPlacementPhase,
  needsCapital,
  selfPlayer,
  playerDefeated,
  onShowPlayers,
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
    <header className="game__top-bar">
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
        <button
          type="button"
          className="game__players-btn"
          onClick={onShowPlayers}
          title={t.playersList}
        >
          👥 <span>{t.playersList}</span>
        </button>
      </div>
    </header>
  );
}
