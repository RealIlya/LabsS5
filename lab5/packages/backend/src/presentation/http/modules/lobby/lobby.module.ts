import { Module } from "@nestjs/common";
import { GameModule } from "../game/game.module";
import { LobbyController } from "./lobby.controller";
import { LobbyService } from "../../../../application/lobby/lobby.service";

@Module({
  imports: [GameModule],
  controllers: [LobbyController],
  providers: [LobbyService],
})
export class LobbyModule {}
