import { rest } from "msw";
import { API_CONFIG } from "../shared/config/api.config";
import type { LobbySummary, LobbyPlayer } from "../entities/lobby/types";
import type {
  CreateLobbyPayload,
  JoinLobbyPayload,
} from "../entities/lobby/api/lobbyApi";

const baseUrl = API_CONFIG.baseUrl;

let lobbyState: LobbySummary | null = null;

function buildPlayer(payload: { id: string; nickname: string }, isHost = false): LobbyPlayer {
  return {
    id: payload.id,
    nickname: payload.nickname,
    rank: isHost ? "Commander" : "Soldier",
    isReady: isHost,
    isHost,
  };
}

export const handlers = [
  rest.post(`${baseUrl}${API_CONFIG.endpoints.createLobby}`, async (req, res, ctx) => {
    const body = (await req.json()) as CreateLobbyPayload;

    const lobbyId = `lobby-${Date.now()}`;
    const code = lobbyId.slice(-4).toUpperCase();

    lobbyState = {
      id: lobbyId,
      code,
      hostId: body.hostId,
      players: [buildPlayer({ id: body.hostId, nickname: body.nickname }, true)],
    };

    return res(ctx.delay(400), ctx.status(200), ctx.json(lobbyState));
  }),

  rest.post(`${baseUrl}${API_CONFIG.endpoints.joinLobby}`, async (req, res, ctx) => {
    const body = (await req.json()) as JoinLobbyPayload;

    if (!lobbyState || body.code.toUpperCase() !== lobbyState.code) {
      return res(ctx.status(404), ctx.json({ message: "Lobby not found" }));
    }

    const alreadyIn = lobbyState.players.some((player) => player.id === body.playerId);
    if (!alreadyIn) {
      lobbyState = {
        ...lobbyState,
        players: [...lobbyState.players, buildPlayer({ id: body.playerId, nickname: body.nickname })],
      };
    }

    return res(ctx.delay(400), ctx.status(200), ctx.json(lobbyState));
  }),
];
