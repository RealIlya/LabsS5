import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ProfileService } from "../../../../application/profile/profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthProfileDto } from "./dto/auth-profile.dto";
import type { Profile } from "../../../../domain/profile/profile.types";

const toSafeProfile = (profile: Profile | null) =>
  profile ? { id: profile.id, nickname: profile.nickname } : null;

@Controller("/api/profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findAll() {
    return this.profileService
      .listProfiles()
      .map((profile) => toSafeProfile(profile));
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Body() dto: UpdateProfileDto) {
    return toSafeProfile(this.profileService.upsertProfile(dto));
  }

  @Post("auth")
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  authenticate(@Body() dto: AuthProfileDto) {
    const profile = this.profileService.authenticate(dto);
    return toSafeProfile(profile);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return toSafeProfile(this.profileService.getProfile(id));
  }
}
