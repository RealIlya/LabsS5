export const API_PREFIX = "api";

export const API_ENDPOINTS = {
  listLobbies: "/lobbies",
  lobbyState: (lobbyId: string) => `/lobbies/${lobbyId}/state`,
  createLobby: "/lobbies",
  joinLobby: "/lobbies/join",
  toggleReady: (lobbyId: string) => `/lobbies/${lobbyId}/ready`,
  startLobby: (lobbyId: string) => `/lobbies/${lobbyId}/start`,
  leaveLobby: (lobbyId: string) => `/lobbies/${lobbyId}/players`,
  gameState: (gameId: string) => `/games/${gameId}`,
  placeCapital: (gameId: string) => `/games/${gameId}/place-capital`,
  authProfile: "/profiles/auth",
} as const;
