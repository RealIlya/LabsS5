import { create } from "zustand";
import type { LobbySummary } from "../types";

interface LobbyState {
  lobby: LobbySummary | null;
  selfId: string | null;
  setLobby: (data: LobbySummary, selfId: string) => void;
  reset: () => void;
}

export const useLobbyStore = create<LobbyState>((set) => ({
  lobby: null,
  selfId: null,
  setLobby: (data, selfId) => set({ lobby: data, selfId }),
  reset: () => set({ lobby: null, selfId: null }),
}));
