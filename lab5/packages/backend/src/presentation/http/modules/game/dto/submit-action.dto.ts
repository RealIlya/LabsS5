import type { PlayerAction } from "@hex/shared";
import { IsObject, IsString } from "class-validator";

export class SubmitActionDto {
  @IsString()
  playerId!: string;

  @IsObject()
  action!: PlayerAction;
}
