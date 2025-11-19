import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { LobbyService } from "../../../../application/lobby/lobby.service";
import { CreateLobbyDto } from "./dto/create-lobby.dto";
import { JoinLobbyDto } from "./dto/join-lobby.dto";
import { ToggleReadyDto } from "./dto/toggle-ready.dto";

@Controller("lobbies")
export class LobbyController {
  constructor(private readonly lobbyService: LobbyService) {}

  @Get(":id")
  findOne(@Param("id") lobbyId: string) {
    return this.lobbyService.getLobbyById(lobbyId);
  }

  @Post()
  create(@Body() dto: CreateLobbyDto) {
    return this.lobbyService.createLobby(dto.hostId, dto.nickname);
  }

  @Post("join")
  join(@Body() dto: JoinLobbyDto) {
    return this.lobbyService.joinLobby(dto.code, dto.playerId, dto.nickname);
  }

  @Patch(":id/ready")
  toggleReady(
    @Param("id") lobbyId: string,
    @Body() dto: ToggleReadyDto
  ) {
    return this.lobbyService.toggleReady(lobbyId, dto.playerId, dto.isReady);
  }

  @Post(":id/start")
  start(@Param("id") lobbyId: string) {
    return this.lobbyService.startLobby(lobbyId);
  }
}
