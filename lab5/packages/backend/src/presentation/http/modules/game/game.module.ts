import { Module } from "@nestjs/common";
import { GameService } from "../../../../application/game/game.service";
import { MapService } from "../../../../application/game/map.service";
import { TurnTimerService } from "../../../../application/game/turn-timer.service";
import { StoreModule } from "../../../../infrastructure/store/store.module";
import { GameGateway } from "../../../ws/game.gateway";
import { GameController } from "./game.controller";

@Module({
  imports: [StoreModule],
  controllers: [GameController],
  providers: [GameService, MapService, GameGateway, TurnTimerService],
  exports: [GameService],
})
export class GameModule {}
