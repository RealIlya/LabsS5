import { Module } from "@nestjs/common";
import { StatusController } from "./controllers/status.controller";
import { StatusService } from "../../application/status/status.service";
import { LobbyModule } from "./modules/lobby/lobby.module";
import { GameModule } from "./modules/game/game.module";

@Module({
  imports: [LobbyModule, GameModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class AppModule {}
