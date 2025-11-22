import type { Lobby } from "../../domain/lobby/lobby.types";
import type { GameState } from "../../domain/game/game-state";

export class MemoryStore {
  private lobbies = new Map<string, Lobby>();
  private lobbiesByCode = new Map<string, Lobby>();
  private games = new Map<string, GameState>();

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

  saveGame(game: GameState) {
    this.games.set(game.id, game);
    return game;
  }

  getGame(id: string): GameState | null {
    return this.games.get(id) ?? null;
  }

  clear() {
    this.lobbies.clear();
    this.lobbiesByCode.clear();
    this.games.clear();
  }
}

export const memoryStore = new MemoryStore();
