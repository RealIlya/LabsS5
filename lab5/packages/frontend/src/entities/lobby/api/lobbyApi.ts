import { API_CONFIG } from "../../../shared/config/api.config";
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

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const lobbyApi = {
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
};
