import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import type { LobbyPlayerState, LobbyState } from "../../../entities/lobby/types";
import { translations } from "../../../shared/i18n";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import {
  useStartLobbyMutation,
  useToggleReadyMutation,
} from "../../../entities/lobby/model/useLobbyMutations";
import { API_CONFIG } from "../../../shared/config/api.config";
import { lobbyApi } from "../../../entities/lobby/api/lobbyApi";
import { io, type Socket } from "socket.io-client";
import { useConnectionStatus } from "../../../shared/hooks/useConnectionStatus";
import "./LobbyPage.css";

const fallbackPlayers: LobbyPlayerState[] = [
  {
    id: "player-1",
    name: "Nova",
    isReady: false,
  },
  {
    id: "player-2",
    name: "Sentinel",
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
  const socketRef = useRef<Socket | null>(null);
  const connectionStatus = useConnectionStatus();
  const [socketError, setSocketError] = useState<string | null>(null);
  const connectionDown =
    connectionStatus.status !== "online" || Boolean(socketError);
  const connectionMessage =
    socketError ?? connectionStatus.message ?? t.connectionLost;

  const currentPlayer = players.find((player) => player.id === effectiveSelfId);
  const allReady = players.every((player) => player.isReady);
  const isHost = lobby ? lobby.hostId === currentPlayer?.id : currentPlayer?.id === fallbackPlayers[0]?.id;

  useEffect(() => {
    if (!lobbyId || !selfId || API_CONFIG.useMock || !API_CONFIG.socketBaseUrl) {
      return undefined;
    }

    const socket = io(`${API_CONFIG.socketBaseUrl}/lobby`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    const handleUpdate = (state: LobbyState) => {
      setLobby(state, selfId);
      setSocketError(null);
    };

    const handleGameStarted = (payload: { gameId: string }) => {
      setGameId(payload.gameId);
      navigate(`/game?gameId=${payload.gameId}`);
    };

    socket.on("connect", () => {
      socket.emit("lobby:join", { lobbyId });
      setSocketError(null);
    });
    socket.on("disconnect", () => {
      setSocketError(t.connectionLost);
    });
    socket.on("connect_error", (error: Error) => {
      setSocketError(error.message ?? t.connectionLost);
    });
    socket.on("lobby:update", handleUpdate);
    socket.on("lobby:game_started", handleGameStarted);
    socket.on("lobby:error", (payload: { message: string }) => {
      setSocketError(payload?.message ?? t.connectionLost);
    });

    return () => {
      socket.off("lobby:update", handleUpdate);
      socket.off("lobby:game_started", handleGameStarted);
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [lobbyId, selfId, navigate, setGameId, setLobby, t.connectionLost]);

  useEffect(() => {
    if (!lobbyId || !selfId || (!API_CONFIG.useMock && API_CONFIG.socketBaseUrl)) {
      return undefined;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const state = await lobbyApi.getState(lobbyId);
        if (!cancelled) {
          setLobby(state, selfId);
          setSocketError(null);
        }
      } catch (error) {
        setSocketError(t.connectionLost);
      }
    };
    tick();
    const interval = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [lobbyId, selfId, setLobby, t.connectionLost]);

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
        onSuccess: (data) => {
          if (API_CONFIG.useMock || !API_CONFIG.socketBaseUrl) {
            navigate(`/game?gameId=${data.gameId}`);
          }
        },
      }
    );
  };

  return (
    <div className="lobby">
      <header className="lobby__header">
        <div className="lobby__header-row">
          <div>
            <p>{t.title}</p>
            <h1>{lobby?.name ?? t.waiting}</h1>
          </div>
          <div className="lobby__code" aria-label={t.codeLabel}>
            <span>{t.codeLabel}</span>
            <strong>{lobbyCode}</strong>
          </div>
        </div>
        <p className="lobby__status-text">
          {lobbyStatus === "waiting" ? t.waiting : t.start}
        </p>
      </header>

      <section className="lobby__players">
        <h2>
          {t.playerListTitle}
          {lobby ? ` · ${players.length}/${lobby.maxPlayers}` : ""}
        </h2>
        <ul>
          {players.map((player) => (
            <li key={player.id} className="lobby__player-row">
              <div>
                <strong>
                  {player.name} {player.id === effectiveSelfId ? t.youLabel : ""}
                </strong>
                {lobby && player.id === lobby.hostId ? (
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
                    disabled={
                      toggleReadyMutation.isPending || lobbyStatus !== "waiting"
                    }
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
          disabled={
            !isHost ||
            !allReady ||
            lobbyStatus !== "waiting" ||
            startLobbyMutation.isPending
          }
          onClick={handleStart}
        >
          {allReady ? t.start : t.startDisabled}
        </Button>
      </footer>

      {connectionDown ? (
        <div className="connection-modal" role="alert">
          <div className="connection-modal__content">
            <h3>{t.connectionLost}</h3>
            <p>{connectionMessage ?? t.connectionRetry}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LobbyPage;
