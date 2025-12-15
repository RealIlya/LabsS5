import { randomUUID } from "crypto";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Profile } from "../../domain/profile/profile.types";
import type { StorePort } from "../../infrastructure/store/store.port";

export interface UpsertProfilePayload {
  id?: string;
  nickname: string;
  password: string;
}

export interface AuthProfilePayload {
  nickname: string;
  password: string;
  register?: boolean;
}

@Injectable()
export class ProfileService {
  constructor(@Inject("StorePort") private readonly memoryStore: StorePort) {}

  authenticate(payload: AuthProfilePayload): Profile {
    const nickname = payload.nickname.trim();
    const password = payload.password;
    const isRegister = payload.register ?? false;

    if (!nickname) {
      throw new BadRequestException("Никнейм обязателен");
    }
    if (!password) {
      throw new BadRequestException("Пароль обязателен");
    }

    const existingByNickname = this.memoryStore.findProfileByNickname(nickname);

    if (isRegister) {
      if (existingByNickname) {
        throw new BadRequestException(
          "Пользователь с таким никнеймом уже существует"
        );
      }
      const profile: Profile = {
        id: randomUUID(),
        nickname,
        password,
      };
      this.memoryStore.saveProfile(profile);
      return profile;
    }

    if (!existingByNickname) {
      throw new NotFoundException("Пользователь не найден");
    }

    if (existingByNickname.password !== password) {
      throw new UnauthorizedException("Неверный пароль");
    }

    return existingByNickname;
  }

  upsertProfile(payload: UpsertProfilePayload): Profile {
    if (payload.id) {
      const existing = this.memoryStore.getProfile(payload.id);
      if (existing) {
        if (existing.password !== payload.password) {
          throw new UnauthorizedException("Неверные учетные данные");
        }
        const updated: Profile = { ...existing, nickname: payload.nickname };
        this.memoryStore.saveProfile(updated);
        return updated;
      }
    }

    const nicknameTaken = this.memoryStore.findProfileByNickname(
      payload.nickname
    );
    if (nicknameTaken && nicknameTaken.password !== payload.password) {
      throw new UnauthorizedException("Никнейм уже используется");
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
