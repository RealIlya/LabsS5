import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import type { PlayerProfile } from "@hex/shared";
import { translations } from "../../../shared/i18n";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import type { LobbyPlayer } from "../../../entities/lobby/types";
import "./LobbyPage.css";

const mockPlayers: LobbyPlayer[] = [
  {
    id: "player-1",
    nickname: "Командир Nova",
    rank: "Hex HQ",
    status: "online",
    isHost: true,
    isReady: true,
  },
  {
    id: "player-2",
    nickname: "Sentinel",
    rank: "Shield Ops",
    status: "online",
    isHost: false,
    isReady: false,
  },
  {
    id: "player-3",
    nickname: "Ghost",
    rank: "Recon",
    status: "offline",
    isHost: false,
    isReady: false,
  },
];

export function LobbyPage() {
  const t = useMemo(() => translations.ru.lobby, []);
  const lobby = useLobbyStore((state) => state.lobby);
  const selfId = useLobbyStore((state) => state.selfId) ?? "player-1";
  const [players, setPlayers] = useState<LobbyPlayer[]>(lobby?.players ?? mockPlayers);
  const navigate = useNavigate();

  useEffect(() => {
    if (lobby?.players) {
      setPlayers(lobby.players);
    }
  }, [lobby?.players]);

  const toggleReady = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId
          ? {
              ...player,
              isReady: !player.isReady,
            }
          : player
      )
    );
  };

  const allReady = players.every((player) => player.isReady);
  const isHost = players.find((p) => p.id === selfId)?.isHost;

  return (
    <div className="lobby">
      <header className="lobby__header">
        <p>{t.title}</p>
        <h1>{t.waiting}</h1>
      </header>

      <section className="lobby__players">
        <h2>{t.playerListTitle}</h2>
        <ul>
          {players.map((player) => (
            <li key={player.id} className="lobby__player-row">
              <div>
                <strong>
                  {player.nickname} {player.id === selfId ? t.youLabel : ""}
                </strong>
                {player.isHost ? <span className="lobby__host-tag">{t.hostLabel}</span> : null}
              </div>
              <div className="lobby__player-actions">
                <span>
                  {player.isReady ? t.statusReady : t.statusNotReady}
                </span>
                {player.id === selfId ? (
                  <Button
                    variant="secondary"
                    onClick={() => toggleReady(player.id)}
                    aria-label={t.toggleReady}
                  >
                    {player.isReady ? t.ready : t.notReady}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="lobby__actions">
        <Button variant="secondary" onClick={() => navigate("/")}>
          {t.leave}
        </Button>
        <Button disabled={!isHost || !allReady}>{allReady ? t.start : t.startDisabled}</Button>
      </footer>
    </div>
  );
}

export default LobbyPage;
