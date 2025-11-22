import { IsObject, IsString } from "class-validator";
import type { PlayerAction } from "@hex/shared";

export class SubmitActionDto {
  @IsString()
  playerId!: string;

  @IsObject()
  action!: PlayerAction;
}
