import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Injectable, Logger } from "@nestjs/common";
import type { GameState } from "../../domain/game/game-state";
import type { Lobby } from "../../domain/lobby/lobby.types";
import type { Profile } from "../../domain/profile/profile.types";
import type { StorePort } from "./store.port";

interface StoreSnapshot {
  lobbies: Record<string, Lobby>;
  games: Record<string, GameState>;
  profiles: Record<string, Profile>;
}

@Injectable()
export class FileStore implements StorePort {
  private readonly dataDir = join(__dirname, "..", "..", "..", "data");
  private readonly storePath = join(this.dataDir, "store.json");
  private readonly logger = new Logger(FileStore.name);
  private snapshot: StoreSnapshot = { lobbies: {}, games: {}, profiles: {} };

  constructor() {
    this.ensureDataDir();
    this.loadSnapshot();
  }

  saveLobby(lobby: Lobby) {
    this.snapshot.lobbies[lobby.id] = lobby;
    this.persist();
    return lobby;
  }

  getLobby(id: string): Lobby | null {
    return this.snapshot.lobbies[id] ?? null;
  }

  getLobbyByCode(code: string): Lobby | null {
    const codeUpper = code.toUpperCase();
    return (
      Object.values(this.snapshot.lobbies).find(
        (lobby) => lobby.code.toUpperCase() === codeUpper
      ) ?? null
    );
  }

  getAllLobbies(): Lobby[] {
    return Object.values(this.snapshot.lobbies);
  }

  removeLobby(id: string): void {
    delete this.snapshot.lobbies[id];
    this.persist();
  }

  saveGame(game: GameState) {
    this.snapshot.games[game.id] = game;
    this.persist();
    return game;
  }

  getGame(id: string): GameState | null {
    return this.snapshot.games[id] ?? null;
  }

  getAllGames(): GameState[] {
    return Object.values(this.snapshot.games);
  }

  saveProfile(profile: Profile) {
    this.snapshot.profiles[profile.id] = profile;
    this.persist();
    return profile;
  }

  getProfile(id: string): Profile | null {
    return this.snapshot.profiles[id] ?? null;
  }

  findProfileByNickname(nickname: string): Profile | null {
    const normalized = nickname.toLowerCase();
    return (
      Object.values(this.snapshot.profiles).find(
        (profile) => profile.nickname.toLowerCase() === normalized
      ) ?? null
    );
  }

  getAllProfiles(): Profile[] {
    return Object.values(this.snapshot.profiles);
  }

  clear(): void {
    this.snapshot = { lobbies: {}, games: {}, profiles: {} };
    this.persist();
  }

  private ensureDataDir() {
    mkdirSync(this.dataDir, { recursive: true });
  }

  private loadSnapshot() {
    if (!existsSync(this.storePath)) {
      this.persist();
      return;
    }

    try {
      const raw = readFileSync(this.storePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
      this.snapshot = {
        lobbies: parsed.lobbies ?? {},
        games: parsed.games ?? {},
        profiles: parsed.profiles ?? {},
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        "Failed to read store snapshot, starting fresh",
        err?.stack
      );
      this.snapshot = { lobbies: {}, games: {}, profiles: {} };
      this.persist();
    }
  }

  private persist() {
    const payload = JSON.stringify(this.snapshot, null, 2);
    writeFileSync(this.storePath, payload, "utf-8");
  }
}
