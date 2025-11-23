import { IsString } from "class-validator";

export class LeaveLobbyDto {
  @IsString()
  playerId!: string;
}
