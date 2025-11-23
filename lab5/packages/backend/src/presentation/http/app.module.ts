import { Module } from "@nestjs/common";
import { StatusController } from "./controllers/status.controller";
import { StatusService } from "../../application/status/status.service";
import { LobbyModule } from "./modules/lobby/lobby.module";
import { GameModule } from "./modules/game/game.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { StoreModule } from "../../infrastructure/store/store.module";

@Module({
  imports: [StoreModule, LobbyModule, GameModule, ProfileModule],
  controllers: [StatusController],
  providers: [StatusService],
})
export class AppModule {}
