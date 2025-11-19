import type { PlayerData } from "@hex/shared";
import { API_CONFIG } from "../../../shared/config/api.config";
import { request } from "../../../shared/api/request";

export type GamePhase = "capital-placement" | "running";

export interface GameTileDto {
  id: string;
  x: number;
  y: number;
  terrain: string;
  structure?: {
    id: string;
    type: string;
    ownerId: string;
    ownerName: string;
    isCapital?: boolean;
  };
  unit?: {
    type: string;
    owner: string;
  };
}

export interface GameStateDto {
  id: string;
  turn: number;
  currentPlayer: string;
  phase: GamePhase;
  population: {
    current: number;
    cap: number;
  };
  map: {
    columns: number;
    rows: number;
  };
  players: PlayerData[];
  tiles: GameTileDto[];
}

export function getGameState(gameId: string) {
  return request<GameStateDto>(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.gameState(gameId)}`, {
    method: "GET",
  });
}

export interface PlaceCapitalPayload {
  gameId: string;
  tileId: string;
  playerId: string;
}

export function placeCapital(payload: PlaceCapitalPayload) {
  return request<GameStateDto>(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.placeCapital(payload.gameId)}`,
    {
      method: "POST",
      body: JSON.stringify({ playerId: payload.playerId, tileId: payload.tileId }),
    }
  );
}
