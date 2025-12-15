import { Module } from "@nestjs/common";
import { LobbyService } from "../../../../application/lobby/lobby.service";
import { StoreModule } from "../../../../infrastructure/store/store.module";
import { LobbyGateway } from "../../../ws/lobby.gateway";
import { GameModule } from "../game/game.module";
import { LobbyController } from "./lobby.controller";

@Module({
  imports: [StoreModule, GameModule],
  controllers: [LobbyController],
  providers: [LobbyService, LobbyGateway],
})
export class LobbyModule {}
