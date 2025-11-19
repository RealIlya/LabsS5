import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "../../../../application/game/game.service";

@Module({
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
