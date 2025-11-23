import { create } from "zustand";
import type { LobbyState } from "../types";

interface LobbyStoreState {
  lobby: LobbyState | null;
  selfId: string | null;
  currentGameId: string | null;
  setLobby: (data: LobbyState, selfId: string) => void;
  setSelfId: (id: string | null) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  setGameId: (gameId: string | null) => void;
  reset: () => void;
}

const GAME_STORAGE_KEY = "hex-current-game";

const readStoredGameId = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(GAME_STORAGE_KEY);
};

const writeStoredGameId = (value: string | null) => {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(GAME_STORAGE_KEY, value);
  } else {
    window.localStorage.removeItem(GAME_STORAGE_KEY);
  }
};

export const useLobbyStore = create<LobbyStoreState>((set) => ({
  lobby: null,
  selfId: null,
  currentGameId: readStoredGameId(),
  setLobby: (data, selfId) => {
    const gameId = data.gameId ?? null;
    writeStoredGameId(gameId);
    set({ lobby: data, selfId, currentGameId: gameId });
  },
  setSelfId: (id) => set({ selfId: id }),
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
  setGameId: (gameId) => {
    writeStoredGameId(gameId);
    set({ currentGameId: gameId });
  },
  reset: () => {
    writeStoredGameId(null);
    set({ lobby: null, selfId: null, currentGameId: null });
  },
}));
