import { http, HttpResponse } from "msw";
import { apiConfig } from "../shared/config/api.config";
import type { LobbyState, LobbyPlayerState } from "../entities/lobby/types";
import type { GameStateDto } from "../entities/game/api/gameApi";
import type {
  CreateLobbyPayload,
  JoinLobbyPayload,
} from "../entities/lobby/api/lobbyApi";

const baseUrl = apiConfig.restBaseUrl;
const PLAYER_COLORS = ["#5FB49C", "#FFB347", "#6C63FF", "#FF6F91"];
const MAP_COLUMNS = 12;
const MAP_ROWS = 10;
const TERRAIN_SEQUENCE = ["Plains", "Forest", "Hills", "Plains", "Water"];

let lobbyState: LobbyState | null = null;
const gameStates: Record<string, GameStateDto> = {};

function buildPlayer(
  payload: { id: string; nickname: string },
  options?: { isReady?: boolean }
): LobbyPlayerState {
  const { isReady = false } = options ?? {};
  return {
    id: payload.id,
    name: payload.nickname,
    isReady,
  };
}

function createEmptyTiles(): GameStateDto["tiles"] {
  return Array.from({ length: MAP_COLUMNS * MAP_ROWS }).map((_, index) => {
    const x = index % MAP_COLUMNS;
    const y = Math.floor(index / MAP_COLUMNS);
    return {
      id: `${x}-${y}`,
      x,
      y,
      terrain: TERRAIN_SEQUENCE[(x + y) % TERRAIN_SEQUENCE.length],
      ownerId: null,
    };
  });
}

function recalcPopulation(players: GameStateDto["players"]) {
  return players.reduce(
    (acc, player) => ({
      current: acc.current + player.currentPopulation,
      cap: acc.cap + player.populationCap,
    }),
    { current: 0, cap: 0 }
  );
}

export const handlers = [
  http.get(`${baseUrl}${apiConfig.endpoints.listLobbies}`, () => {
    if (!lobbyState) {
      return HttpResponse.json([]);
    }
    return HttpResponse.json([
      {
        id: lobbyState.id,
        name: lobbyState.name,
        playerCount: lobbyState.players.length,
        maxPlayers: lobbyState.maxPlayers,
      },
    ]);
  }),

  http.post(
    `${baseUrl}${apiConfig.endpoints.createLobby}`,
    async ({ request }) => {
      const body = (await request.json()) as CreateLobbyPayload;

      const lobbyId = `lobby-${Date.now()}`;
      const code = lobbyId.slice(-4).toUpperCase();

      lobbyState = {
        id: lobbyId,
        name: body.lobbyName ?? `${body.playerName}'s Lobby`,
        code,
        hostId: body.playerId,
        status: "waiting",
        maxPlayers: body.maxPlayers ?? 4,
        gameId: lobbyId,
        players: [
          buildPlayer({ id: body.playerId, nickname: body.playerName }),
        ],
      };

      gameStates[lobbyId] = {
        id: lobbyId,
        turn: 1,
        currentPlayerId: body.playerId,
        currentPlayerName: body.playerName,
        phase: "capital-placement",
        population: { current: 0, cap: 0 },
        map: { columns: MAP_COLUMNS, rows: MAP_ROWS },
        players: [
          {
            id: body.playerId,
            name: body.playerName,
            color: PLAYER_COLORS[0],
            populationCap: 0,
            currentPopulation: 0,
            status: "playing",
            capitalCityId: null,
          },
        ],
        tiles: createEmptyTiles(),
        events: [],
      };

      await new Promise((resolve) => setTimeout(resolve, 400));

      return HttpResponse.json(lobbyState);
    }
  ),

  http.get(`${baseUrl}/lobbies/:lobbyId/state`, ({ params }) => {
    if (!lobbyState || params.lobbyId !== lobbyState.id) {
      return HttpResponse.json({ message: "Lobby not found" }, { status: 404 });
    }
    return HttpResponse.json(lobbyState);
  }),

  http.post(
    `${baseUrl}${apiConfig.endpoints.joinLobby}`,
    async ({ request }) => {
      const body = (await request.json()) as JoinLobbyPayload;

      if (!lobbyState || body.code.toUpperCase() !== lobbyState.code) {
        return HttpResponse.json(
          { message: "Lobby not found" },
          { status: 404 }
        );
      }

      const alreadyIn = lobbyState.players.some(
        (player) => player.id === body.playerId
      );
      if (!alreadyIn) {
        lobbyState = {
          ...lobbyState,
          players: [
            ...lobbyState.players,
            buildPlayer(
              { id: body.playerId, nickname: body.nickname },
              { isReady: false }
            ),
          ],
        };
        const game = gameStates[lobbyState.gameId];
        if (
          game &&
          !game.players.some((player) => player.id === body.playerId)
        ) {
          game.players.push({
            id: body.playerId,
            name: body.nickname,
            color: PLAYER_COLORS[game.players.length % PLAYER_COLORS.length],
            populationCap: 0,
            currentPopulation: 0,
            status: "playing",
            capitalCityId: null,
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      return HttpResponse.json(lobbyState);
    }
  ),

  http.patch(
    `${baseUrl}/lobbies/:lobbyId/ready`,
    async ({ params, request }) => {
      if (!lobbyState || params.lobbyId !== lobbyState.id) {
        return HttpResponse.json(
          { message: "Lobby not found" },
          { status: 404 }
        );
      }
      const body = (await request.json()) as {
        playerId: string;
        isReady: boolean;
      };
      lobbyState = {
        ...lobbyState,
        players: lobbyState.players.map((player) =>
          player.id === body.playerId
            ? { ...player, isReady: body.isReady }
            : player
        ),
      };
      return HttpResponse.json(lobbyState);
    }
  ),

  http.post(`${baseUrl}/lobbies/:lobbyId/start`, ({ params }) => {
    if (!lobbyState || params.lobbyId !== lobbyState.id) {
      return HttpResponse.json({ message: "Lobby not found" }, { status: 404 });
    }
    const allReady = lobbyState.players.every((player) => player.isReady);
    if (!allReady) {
      return HttpResponse.json(
        { message: "Players are not ready" },
        { status: 400 }
      );
    }
    lobbyState = { ...lobbyState, status: "in-progress" };
    return HttpResponse.json({ gameId: lobbyState.id });
  }),

  http.post(
    `${baseUrl}${apiConfig.endpoints.placeCapital(":gameId")}`,
    async ({ params, request }) => {
      const body = (await request.json()) as {
        playerId: string;
        tileId: string;
      };
      const state = params.gameId ? gameStates[params.gameId] : null;
      if (!state) {
        return HttpResponse.json(
          { message: "Game not found" },
          { status: 404 }
        );
      }
      if (state.phase !== "capital-placement") {
        return HttpResponse.json(
          { message: "Placement finished" },
          { status: 400 }
        );
      }
      const player = state.players.find((p) => p.id === body.playerId);
      if (!player) {
        return HttpResponse.json(
          { message: "Player not found" },
          { status: 404 }
        );
      }
      if (player.capitalCityId) {
        return HttpResponse.json(
          { message: "Capital already placed" },
          { status: 400 }
        );
      }
      const tile = state.tiles.find((t) => t.id === body.tileId);
      if (!tile) {
        return HttpResponse.json(
          { message: "Tile not found" },
          { status: 404 }
        );
      }
      if (
        tile.terrain === "Water" ||
        tile.terrain === "Mountains" ||
        tile.structure
      ) {
        return HttpResponse.json({ message: "Invalid tile" }, { status: 400 });
      }

      tile.structure = {
        id: `city-${tile.id}`,
        type: "City",
        ownerId: player.id,
        ownerName: player.name,
        population: 30,
        improvement: null,
        fortification: 80,
        production: null,
        isCapital: true,
      };
      tile.ownerId = player.id;
      player.capitalCityId = tile.structure.id;
      player.populationCap = Math.max(player.populationCap, 50);
      player.currentPopulation = 30;
      state.population = recalcPopulation(state.players);
      if (state.players.every((p) => p.capitalCityId)) {
        state.phase = "running";
      }
      return HttpResponse.json(state);
    }
  ),

  http.get(
    `${baseUrl}${apiConfig.endpoints.gameState(":gameId")}`,
    ({ params }) => {
      const state = params.gameId ? gameStates[params.gameId] : null;
      if (!state) {
        return HttpResponse.json(
          { message: "Game not found" },
          { status: 404 }
        );
      }
      return HttpResponse.json(state);
    }
  ),
];
