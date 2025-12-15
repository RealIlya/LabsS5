import { existsSync } from "node:fs";
import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { StatusService } from "../../application/status/status.service";
import { StoreModule } from "../../infrastructure/store/store.module";
import { StatusController } from "./controllers/status.controller";
import { GameModule } from "./modules/game/game.module";
import { LobbyModule } from "./modules/lobby/lobby.module";
import { ProfileModule } from "./modules/profile/profile.module";

const frontendDistPath = join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "frontend",
  "dist"
);
const hasFrontendBuild = existsSync(join(frontendDistPath, "index.html"));

@Module({
  imports: [
    ...(hasFrontendBuild
      ? [
          ServeStaticModule.forRoot({
            rootPath: frontendDistPath,
            exclude: ["/socket.io*", "/api*"],
          }),
        ]
      : []),
    StoreModule,
    LobbyModule,
    GameModule,
    ProfileModule,
  ],
  controllers: [StatusController],
  providers: [StatusService],
})
export class AppModule {}
