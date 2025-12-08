import type { CSSProperties } from "react";
import { Button } from "../../../../shared/ui/button";

interface ActionsPanelProps {
  t: typeof import("../../../../shared/i18n").translations.ru.game;
  canFoundCity: boolean;
  canBuild: boolean;
  canOpenProductionMenu: boolean;
  canMove: boolean;
  canAttack: boolean;
  moveActive: boolean;
  attackActive: boolean;
  controlsDisabled: boolean;
  isMyTurn: boolean;
  submitPending: boolean;
  onFoundCity: () => void;
  onBuild: () => void;
  onProduce: () => void;
  onMoveToggle: () => void;
  onAttackToggle: () => void;
  onEndTurn: () => void;
  endTurnDisabled: boolean;
  waitingForOpponents: boolean;
  onOpenGuide?: () => void;
  turnRemaining: number;
  turnDurationSeconds: number;
}

export function ActionsPanel({
  t,
  canFoundCity,
  canBuild,
  canOpenProductionMenu,
  canMove,
  canAttack,
  moveActive,
  attackActive,
  controlsDisabled,
  isMyTurn,
  submitPending,
  onFoundCity,
  onBuild,
  onProduce,
  onMoveToggle,
  onAttackToggle,
  onEndTurn,
  endTurnDisabled,
  waitingForOpponents,
  onOpenGuide,
  turnRemaining,
  turnDurationSeconds,
}: ActionsPanelProps) {
  const anyUnitActions =
    canAttack || canMove || canFoundCity || canBuild || canOpenProductionMenu;
  const totalSeconds = Math.max(1, turnDurationSeconds);
  const remainingRatio = Math.max(
    0,
    Math.min(1, turnRemaining / totalSeconds)
  );
  const timerProgress = remainingRatio * 360;
  const turnTimerStyle = {
    "--timer-progress": `${timerProgress}deg`,
  } as CSSProperties;

  return (
    <div className="game__hud-right">
      {anyUnitActions && (
        <div className="game__unit-actions">
          {onOpenGuide ? (
            <Button
              className="game__mini-btn"
              onClick={onOpenGuide}
              title="Гайд"
              type="button"
              variant="ghost"
              size="compact"
            >
              ❔
            </Button>
          ) : null}
          <Button
            className={`game__mini-btn ${
              attackActive ? "game__mini-btn--active" : ""
            }`}
            disabled={controlsDisabled || !canAttack || !isMyTurn}
            onClick={onAttackToggle}
            title={t.actions.attack}
            type="button"
            variant="ghost"
            size="compact"
          >
            ⚔️
          </Button>
          <Button
            className={`game__mini-btn ${
              moveActive ? "game__mini-btn--active" : ""
            }`}
            disabled={controlsDisabled || !canMove || !isMyTurn}
            onClick={onMoveToggle}
            title={t.actions.move}
            type="button"
            variant="ghost"
            size="compact"
          >
            👟
          </Button>
          <Button
            className="game__mini-btn"
            disabled={!canFoundCity}
            onClick={onFoundCity}
            title={t.actions.foundCity}
            type="button"
            variant="ghost"
            size="compact"
          >
            🏠
          </Button>
          <Button
            className="game__mini-btn"
            disabled={
              controlsDisabled || !canBuild || submitPending || !isMyTurn
            }
            onClick={onBuild}
            title={t.actions.build}
            type="button"
            variant="ghost"
            size="compact"
          >
            🏗️
          </Button>
          <Button
            className="game__mini-btn"
            disabled={!canOpenProductionMenu}
            onClick={onProduce}
            title={t.actions.produce}
            type="button"
            variant="ghost"
            size="compact"
          >
            🏭
          </Button>
        </div>
      )}

      <div className="game__end-turn-container">
        <button
          className="game__turn-timer-ring"
          onClick={onEndTurn}
          disabled={endTurnDisabled}
          type="button"
          style={turnTimerStyle}
        >
          <span className="game__turn-timer-label">
            {waitingForOpponents ? "⏳" : t.endTurn}
          </span>
          <span className="game__turn-timer-count">{turnRemaining}s</span>
        </button>
      </div>
    </div>
  );
}
