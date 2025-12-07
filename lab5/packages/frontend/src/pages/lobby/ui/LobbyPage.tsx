import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  LobbyPlayerState,
  LobbyState,
} from "../../../entities/lobby/types";
import { translations } from "../../../shared/i18n";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import {
  useStartLobbyMutation,
  useToggleReadyMutation,
  useLeaveLobbyMutation,
} from "../../../entities/lobby/model/useLobbyMutations";
import { API_CONFIG } from "../../../shared/config/api.config";
import { lobbyApi } from "../../../entities/lobby/api/lobbyApi";
import { useConnectionStatus } from "../../../shared/hooks/useConnectionStatus";
import { useLobbySocket } from "../../../entities/lobby/model/useLobbySocket";
import {
  LobbyHeader,
  LobbyPlayersList,
  LobbyFooter,
  ConnectionStatusModal,
} from "./components";
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
  const statusText =
    lobbyStatus === "waiting" ? t.statusPreparing : t.statusLaunching;
  const lobbyGameId = lobby?.gameId ?? null;
  const setLobby = useLobbyStore((state) => state.setLobby);
  const setGameId = useLobbyStore((state) => state.setGameId);
  const resetLobby = useLobbyStore((state) => state.reset);
  const navigate = useNavigate();
  const toggleReadyMutation = useToggleReadyMutation();
  const startLobbyMutation = useStartLobbyMutation();
  const leaveLobbyMutation = useLeaveLobbyMutation();
  const connectionStatus = useConnectionStatus();
  const [socketError, setSocketError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "done" | "error">(
    "idle"
  );
  const connectionDown =
    connectionStatus.status === "offline" || Boolean(socketError);
  const connectionMessage =
    socketError ?? connectionStatus.message ?? t.connectionLost;

  const currentPlayer = players.find((player) => player.id === effectiveSelfId);
  const allReady = players.every((player) => player.isReady);
  const isHost = lobby
    ? lobby.hostId === currentPlayer?.id
    : currentPlayer?.id === fallbackPlayers[0]?.id;

  const handleSocketStateUpdate = useCallback(
    (state: LobbyState) => {
      const hasSelf = state.players.some((p) => p.id === selfId);
      if (!hasSelf) {
        resetLobby();
        navigate("/");
        return;
      }
      setLobby(state, selfId!);
    },
    [navigate, resetLobby, selfId, setLobby]
  );

  const handleSocketGameStarted = useCallback(
    (payload: { gameId: string }) => {
      setGameId(payload.gameId);
      navigate(`/game?gameId=${payload.gameId}`);
    },
    [navigate, setGameId]
  );

  const handleSocketRemoved = useCallback(() => {
    resetLobby();
    navigate("/");
  }, [navigate, resetLobby]);

  const handleSocketError = useCallback(
    (message: string | null) => {
      if (!message) {
        setSocketError(null);
      } else {
        setSocketError(t.connectionLost);
      }
    },
    [t.connectionLost]
  );

  useLobbySocket({
    lobbyId,
    selfId,
    onStateUpdate: handleSocketStateUpdate,
    onGameStarted: handleSocketGameStarted,
    onRemoved: handleSocketRemoved,
    onError: handleSocketError,
  });

  useEffect(() => {
    if (
      !lobbyId ||
      !selfId ||
      (!API_CONFIG.useMock && API_CONFIG.socketBaseUrl)
    ) {
      return undefined;
    }

    let cancelled = false;
    const tick = async () => {
      try {
        const state = await lobbyApi.getState(lobbyId);
        if (!cancelled) {
          const hasSelf = state.players.some((p) => p.id === selfId);
          if (!hasSelf) {
            resetLobby();
            navigate("/");
            return;
          }
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
  }, [lobbyId, selfId, navigate, resetLobby, setLobby, t.connectionLost]);

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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(lobbyCode);
      setCopyStatus("done");
      window.setTimeout(() => setCopyStatus("idle"), 1500);
    } catch (err) {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    }
  };

  const handleLeaveLobby = () => {
    if (lobby && selfId) {
      leaveLobbyMutation.mutate(
        { lobbyId: lobby.id, playerId: selfId },
        { onSettled: () => navigate("/") }
      );
    } else {
      navigate("/");
    }
  };

  const readyDisabled =
    toggleReadyMutation.isPending || lobbyStatus !== "waiting";
  const startDisabled =
    !isHost ||
    !allReady ||
    lobbyStatus !== "waiting" ||
    startLobbyMutation.isPending;
  const startLabel = isHost
    ? allReady
      ? `🚀 ${t.start}`
      : t.startDisabled
    : t.waitingHost;
  const highlightStart = allReady;
  const headerTitle = lobby?.name ?? t.waiting;

  return (
    <div className="lobby">
      <div className="lobby__container">
        <LobbyHeader
          title={headerTitle}
          statusLabel={t.statusLabel}
          statusText={statusText}
          codeLabel={t.codeLabel}
          lobbyCode={lobbyCode}
          copyStatus={copyStatus}
          onCopyCode={handleCopyCode}
          copyTooltip={t.copyCode}
        />

        <div className="lobby__content">
          <LobbyPlayersList
            players={players}
            maxPlayers={lobby?.maxPlayers}
            effectiveSelfId={effectiveSelfId}
            selfId={selfId}
            hostId={lobby?.hostId ?? null}
            readyDisabled={readyDisabled}
            onToggleReady={handleToggleReady}
            t={t}
          />
        </div>

        <LobbyFooter
          onLeave={handleLeaveLobby}
          onStart={handleStart}
          leaveDisabled={leaveLobbyMutation.isPending}
          startDisabled={startDisabled}
          leaveLabel={t.leave}
          startLabel={startLabel}
          highlightStart={highlightStart}
        />
      </div>

      {connectionDown ? (
        <ConnectionStatusModal
          title={t.connectionLost}
          message={connectionMessage ?? t.connectionRetry}
        />
      ) : null}
    </div>
  );
}

export default LobbyPage;
