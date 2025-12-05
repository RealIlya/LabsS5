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
}: ActionsPanelProps) {
  const anyUnitActions =
    canAttack || canMove || canFoundCity || canBuild || canOpenProductionMenu;

  return (
    <div className="game__hud-right">
      {anyUnitActions && (
        <div className="game__unit-actions">
          <button
            className={`game__mini-btn ${
              attackActive ? "game__mini-btn--active" : ""
            }`}
            disabled={controlsDisabled || !canAttack || !isMyTurn}
            onClick={onAttackToggle}
            title={t.actions.attack}
          >
            ⚔️
          </button>
          <button
            className={`game__mini-btn ${
              moveActive ? "game__mini-btn--active" : ""
            }`}
            disabled={controlsDisabled || !canMove || !isMyTurn}
            onClick={onMoveToggle}
            title={t.actions.move}
          >
            👟
          </button>
          <button
            className="game__mini-btn"
            disabled={!canFoundCity}
            onClick={onFoundCity}
            title={t.actions.foundCity}
          >
            🏠
          </button>
          <button
            className="game__mini-btn"
            disabled={
              controlsDisabled || !canBuild || submitPending || !isMyTurn
            }
            onClick={onBuild}
            title={t.actions.build}
          >
            🏗️
          </button>
          <button
            className="game__mini-btn"
            disabled={!canOpenProductionMenu}
            onClick={onProduce}
            title={t.actions.produce}
          >
            🏭
          </button>
        </div>
      )}

      <div className="game__end-turn-container">
        <button
          className="game__end-turn-btn"
          onClick={onEndTurn}
          disabled={endTurnDisabled}
        >
          {waitingForOpponents ? "⏳" : t.endTurn}
        </button>
      </div>
    </div>
  );
}
