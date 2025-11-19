import { create } from "zustand";
import type { LobbySummary } from "../types";

interface LobbyState {
  lobby: LobbySummary | null;
  selfId: string | null;
  currentGameId: string | null;
  setLobby: (data: LobbySummary, selfId: string) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  setGameId: (gameId: string | null) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  lobby: null,
  selfId: null,
  currentGameId: null,
  setLobby: (data, selfId) => set({ lobby: data, selfId }),
  updatePlayerReady: (playerId, isReady) =>
    set((state) => {
      if (!state.lobby) {
        return state;
      }
      return {
        lobby: {
          ...state.lobby,
          players: state.lobby.players.map((player) =>
            player.id === playerId ? { ...player, isReady } : player
          ),
        },
      };
    }),
  setGameId: (gameId) => set({ currentGameId: gameId }),
  reset: () => set({ lobby: null, selfId: null, currentGameId: null }),
}));
