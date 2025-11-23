import { Injectable } from "@nestjs/common";
import type { Lobby } from "../../domain/lobby/lobby.types";
import type { GameState } from "../../domain/game/game-state";
import type { Profile } from "../../domain/profile/profile.types";
import type { StorePort } from "./store.port";

@Injectable()
export class MemoryStore implements StorePort {
  private lobbies = new Map<string, Lobby>();
  private lobbiesByCode = new Map<string, Lobby>();
  private games = new Map<string, GameState>();
  private profiles = new Map<string, Profile>();

  saveLobby(lobby: Lobby) {
    this.lobbies.set(lobby.id, lobby);
    this.lobbiesByCode.set(lobby.code.toUpperCase(), lobby);
    return lobby;
  }

  getLobby(id: string) {
    return this.lobbies.get(id) ?? null;
  }

  getLobbyByCode(code: string) {
    return this.lobbiesByCode.get(code.toUpperCase()) ?? null;
  }

  getAllLobbies() {
    return Array.from(this.lobbies.values());
  }

  removeLobby(id: string) {
    const lobby = this.lobbies.get(id);
    if (lobby) {
      this.lobbiesByCode.delete(lobby.code.toUpperCase());
    }
    this.lobbies.delete(id);
  }

  saveGame(game: GameState) {
    this.games.set(game.id, game);
    return game;
  }

  getGame(id: string): GameState | null {
    return this.games.get(id) ?? null;
  }

  saveProfile(profile: Profile) {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  getProfile(id: string): Profile | null {
    return this.profiles.get(id) ?? null;
  }

  findProfileByNickname(nickname: string): Profile | null {
    return (
      Array.from(this.profiles.values()).find(
        (p) => p.nickname.toLowerCase() === nickname.toLowerCase()
      ) ?? null
    );
  }

  getAllProfiles(): Profile[] {
    return Array.from(this.profiles.values());
  }

  clear() {
    this.lobbies.clear();
    this.lobbiesByCode.clear();
    this.games.clear();
    this.profiles.clear();
  }
}
