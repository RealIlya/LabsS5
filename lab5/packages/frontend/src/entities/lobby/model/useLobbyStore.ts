import { create } from "zustand";
import type { LobbyState } from "../types";

interface LobbyStoreState {
  lobby: LobbyState | null;
  selfId: string | null;
  currentGameId: string | null;
  setLobby: (data: LobbyState, selfId: string) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  setGameId: (gameId: string | null) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyStoreState>((set) => ({
  lobby: null,
  selfId: null,
  currentGameId: null,
  setLobby: (data, selfId) =>
    set({ lobby: data, selfId, currentGameId: data.gameId ?? null }),
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
