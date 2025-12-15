import { useMutation } from "@tanstack/react-query";
import {
  type CreateLobbyPayload,
  type JoinLobbyPayload,
  type LeaveLobbyPayload,
  lobbyApi,
  type StartLobbyPayload,
  type ToggleReadyPayload,
} from "../api/lobbyApi";
import { useLobbyStore } from "./useLobbyStore";

export function useCreateLobbyMutation() {
  const setLobby = useLobbyStore((state) => state.setLobby);
  return useMutation({
    mutationFn: (payload: CreateLobbyPayload) => lobbyApi.create(payload),
    onSuccess: (data, variables) => setLobby(data, variables.playerId),
  });
}

export function useJoinLobbyMutation() {
  const setLobby = useLobbyStore((state) => state.setLobby);
  return useMutation({
    mutationFn: (payload: JoinLobbyPayload) => lobbyApi.join(payload),
    onSuccess: (data, variables) => setLobby(data, variables.playerId),
  });
}

export function useToggleReadyMutation() {
  const setLobby = useLobbyStore((state) => state.setLobby);
  const selfId = useLobbyStore((state) => state.selfId);
  return useMutation({
    mutationFn: (payload: ToggleReadyPayload) => lobbyApi.toggleReady(payload),
    onSuccess: (data) => {
      if (selfId) {
        setLobby(data, selfId);
      }
    },
  });
}

export function useStartLobbyMutation() {
  const setGameId = useLobbyStore((state) => state.setGameId);
  return useMutation({
    mutationFn: (payload: StartLobbyPayload) => lobbyApi.start(payload),
    onSuccess: (response) => {
      setGameId(response.gameId);
    },
  });
}

export function useLeaveLobbyMutation() {
  const reset = useLobbyStore((state) => state.reset);
  return useMutation({
    mutationFn: (payload: LeaveLobbyPayload) => lobbyApi.leave(payload),
    onSuccess: () => reset(),
  });
}
