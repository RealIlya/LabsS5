import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_CONFIG } from "../../../shared/config/api.config";
import type { LobbyState } from "../types";

interface UseLobbySocketParams {
  lobbyId: string | null;
  selfId: string | null;
  onStateUpdate(state: LobbyState): void;
  onGameStarted(payload: { gameId: string }): void;
  onRemoved(): void;
  onError(message: string | null): void;
}

export function useLobbySocket({
  lobbyId,
  selfId,
  onStateUpdate,
  onGameStarted,
  onRemoved,
  onError,
}: UseLobbySocketParams) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (
      !lobbyId ||
      !selfId ||
      API_CONFIG.useMock ||
      !API_CONFIG.socketBaseUrl
    ) {
      return undefined;
    }

    const socket = io(`${API_CONFIG.socketBaseUrl}/ws/lobby`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    const handleUpdate = (state: LobbyState) => {
      onStateUpdate(state);
      onError(null);
    };

    const handleGameStarted = (payload: { gameId: string }) => {
      onGameStarted(payload);
      onError(null);
    };

    const handleRemoved = () => {
      onRemoved();
    };

    const handleDisconnect = () => {
      onError("disconnect");
    };

    const handleConnectError = (error: Error) => {
      onError(error.message ?? "connection_error");
    };

    socket.on("connect", () => {
      socket.emit("lobby:join", { lobbyId });
      onError(null);
    });
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("lobby:update", handleUpdate);
    socket.on("lobby:game_started", handleGameStarted);
    socket.on("lobby:error", (payload: { message?: string }) => {
      onError(payload?.message ?? "connection_error");
    });
    socket.on("lobby:removed", handleRemoved);

    return () => {
      socket.off("lobby:update", handleUpdate);
      socket.off("lobby:game_started", handleGameStarted);
      socket.off("lobby:removed", handleRemoved);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [lobbyId, selfId, onStateUpdate, onGameStarted, onRemoved, onError]);
}

