import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Lobby, LobbyPlayer } from "../../domain/lobby/lobby.types";
import { memoryStore } from "../../infrastructure/store/memory-store";
import { GameService } from "../game/game.service";

const PLAYER_RANKS = [
  "Hex HQ",
  "Shield Ops",
  "Nova Guard",
  "Frontier Corps",
  "Aegis Team",
];

@Injectable()
export class LobbyService {
  constructor(private readonly gameService: GameService) {}

  async createLobby(hostId: string, nickname: string): Promise<Lobby> {
    const lobbyId = randomUUID();
    const code = lobbyId.slice(-4).toUpperCase();
    const gameId = randomUUID();
    const host = this.buildPlayer(hostId, nickname, true);

    const lobby: Lobby = {
      id: lobbyId,
      code,
      hostId,
      status: "waiting",
      gameId,
      players: [host],
    };

    memoryStore.saveLobby(lobby);
    return lobby;
  }

  async joinLobby(code: string, playerId: string, nickname: string) {
    const lobby = this.getLobbyByCodeOrThrow(code);
    if (lobby.status !== "waiting") {
      throw new BadRequestException("Lobby already started");
    }

    const alreadyIn = lobby.players.some((p) => p.id === playerId);
    if (!alreadyIn) {
      lobby.players.push(this.buildPlayer(playerId, nickname, false));
      memoryStore.saveLobby(lobby);
    }
    return lobby;
  }

  async toggleReady(lobbyId: string, playerId: string, isReady: boolean) {
    const lobby = this.getLobbyOrThrow(lobbyId);
    if (lobby.status !== "waiting") {
      throw new BadRequestException("Lobby already started");
    }

    const exists = lobby.players.some((player) => player.id === playerId);
    if (!exists) {
      throw new BadRequestException("Player not found in lobby");
    }

    lobby.players = lobby.players.map((player) =>
      player.id === playerId ? { ...player, isReady } : player
    );
    memoryStore.saveLobby(lobby);
    return lobby;
  }

  async startLobby(lobbyId: string) {
    const lobby = this.getLobbyOrThrow(lobbyId);
    if (lobby.status !== "waiting") {
      throw new BadRequestException("Lobby already started");
    }
    const allReady = lobby.players.every((player) => player.isReady);
    if (!allReady) {
      throw new BadRequestException("Players are not ready");
    }
    const gameState = this.gameService.createGameForLobby(lobby);
    lobby.status = "in-progress";
    memoryStore.saveLobby(lobby);
    return { gameId: gameState.id };
  }

  getLobbyById(lobbyId: string) {
    return this.getLobbyOrThrow(lobbyId);
  }

  private buildPlayer(id: string, nickname: string, isHost: boolean): LobbyPlayer {
    return {
      id,
      nickname,
      isHost,
      isReady: false,
      rank: PLAYER_RANKS[this.rankIndex(id)],
    };
  }

  private rankIndex(seed: string) {
    const hash = seed
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % PLAYER_RANKS.length;
  }

  private getLobbyOrThrow(lobbyId: string): Lobby {
    const lobby = memoryStore.getLobby(lobbyId);
    if (!lobby) {
      throw new NotFoundException("Lobby not found");
    }
    return lobby;
  }

  private getLobbyByCodeOrThrow(code: string): Lobby {
    const lobby = memoryStore.getLobbyByCode(code);
    if (!lobby) {
      throw new NotFoundException("Lobby not found");
    }
    return lobby;
  }
}
