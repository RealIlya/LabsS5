import { Module } from "@nestjs/common";
import { GameModule } from "../game/game.module";
import { LobbyController } from "./lobby.controller";
import { LobbyService } from "../../../../application/lobby/lobby.service";
import { LobbyGateway } from "../../../ws/lobby.gateway";

@Module({
  imports: [GameModule],
  controllers: [LobbyController],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
