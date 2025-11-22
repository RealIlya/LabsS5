export type LobbyStatus = "waiting" | "in-progress" | "finished";

export interface LobbyPlayerState {
  id: string;
  name: string;
  isReady: boolean;
}

export interface LobbySummary {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
}

export interface LobbyState {
  id: string;
  name: string;
  code: string;
  status: LobbyStatus;
  hostId: string;
  gameId: string;
  maxPlayers: number;
  players: LobbyPlayerState[];
}
