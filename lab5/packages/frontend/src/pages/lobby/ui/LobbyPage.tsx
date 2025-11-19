import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import type { LobbyPlayer } from "../../../entities/lobby/types";
import { translations } from "../../../shared/i18n";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import {
  useStartLobbyMutation,
  useToggleReadyMutation,
} from "../../../entities/lobby/model/useLobbyMutations";
import { lobbyApi } from "../../../entities/lobby/api/lobbyApi";
import "./LobbyPage.css";

const fallbackPlayers: LobbyPlayer[] = [
  {
    id: "player-1",
    nickname: "Nova",
    rank: "Стратег",
    isHost: true,
    isReady: false,
  },
  {
    id: "player-2",
    nickname: "Sentinel",
    rank: "Тактик",
    isHost: false,
    isReady: false,
  },
];

export function LobbyPage() {
  const t = useMemo(() => translations.ru.lobby, []);
  const lobby = useLobbyStore((state) => state.lobby);
  const selfId = useLobbyStore((state) => state.selfId);
  const players = lobby?.players ?? fallbackPlayers;
  const effectiveSelfId = selfId ?? players[0]?.id ?? "";
  const lobbyCode = lobby?.code ?? "----";
  const lobbyId = lobby?.id ?? null;
  const lobbyStatus = lobby?.status ?? "waiting";
  const lobbyGameId = lobby?.gameId ?? null;
  const setLobby = useLobbyStore((state) => state.setLobby);
  const setGameId = useLobbyStore((state) => state.setGameId);
  const navigate = useNavigate();
  const toggleReadyMutation = useToggleReadyMutation();
  const startLobbyMutation = useStartLobbyMutation();
  const isStarting = startLobbyMutation.isPending;

  const currentPlayer = players.find((player) => player.id === effectiveSelfId);
  const allReady = players.every((player) => player.isReady);
  const isHost = Boolean(currentPlayer?.isHost);
  const pollingDisabled = !lobbyId || !selfId || lobbyStatus !== "waiting" || isStarting;

  useEffect(() => {
    if (pollingDisabled) {
      return undefined;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        if (!lobbyId) {
          return;
        }
        const data = await lobbyApi.getById(lobbyId);
        if (!cancelled && selfId) {
          setLobby(data, selfId);
        }
      } catch (error) {
        console.error(error);
      }
    };

    tick();
    const interval = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollingDisabled, lobbyId, selfId, setLobby]);

  useEffect(() => {
    if (lobbyStatus === "in-progress" && lobbyGameId) {
      setGameId(lobbyGameId);
      navigate(`/game?gameId=${lobbyGameId}`);
    }
  }, [lobbyStatus, lobbyGameId, navigate, setGameId]);

  const handleToggleReady = () => {
    if (!lobby || !selfId || !currentPlayer) {
      return;
    }
    toggleReadyMutation.mutate({
      lobbyId: lobby.id,
      playerId: selfId,
      isReady: !currentPlayer.isReady,
    });
  };

  const handleStart = () => {
    if (!lobby) {
      navigate("/game");
      return;
    }
    startLobbyMutation.mutate(
      { lobbyId: lobby.id },
      {
        onSuccess: (data) => navigate(`/game?gameId=${data.gameId}`),
      }
    );
  };

  return (
    <div className="lobby">
      <header className="lobby__header">
        <div className="lobby__header-row">
          <p>{t.title}</p>
          <div className="lobby__code" aria-label={t.codeLabel}>
            <span>{t.codeLabel}</span>
            <strong>{lobbyCode}</strong>
          </div>
        </div>
        <h1>{t.waiting}</h1>
      </header>

      <section className="lobby__players">
        <h2>{t.playerListTitle}</h2>
        <ul>
          {players.map((player) => (
            <li key={player.id} className="lobby__player-row">
              <div>
                <strong>
                  {player.nickname} {player.id === effectiveSelfId ? t.youLabel : ""}
                </strong>
                {player.rank ? (
                  <span className="lobby__player-rank">{player.rank}</span>
                ) : null}
                {player.isHost ? (
                  <span className="lobby__host-tag">{t.hostLabel}</span>
                ) : null}
              </div>
              <div className="lobby__player-actions">
                <span>{player.isReady ? t.statusReady : t.statusNotReady}</span>
                {player.id === selfId ? (
                  <Button
                    variant="secondary"
                    onClick={handleToggleReady}
                    aria-label={t.toggleReady}
                    disabled={toggleReadyMutation.isPending}
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
        <Button
          disabled={!isHost || !allReady || startLobbyMutation.isPending}
          onClick={handleStart}
        >
          {allReady ? t.start : t.startDisabled}
        </Button>
      </footer>
    </div>
  );
}

export default LobbyPage;
