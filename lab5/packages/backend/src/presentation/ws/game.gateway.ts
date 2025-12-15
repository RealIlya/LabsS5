import type { PlayerAction } from "@hex/shared";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { GameService } from "../../application/game/game.service";

interface GameJoinPayload {
  gameId: string;
}

interface SubmitActionPayload {
  gameId: string;
  playerId: string;
  action: PlayerAction;
}

@WebSocketGateway({
  namespace: "ws/game",
  cors: { origin: true, credentials: true },
})
export class GameGateway {
  @WebSocketServer()
  private server!: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage("game:join")
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GameJoinPayload
  ) {
    try {
      const game = this.gameService.getGame(payload.gameId);
      client.join(payload.gameId);
      client.emit("game:update", game);
    } catch (error: any) {
      client.emit("game:error", { message: error.message ?? "Unable to join" });
    }
  }

  @SubscribeMessage("game:submit_action")
  handleAction(@MessageBody() payload: SubmitActionPayload) {
    try {
      const game = this.gameService.applyAction(
        payload.gameId,
        payload.playerId,
        payload.action
      );
      this.server.to(payload.gameId).emit("game:update", game);
    } catch (error: any) {
      this.server
        .to(payload.gameId)
        .emit("game:error", { message: error.message ?? "Action failed" });
    }
  }

  broadcastGameUpdate(gameId: string) {
    const game = this.gameService.getGame(gameId);
    this.server.to(gameId).emit("game:update", game);
  }
}
