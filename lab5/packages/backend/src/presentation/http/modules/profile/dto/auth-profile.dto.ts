import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class AuthProfileDto {
  @IsString()
  @MinLength(2, { message: "Никнейм должен быть не короче 2 символов" })
  nickname!: string;

  @IsString()
  @MinLength(4, { message: "Пароль должен быть не короче 4 символов" })
  password!: string;

  @IsOptional()
  @IsBoolean()
  register?: boolean;
}
