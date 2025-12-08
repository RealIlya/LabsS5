import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2, { message: "Никнейм должен быть не короче 2 символов" })
  nickname!: string;

  @IsString()
  @MinLength(4, { message: "Пароль должен быть не короче 4 символов" })
  password!: string;
}
