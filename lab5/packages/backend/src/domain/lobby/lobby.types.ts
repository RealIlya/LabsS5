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
  name: string;
  code: string;
  hostId: string;
  gameId: string;
  maxPlayers: number;
  status: LobbyStatus;
  players: LobbyPlayer[];
}
