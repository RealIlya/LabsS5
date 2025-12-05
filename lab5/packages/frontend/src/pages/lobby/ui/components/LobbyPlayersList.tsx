import type { LobbyPlayerState } from "../../../../entities/lobby/types";
import { Button } from "../../../../shared/ui/button";

interface LobbyPlayersListProps {
  players: LobbyPlayerState[];
  maxPlayers?: number;
  effectiveSelfId: string;
  selfId: string | null;
  hostId: string | null;
  readyDisabled: boolean;
  onToggleReady: () => void;
  t: typeof import("../../../../shared/i18n").translations.ru.lobby;
}

export function LobbyPlayersList({
  players,
  maxPlayers,
  effectiveSelfId,
  selfId,
  hostId,
  readyDisabled,
  onToggleReady,
  t,
}: LobbyPlayersListProps) {
  return (
    <section className="lobby__players-section">
      <h2>
        {t.playerListTitle}
        <span style={{ color: "var(--color-hud-accent)" }}>
          {typeof maxPlayers === "number" ? `${players.length}/${maxPlayers}` : ""}
        </span>
      </h2>
      <ul className="lobby__players-list">
        {players.map((player) => (
          <li key={player.id} className="lobby__player-row">
            <div className="lobby__player-info">
              <div className="lobby__avatar">👤</div>
              <div>
                <span className="lobby__player-name">{player.name}</span>
                {player.id === effectiveSelfId && (
                  <span className="lobby__you-tag">{t.youLabel}</span>
                )}
                {hostId && player.id === hostId && (
                  <span className="lobby__host-icon">{t.hostLabel}</span>
                )}
              </div>
            </div>

            <div className="lobby__player-status">
              {player.id === selfId ? (
                <Button
                  variant={player.isReady ? "primary" : "secondary"}
                  onClick={onToggleReady}
                  disabled={readyDisabled}
                  style={{ minWidth: 100 }}
                >
                  {player.isReady ? t.ready : t.notReady}
                </Button>
              ) : (
                <span
                  style={{
                    color: player.isReady
                      ? "var(--color-success)"
                      : "var(--color-text-secondary)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    fontSize: "0.9rem",
                  }}
                >
                  {player.isReady ? t.ready : t.notReady}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
