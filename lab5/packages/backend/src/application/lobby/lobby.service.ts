import { randomUUID } from "crypto";
import type { LobbyPlayerState, LobbyState, LobbySummary } from "@hex/shared";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Lobby, LobbyPlayer } from "../../domain/lobby/lobby.types";
import type { StorePort } from "../../infrastructure/store/store.port";
import { GameService } from "../game/game.service";

const DEFAULT_MAX_PLAYERS = 4;

@Injectable()
export class LobbyService {
  constructor(
    private readonly gameService: GameService,
    @Inject("StorePort") private readonly memoryStore: StorePort
  ) {}

  async createLobby(
    hostId: string,
    nickname: string,
    lobbyName?: string,
    maxPlayers = DEFAULT_MAX_PLAYERS
  ): Promise<Lobby> {
    const lobbyId = randomUUID();
    const code = lobbyId.slice(-4).toUpperCase();
    const gameId = randomUUID();
    const host = this.buildPlayer(hostId, nickname, true);

    const lobby: Lobby = {
      id: lobbyId,
      name: lobbyName?.trim() || `${nickname}'s Lobby`,
      code,
      hostId,
      status: "waiting",
      gameId,
      maxPlayers,
      players: [host],
    };

    this.memoryStore.saveLobby(lobby);
    return lobby;
  }

  listLobbies(): LobbySummary[] {
    return this.memoryStore
      .getAllLobbies()
      .map((lobby) => this.toLobbySummary(lobby));
  }

  async joinLobby(code: string, playerId: string, nickname: string) {
    const lobby = this.getLobbyByCodeOrThrow(code);
    if (lobby.status !== "waiting") {
      throw new BadRequestException("Lobby already started");
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      throw new BadRequestException("Lobby is full");
    }

    const alreadyIn = lobby.players.some((p) => p.id === playerId);
    if (!alreadyIn) {
      lobby.players.push(this.buildPlayer(playerId, nickname, false));
      this.memoryStore.saveLobby(lobby);
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
    this.memoryStore.saveLobby(lobby);
    return lobby;
  }

  async leaveLobby(lobbyId: string, playerId: string) {
    const lobby = this.getLobbyOrThrow(lobbyId);
    if (lobby.status !== "waiting") {
      throw new BadRequestException("Lobby already started");
    }

    const before = lobby.players.length;
    lobby.players = lobby.players.filter((p) => p.id !== playerId);
    if (before === lobby.players.length) {
      throw new BadRequestException("Player not found in lobby");
    }

    if (lobby.players.length === 0) {
      this.memoryStore.removeLobby(lobby.id);
      return null;
    }

    if (!lobby.players.some((p) => p.id === lobby.hostId)) {
      lobby.hostId = lobby.players[0].id;
    }

    this.memoryStore.saveLobby(lobby);
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
    this.memoryStore.saveLobby(lobby);
    return { gameId: gameState.id };
  }

  getLobbyState(lobbyId: string): LobbyState {
    const lobby = this.getLobbyOrThrow(lobbyId);
    return this.toLobbyState(lobby);
  }

  private buildPlayer(
    id: string,
    nickname: string,
    isHost: boolean
  ): LobbyPlayer {
    return {
      id,
      nickname,
      isHost,
      isReady: false,
    };
  }

  private getLobbyOrThrow(lobbyId: string): Lobby {
    const lobby = this.memoryStore.getLobby(lobbyId);
    if (!lobby) {
      throw new NotFoundException("Lobby not found");
    }
    return lobby;
  }

  private getLobbyByCodeOrThrow(code: string): Lobby {
    const lobby = this.memoryStore.getLobbyByCode(code);
    if (!lobby) {
      throw new NotFoundException("Lobby not found");
    }
    return lobby;
  }

  private toLobbySummary(lobby: Lobby): LobbySummary {
    return {
      id: lobby.id,
      name: lobby.name,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
    };
  }

  private toLobbyState(lobby: Lobby): LobbyState {
    return {
      id: lobby.id,
      name: lobby.name,
      code: lobby.code,
      status: lobby.status,
      hostId: lobby.hostId,
      gameId: lobby.gameId,
      maxPlayers: lobby.maxPlayers,
      players: lobby.players.map((player) => this.toLobbyPlayerState(player)),
    };
  }

  private toLobbyPlayerState(player: LobbyPlayer): LobbyPlayerState {
    return {
      id: player.id,
      name: player.nickname,
      isReady: player.isReady,
    };
  }
}
