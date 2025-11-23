import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { StorePort } from "../../infrastructure/store/store.port";
import type { Profile } from "../../domain/profile/profile.types";

export interface UpsertProfilePayload {
  id?: string;
  nickname: string;
  password: string;
}

@Injectable()
export class ProfileService {
  constructor(@Inject("StorePort") private readonly memoryStore: StorePort) {}

  upsertProfile(payload: UpsertProfilePayload): Profile {
    if (payload.id) {
      const existing = this.memoryStore.getProfile(payload.id);
      if (existing) {
        if (existing.password !== payload.password) {
          throw new UnauthorizedException("Invalid credentials");
        }
        const updated: Profile = { ...existing, nickname: payload.nickname };
        this.memoryStore.saveProfile(updated);
        return updated;
      }
    }

    // Prevent duplicate nicknames with different IDs
    const nicknameTaken = this.memoryStore.findProfileByNickname(
      payload.nickname
    );
    if (nicknameTaken && nicknameTaken.password !== payload.password) {
      throw new UnauthorizedException("Nickname already in use");
    }

    const profile: Profile = {
      id: payload.id ?? randomUUID(),
      nickname: payload.nickname,
      password: payload.password,
    };
    this.memoryStore.saveProfile(profile);
    return profile;
  }

  getProfile(id: string): Profile | null {
    return this.memoryStore.getProfile(id);
  }

  listProfiles(): Profile[] {
    return this.memoryStore.getAllProfiles();
  }
}
