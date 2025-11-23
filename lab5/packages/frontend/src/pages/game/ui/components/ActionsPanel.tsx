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
  onShowPlayers: () => void;
  onMoveToggle: () => void;
  onAttackToggle: () => void;
  onEndTurn: () => void;
  endTurnDisabled: boolean;
  waitingForOpponents: boolean;
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
  onShowPlayers,
  onMoveToggle,
  onAttackToggle,
  onEndTurn,
  endTurnDisabled,
  waitingForOpponents,
}: ActionsPanelProps) {
  return (
    <div className="game__hud-right">
      <div className="game__hud-panel">
        <div className="game__actions-grid">
          <Button
            variant="secondary"
            size="icon"
            disabled={controlsDisabled || !canAttack || !isMyTurn}
            title={t.actions.attack}
            aria-label={t.actions.attack}
            onClick={onAttackToggle}
            className={attackActive ? "game__action-active" : undefined}
          >
            ⚔️
          </Button>
          <Button
            variant="secondary"
            size="icon"
            disabled={controlsDisabled || !canMove || !isMyTurn}
            title={t.actions.move}
            aria-label={t.actions.move}
            onClick={onMoveToggle}
            className={moveActive ? "game__action-active" : undefined}
          >
            👟
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onFoundCity}
            disabled={!canFoundCity}
            title={t.actions.foundCity}
            aria-label={t.actions.foundCity}
          >
            🏠
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onBuild}
            disabled={
              controlsDisabled || !canBuild || submitPending || !isMyTurn
            }
            title={t.actions.build}
            aria-label={t.actions.build}
          >
            🏗️
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={onProduce}
            disabled={!canOpenProductionMenu}
            title={t.actions.produce}
            aria-label={t.actions.produce}
          >
            🏭
          </Button>
        </div>

        <Button variant="secondary" onClick={onShowPlayers}>
          {t.playersList}
        </Button>

        <Button
          className="game__end-turn-btn"
          onClick={onEndTurn}
          disabled={endTurnDisabled}
        >
          {waitingForOpponents ? t.capitalPlacement.waiting : t.endTurn}
        </Button>
      </div>
    </div>
  );
}
