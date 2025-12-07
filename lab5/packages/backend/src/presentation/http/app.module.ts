import { Module } from "@nestjs/common";
import { join } from "node:path";
import { ServeStaticModule } from "@nestjs/serve-static";
import { StatusController } from "./controllers/status.controller";
import { StatusService } from "../../application/status/status.service";
import { LobbyModule } from "./modules/lobby/lobby.module";
import { GameModule } from "./modules/game/game.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { StoreModule } from "../../infrastructure/store/store.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "..", "..", "frontend", "dist"),
      exclude: ["/socket.io*", "/api*", "/status*"],
    }),
    StoreModule,
    LobbyModule,
    GameModule,
    ProfileModule,
  ],
  controllers: [StatusController],
  providers: [StatusService],
})
export class AppModule {}
