import type { LobbyState, LobbySummary } from "@hex/shared";
import { request } from "../../../shared/api/request";
import { apiConfig } from "../../../shared/config/api.config";

const { restBaseUrl, endpoints } = apiConfig;

export interface CreateLobbyPayload {
  playerId: string;
  playerName: string;
  lobbyName?: string;
  maxPlayers?: number;
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

export interface LeaveLobbyPayload {
  lobbyId: string;
  playerId: string;
}

export const lobbyApi = {
  list() {
    return request<LobbySummary[]>(`${restBaseUrl}${endpoints.listLobbies}`, {
      method: "GET",
    });
  },
  getState(lobbyId: string) {
    return request<LobbyState>(
      `${restBaseUrl}${endpoints.lobbyState(lobbyId)}`,
      {
        method: "GET",
      }
    );
  },
  create(payload: CreateLobbyPayload) {
    return request<LobbyState>(`${restBaseUrl}${endpoints.createLobby}`, {
      method: "POST",
      body: JSON.stringify({
        hostId: payload.playerId,
        playerId: payload.playerId,
        nickname: payload.playerName,
        playerName: payload.playerName,
        name: payload.lobbyName,
        maxPlayers: payload.maxPlayers,
      }),
    });
  },
  join(payload: JoinLobbyPayload) {
    return request<LobbyState>(`${restBaseUrl}${endpoints.joinLobby}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  toggleReady(payload: ToggleReadyPayload) {
    return request<LobbyState>(
      `${restBaseUrl}${endpoints.toggleReady(payload.lobbyId)}`,
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
      `${restBaseUrl}${endpoints.startLobby(payload.lobbyId)}`,
      { method: "POST" }
    );
  },
  leave(payload: LeaveLobbyPayload) {
    return request<{ removed?: boolean }>(
      `${restBaseUrl}${endpoints.leaveLobby(payload.lobbyId)}`,
      {
        method: "DELETE",
        body: JSON.stringify({ playerId: payload.playerId }),
      }
    );
  },
};
