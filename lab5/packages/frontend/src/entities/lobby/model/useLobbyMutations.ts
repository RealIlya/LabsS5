import { useMutation } from "@tanstack/react-query";
import { lobbyApi, type CreateLobbyPayload, type JoinLobbyPayload } from "../api/lobbyApi";
import { useLobbyStore } from "./useLobbyStore";

export function useCreateLobbyMutation() {
  const setLobby = useLobbyStore((state) => state.setLobby);
  return useMutation({
    mutationFn: (payload: CreateLobbyPayload) => lobbyApi.create(payload),
    onSuccess: (data, variables) => setLobby(data, variables.hostId),
  });
}

export function useJoinLobbyMutation() {
  const setLobby = useLobbyStore((state) => state.setLobby);
  return useMutation({
    mutationFn: (payload: JoinLobbyPayload) => lobbyApi.join(payload),
    onSuccess: (data, variables) => setLobby(data, variables.playerId),
  });
}
