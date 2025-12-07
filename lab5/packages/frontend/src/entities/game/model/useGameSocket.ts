import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { API_CONFIG } from "../../../shared/config/api.config";
import type { GameStateDto } from "../api/gameApi";

interface UseGameSocketParams {
  gameId: string | null;
}

export function useGameSocket({ gameId }: UseGameSocketParams) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!gameId || API_CONFIG.useMock || !API_CONFIG.socketBaseUrl) {
      return undefined;
    }

    const socket = io(`${API_CONFIG.socketBaseUrl}/ws/game`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    const handleUpdate = (state: GameStateDto) => {
      queryClient.setQueryData(["game", gameId], state);
    };

    socket.on("connect", () => {
      socket.emit("game:join", { gameId });
    });
    socket.on("game:update", handleUpdate);
    socket.on("game:error", (payload: { message?: string }) => {
      // eslint-disable-next-line no-console
      console.error("Game socket error:", payload?.message);
    });

    return () => {
      socket.off("game:update", handleUpdate);
      socket.off("game:error");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId, queryClient]);
}

