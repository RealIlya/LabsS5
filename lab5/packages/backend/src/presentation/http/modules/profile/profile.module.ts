import { Module } from "@nestjs/common";
import { ProfileService } from "../../../../application/profile/profile.service";
import { StoreModule } from "../../../../infrastructure/store/store.module";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [StoreModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
