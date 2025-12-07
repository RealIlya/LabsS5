import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GameService } from "../../../../application/game/game.service";
import { PlaceCapitalDto } from "./dto/place-capital.dto";
import { SubmitActionDto } from "./dto/submit-action.dto";
import { GameGateway } from "../../../ws/game.gateway";

@Controller("api/games")
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway
  ) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gameService.getGame(id);
  }

  @Post(":id/place-capital")
  placeCapital(@Param("id") id: string, @Body() dto: PlaceCapitalDto) {
    const game = this.gameService.placeCapital(id, dto.playerId, dto.tileId);
    this.gameGateway.broadcastGameUpdate(id);
    return game;
  }

  @Post(":id/actions")
  submitAction(@Param("id") id: string, @Body() dto: SubmitActionDto) {
    const game = this.gameService.applyAction(id, dto.playerId, dto.action);
    this.gameGateway.broadcastGameUpdate(id);
    return game;
  }
}
