import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "../../../../application/game/game.service";
import { MapService } from "../../../../application/game/map.service";
import { GameGateway } from "../../../ws/game.gateway";

@Module({
  controllers: [GameController],
  providers: [GameService, MapService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
