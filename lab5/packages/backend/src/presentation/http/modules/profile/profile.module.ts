import { Module } from "@nestjs/common";
import { ProfileService } from "../../../../application/profile/profile.service";
import { ProfileController } from "./profile.controller";
import { StoreModule } from "../../../../infrastructure/store/store.module";

@Module({
  imports: [StoreModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
