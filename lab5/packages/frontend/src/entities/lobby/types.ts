export interface LobbyPlayer {
  id: string;
  nickname: string;
  rank?: string;
  isReady: boolean;
  isHost: boolean;
}

export interface LobbySummary {
  id: string;
  code: string;
  hostId: string;
  status: "waiting" | "in-progress" | "finished";
  players: LobbyPlayer[];
  gameId: string;
}
