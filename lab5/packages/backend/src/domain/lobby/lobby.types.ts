export interface LobbyPlayer {
  id: string;
  nickname: string;
  rank: string;
  isHost: boolean;
  isReady: boolean;
}

export type LobbyStatus = "waiting" | "in-progress" | "finished";

export interface Lobby {
  id: string;
  code: string;
  hostId: string;
  gameId: string;
  status: LobbyStatus;
  players: LobbyPlayer[];
}
