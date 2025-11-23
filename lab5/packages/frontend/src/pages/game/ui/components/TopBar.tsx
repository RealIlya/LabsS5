import type { GameStateDto } from "../../../../entities/game/api/gameApi";

interface TopBarProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  gameState: GameStateDto;
  isPlacementPhase: boolean;
  needsCapital: boolean;
  selfPlayer: GameStateDto["players"][number] | null;
}

export function TopBar({
  t,
  gameState,
  isPlacementPhase,
  needsCapital,
  selfPlayer,
}: TopBarProps) {
  const populationCurrent =
    selfPlayer?.currentPopulation ?? gameState.population.current;
  const populationCap = selfPlayer?.populationCap ?? gameState.population.cap;
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

      {isPlacementPhase && (
        <div className="game__phase-banner">
          {needsCapital ? t.capitalPlacement.hint : t.capitalPlacement.waiting}
        </div>
      )}
    </header>
  );
}
