import { API_CONFIG } from "../../../shared/config/api.config";
import { request } from "../../../shared/api/request";
import type { LobbySummary } from "../types";

const { baseUrl, endpoints } = API_CONFIG;

export interface CreateLobbyPayload {
  hostId: string;
  nickname: string;
}

export interface JoinLobbyPayload {
  code: string;
  nickname: string;
  playerId: string;
}

export interface ToggleReadyPayload {
  lobbyId: string;
  playerId: string;
  isReady: boolean;
}

export interface StartLobbyPayload {
  lobbyId: string;
}

export interface StartLobbyResponse {
  gameId: string;
}

export const lobbyApi = {
  getById(lobbyId: string) {
    return request<LobbySummary>(`${baseUrl}${endpoints.getLobby(lobbyId)}`, {
      method: "GET",
    });
  },
  create(payload: CreateLobbyPayload) {
    return request<LobbySummary>(`${baseUrl}${endpoints.createLobby}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  join(payload: JoinLobbyPayload) {
    return request<LobbySummary>(`${baseUrl}${endpoints.joinLobby}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  toggleReady(payload: ToggleReadyPayload) {
    return request<LobbySummary>(
      `${baseUrl}${endpoints.toggleReady(payload.lobbyId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          playerId: payload.playerId,
          isReady: payload.isReady,
        }),
      }
    );
  },
  start(payload: StartLobbyPayload) {
    return request<StartLobbyResponse>(
      `${baseUrl}${endpoints.startLobby(payload.lobbyId)}`,
      { method: "POST" }
    );
  },
};
