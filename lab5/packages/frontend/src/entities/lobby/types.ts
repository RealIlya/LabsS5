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
  players: LobbyPlayer[];
}
