import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { LobbyService } from "../../../../application/lobby/lobby.service";
import { LobbyGateway } from "../../../ws/lobby.gateway";
import { CreateLobbyDto } from "./dto/create-lobby.dto";
import { JoinLobbyDto } from "./dto/join-lobby.dto";
import { LeaveLobbyDto } from "./dto/leave-lobby.dto";
import { ToggleReadyDto } from "./dto/toggle-ready.dto";

@Controller("api/lobbies")
export class LobbyController {
  constructor(
    private readonly lobbyService: LobbyService,
    private readonly lobbyGateway: LobbyGateway
  ) {}

  @Get()
  list() {
    return this.lobbyService.listLobbies();
  }

  @Get(":id/state")
  state(@Param("id") lobbyId: string) {
    return this.lobbyService.getLobbyState(lobbyId);
  }

  @Get(":id")
  findOne(@Param("id") lobbyId: string) {
    return this.lobbyService.getLobbyState(lobbyId);
  }

  @Post()
  async create(@Body() dto: CreateLobbyDto) {
    const hostId = dto.hostId ?? dto.playerId;
    if (!hostId) {
      throw new BadRequestException("hostId is required");
    }
    const nickname = dto.nickname ?? dto.playerName;
    if (!nickname) {
      throw new BadRequestException("nickname is required");
    }
    const lobby = await this.lobbyService.createLobby(
      hostId,
      nickname,
      dto.name,
      dto.maxPlayers
    );
    await this.lobbyGateway.emitLobbyState(lobby.id);
    return this.lobbyService.getLobbyState(lobby.id);
  }

  @Post("join")
  async join(@Body() dto: JoinLobbyDto) {
    const lobby = await this.lobbyService.joinLobby(
      dto.code,
      dto.playerId,
      dto.nickname
    );
    await this.lobbyGateway.emitLobbyState(lobby.id);
    return this.lobbyService.getLobbyState(lobby.id);
  }

  @Patch(":id/ready")
  async toggleReady(@Param("id") lobbyId: string, @Body() dto: ToggleReadyDto) {
    const lobby = await this.lobbyService.toggleReady(
      lobbyId,
      dto.playerId,
      dto.isReady
    );
    await this.lobbyGateway.emitLobbyState(lobby.id);
    return this.lobbyService.getLobbyState(lobby.id);
  }

  @Post(":id/start")
  async start(@Param("id") lobbyId: string) {
    const { gameId } = await this.lobbyService.startLobby(lobbyId);
    await this.lobbyGateway.emitLobbyState(lobbyId);
    this.lobbyGateway.emitGameStarted(lobbyId, gameId);
    return { gameId };
  }

  @Delete(":id/players")
  async leave(@Param("id") lobbyId: string, @Body() dto: LeaveLobbyDto) {
    const lobby = await this.lobbyService.leaveLobby(lobbyId, dto.playerId);
    if (lobby) {
      await this.lobbyGateway.emitLobbyState(lobby.id);
      return this.lobbyService.getLobbyState(lobby.id);
    }
    this.lobbyGateway.emitLobbyRemoved(lobbyId);
    return { removed: true };
  }
}
