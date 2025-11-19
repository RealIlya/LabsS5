import { IsString, Length } from "class-validator";

export class JoinLobbyDto {
  @IsString()
  @Length(4, 12)
  code!: string;

  @IsString()
  @Length(2, 32)
  nickname!: string;

  @IsString()
  playerId!: string;
}
