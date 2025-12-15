import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStore } from "../../infrastructure/store/memory-store";
import { GameService } from "../game/game.service";
import { MapService } from "../game/map.service";
import { LobbyService } from "./lobby.service";

const buildServices = () => {
  const store = new MemoryStore();
  const mapService = new MapService();
  const gameService = new GameService(mapService, store);
  const lobbyService = new LobbyService(gameService, store);
  return { store, lobbyService };
};

describe("LobbyService", () => {
  let store: MemoryStore;
  let lobbyService: LobbyService;

  beforeEach(() => {
    ({ store, lobbyService } = buildServices());
  });

  it("creates lobby with host as first player", async () => {
    const lobby = await lobbyService.createLobby("p1", "Alice", "Room", 4);
    expect(lobby.hostId).toBe("p1");
    expect(lobby.players).toHaveLength(1);
    expect(lobby.players[0].nickname).toBe("Alice");
  });

  it("allows joining while waiting and prevents overfill", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 2);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    const state = lobbyService.getLobbyState(lobby.id);
    expect(state.players).toHaveLength(2);
    await expect(
      lobbyService.joinLobby(lobby.code, "p3", "Charlie")
    ).rejects.toThrowError(/full/i);
  });

  it("does not duplicate same player on join", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 3);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    const state = lobbyService.getLobbyState(lobby.id);
    expect(state.players).toHaveLength(2);
  });

  it("toggles ready flag", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 3);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    const updated = await lobbyService.toggleReady(lobby.id, "p2", true);
    const bob = updated.players.find((p) => p.id === "p2");
    expect(bob?.isReady).toBe(true);
  });

  it("starts lobby only when everyone is ready", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 2);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    await expect(lobbyService.startLobby(lobby.id)).rejects.toThrowError(
      /not ready/i
    );
    await lobbyService.toggleReady(lobby.id, "p1", true);
    await lobbyService.toggleReady(lobby.id, "p2", true);
    const { gameId } = await lobbyService.startLobby(lobby.id);
    expect(gameId).toBeDefined();
  });

  it("removes player on leave and deletes empty lobby", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 3);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");

    const lobbyAfterLeave = await lobbyService.leaveLobby(lobby.id, "p2");
    expect(lobbyAfterLeave?.players).toHaveLength(1);

    const removed = await lobbyService.leaveLobby(lobby.id, "p1");
    expect(removed).toBeNull();
    expect(store.getLobby(lobby.id)).toBeNull();
  });

  it("reassigns host when current host leaves", async () => {
    const lobby = await lobbyService.createLobby("p1", "Host", "Room", 3);
    await lobbyService.joinLobby(lobby.code, "p2", "Bob");
    const updated = await lobbyService.leaveLobby(lobby.id, "p1");
    expect(updated?.hostId).toBe("p2");
  });
});
