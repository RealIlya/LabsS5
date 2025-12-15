import type { GameState, PlayerAction } from "@hex/shared";
import { request } from "../../../shared/api/request";
import { apiConfig } from "../../../shared/config/api.config";
export type GameStateDto = GameState;

export function getGameState(gameId: string) {
  return request<GameStateDto>(
    `${apiConfig.restBaseUrl}${apiConfig.endpoints.gameState(gameId)}`,
    {
      method: "GET",
    }
  );
}

export interface PlaceCapitalPayload {
  gameId: string;
  tileId: string;
  playerId: string;
}

export function placeCapital(payload: PlaceCapitalPayload) {
  return request<GameStateDto>(
    `${apiConfig.restBaseUrl}${apiConfig.endpoints.placeCapital(
      payload.gameId
    )}`,
    {
      method: "POST",
      body: JSON.stringify({
        playerId: payload.playerId,
        tileId: payload.tileId,
      }),
    }
  );
}

export interface SubmitActionPayload {
  gameId: string;
  playerId: string;
  action: PlayerAction;
}

export function submitAction(payload: SubmitActionPayload) {
  return request<GameStateDto>(
    `${apiConfig.restBaseUrl}/games/${payload.gameId}/actions`,
    {
      method: "POST",
      body: JSON.stringify({
        playerId: payload.playerId,
        action: payload.action,
      }),
    }
  );
}
