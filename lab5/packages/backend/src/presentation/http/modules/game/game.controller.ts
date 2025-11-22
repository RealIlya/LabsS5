import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GameService } from "../../../../application/game/game.service";
import { PlaceCapitalDto } from "./dto/place-capital.dto";
import { SubmitActionDto } from "./dto/submit-action.dto";

@Controller("api/games")
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.gameService.getGame(id);
  }

  @Post(":id/place-capital")
  placeCapital(@Param("id") id: string, @Body() dto: PlaceCapitalDto) {
    return this.gameService.placeCapital(id, dto.playerId, dto.tileId);
  }

  @Post(":id/actions")
  submitAction(@Param("id") id: string, @Body() dto: SubmitActionDto) {
    return this.gameService.applyAction(id, dto.playerId, dto.action);
  }
}
