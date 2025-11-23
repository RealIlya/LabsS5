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
import { UpsertProfileDto } from "./dto/upsert-profile.dto";

@Controller("/api/profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findAll() {
    return this.profileService.listProfiles();
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  upsert(@Body() dto: UpsertProfileDto) {
    return this.profileService.upsertProfile(dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.profileService.getProfile(id);
  }
}
