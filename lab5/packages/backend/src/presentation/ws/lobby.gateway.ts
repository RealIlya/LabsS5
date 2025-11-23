import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { LobbyService } from "../../application/lobby/lobby.service";
import { Logger } from "@nestjs/common";

interface LobbyJoinPayload {
  lobbyId: string;
}

interface LobbyReadyPayload {
  lobbyId: string;
  playerId: string;
  isReady: boolean;
}

interface LobbyStartPayload {
  lobbyId: string;
}

@WebSocketGateway({
  namespace: "lobby",
  cors: { origin: true, credentials: true },
})
export class LobbyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(LobbyGateway.name);

  constructor(private readonly lobbyService: LobbyService) {}

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("lobby:join")
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LobbyJoinPayload
  ) {
    try {
      const state = this.lobbyService.getLobbyState(payload.lobbyId);
      client.join(payload.lobbyId);
      client.emit("lobby:update", state);
    } catch (error: any) {
      client.emit("lobby:error", { message: error.message ?? "Join failed" });
    }
  }

  @SubscribeMessage("lobby:set_ready")
  async handleSetReady(@MessageBody() payload: LobbyReadyPayload) {
    try {
      await this.lobbyService.toggleReady(
        payload.lobbyId,
        payload.playerId,
        payload.isReady
      );
      await this.emitLobbyState(payload.lobbyId);
    } catch (error: any) {
      this.emitError(payload.lobbyId, error.message ?? "Ready toggle failed");
    }
  }

  @SubscribeMessage("lobby:start_game")
  async handleStart(@MessageBody() payload: LobbyStartPayload) {
    try {
      const response = await this.lobbyService.startLobby(payload.lobbyId);
      this.server.to(payload.lobbyId).emit("lobby:game_started", response);
      await this.emitLobbyState(payload.lobbyId);
    } catch (error: any) {
      this.emitError(payload.lobbyId, error.message ?? "Unable to start game");
    }
  }

  async emitLobbyState(lobbyId: string) {
    const state = this.lobbyService.getLobbyState(lobbyId);
    this.server.to(lobbyId).emit("lobby:update", state);
  }

  emitGameStarted(lobbyId: string, gameId: string) {
    this.server.to(lobbyId).emit("lobby:game_started", { gameId });
  }

  emitError(lobbyId: string, message: string) {
    this.server.to(lobbyId).emit("lobby:error", { message });
  }

  emitLobbyRemoved(lobbyId: string) {
    this.server.to(lobbyId).emit("lobby:removed", { lobbyId });
  }
}
