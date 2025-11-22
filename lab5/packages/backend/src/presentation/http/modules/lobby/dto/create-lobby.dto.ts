import { IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";

export class CreateLobbyDto {
  @IsOptional()
  @IsString()
  hostId?: string;

  @IsOptional()
  @IsString()
  playerId?: string;

  @IsString()
  @Length(2, 32)
  nickname!: string;

  @IsOptional()
  @IsString()
  @Length(2, 32)
  playerName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 48)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(16)
  maxPlayers?: number;
}
