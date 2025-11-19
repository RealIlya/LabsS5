import { IsBoolean, IsString } from "class-validator";

export class ToggleReadyDto {
  @IsString()
  playerId!: string;

  @IsBoolean()
  isReady!: boolean;
}
