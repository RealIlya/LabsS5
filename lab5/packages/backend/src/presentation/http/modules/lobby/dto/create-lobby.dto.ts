import { IsString, Length } from "class-validator";

export class CreateLobbyDto {
  @IsString()
  hostId!: string;

  @IsString()
  @Length(2, 32)
  nickname!: string;
}
