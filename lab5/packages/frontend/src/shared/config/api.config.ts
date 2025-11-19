const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const API_CONFIG = {
  baseUrl: USE_MOCK
    ? "https://api.hex-strategy.local"
    : "http://localhost:9999",
  endpoints: {
    createLobby: "/lobbies",
    joinLobby: "/lobbies/join",
    getLobby: (lobbyId: string) => `/lobbies/${lobbyId}`,
    toggleReady: (lobbyId: string) => `/lobbies/${lobbyId}/ready`,
    startLobby: (lobbyId: string) => `/lobbies/${lobbyId}/start`,
    gameState: (gameId: string) => `/games/${gameId}`,
    placeCapital: (gameId: string) => `/games/${gameId}/place-capital`,
  },
};

export type ApiConfig = typeof API_CONFIG;
