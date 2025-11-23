import { Module } from "@nestjs/common";
import { GameModule } from "../game/game.module";
import { LobbyController } from "./lobby.controller";
import { LobbyService } from "../../../../application/lobby/lobby.service";
import { LobbyGateway } from "../../../ws/lobby.gateway";
import { StoreModule } from "../../../../infrastructure/store/store.module";

@Module({
  imports: [StoreModule, GameModule],
  controllers: [LobbyController],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
