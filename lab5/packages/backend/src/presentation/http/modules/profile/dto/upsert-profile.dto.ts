import { IsOptional, IsString, MinLength } from "class-validator";

export class UpsertProfileDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  nickname!: string;

  @IsString()
  @MinLength(4)
  password!: string;
}
