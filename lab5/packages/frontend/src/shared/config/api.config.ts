const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const LOCAL_REST_BASE = "http://localhost:9999/api";
const LOCAL_SOCKET_BASE = "http://localhost:9999";

export const API_CONFIG = {
  useMock: USE_MOCK,
  restBaseUrl: USE_MOCK
    ? "https://api.hex-strategy.local"
    : LOCAL_REST_BASE,
  socketBaseUrl: USE_MOCK ? undefined : LOCAL_SOCKET_BASE,
  endpoints: {
    listLobbies: "/lobbies",
    lobbyState: (lobbyId: string) => `/lobbies/${lobbyId}/state`,
    createLobby: "/lobbies",
    joinLobby: "/lobbies/join",
    toggleReady: (lobbyId: string) => `/lobbies/${lobbyId}/ready`,
    startLobby: (lobbyId: string) => `/lobbies/${lobbyId}/start`,
    gameState: (gameId: string) => `/games/${gameId}`,
    placeCapital: (gameId: string) => `/games/${gameId}/place-capital`,
  },
};

export type ApiConfig = typeof API_CONFIG;
