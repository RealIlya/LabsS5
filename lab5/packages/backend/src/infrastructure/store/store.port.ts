import type { Lobby } from "../../domain/lobby/lobby.types";
import type { GameState } from "../../domain/game/game-state";
import type { Profile } from "../../domain/profile/profile.types";

export interface StorePort {
  saveLobby(lobby: Lobby): Lobby;
  getLobby(id: string): Lobby | null;
  getLobbyByCode(code: string): Lobby | null;
  getAllLobbies(): Lobby[];
  removeLobby(id: string): void;

  saveGame(game: GameState): GameState;
  getGame(id: string): GameState | null;
  getAllGames(): GameState[];

  saveProfile(profile: Profile): Profile;
  getProfile(id: string): Profile | null;
  findProfileByNickname(nickname: string): Profile | null;
  getAllProfiles(): Profile[];

  clear(): void;
}
