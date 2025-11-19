import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { GameService } from "../../../../application/game/game.service";
import { PlaceCapitalDto } from "./dto/place-capital.dto";

@Controller("games")
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
}
