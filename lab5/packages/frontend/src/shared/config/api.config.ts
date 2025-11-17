export const API_CONFIG = {
  baseUrl: "https://api.hex-strategy.local",
  endpoints: {
    createLobby: "/lobbies",
    joinLobby: "/lobbies/join",
    listLobbies: "/lobbies",
    gameState: (gameId: string) => `/games/${gameId}`,
  },
};

export type ApiConfig = typeof API_CONFIG;
