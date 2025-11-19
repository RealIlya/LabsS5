import { IsString } from "class-validator";

export class PlaceCapitalDto {
  @IsString()
  playerId!: string;

  @IsString()
  tileId!: string;
}
