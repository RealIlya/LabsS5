import type { HexCoord } from "../types/hex.types";
import type { LobbyState, LobbySummary } from "../types/lobby.types";
import type { PlayerData } from "../types/player.types";
import type {
  CityData,
  CityImprovementType,
  StructureData,
  StructureType,
} from "../types/structure.types";
import type { TileData } from "../types/tile.types";
import type { UnitData, UnitType } from "../types/unit.types";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface HttpContractEntry<Payload, Response> {
  method: HttpMethod;
  route: string;
  payload: Payload;
  response: Response;
}

export type GamePhase = "capital-placement" | "running" | "finished";

export type GameStructureState = StructureData;

export type GameTileState = TileData;

export interface GameState {
  id: string;
  turn: number;
  currentPlayerId: string;
  currentPlayerName: string;
  turnEndsAt: string | null;
  turnDurationSeconds: number;
  phase: GamePhase;
  population: {
    current: number;
    cap: number;
  };
  map: {
    columns: number;
    rows: number;
  };
  players: PlayerData[];
  tiles: GameTileState[];
  events?: GameEvent[];
}

export type MoveUnitAction = {
  type: "MOVE_UNIT";
  payload: { unitId: string; path: HexCoord[] };
};

export type AttackUnitAction = {
  type: "ATTACK_UNIT";
  payload: { attackerId: string; defenderId: string };
};

export type FoundCityAction = {
  type: "FOUND_CITY";
  payload: { settlerId: string };
};

export type BuildStructureAction = {
  type: "BUILD_STRUCTURE";
  payload: {
    workerId: string;
    structureType: "Farm" | "Fort";
    position: HexCoord;
    fromCityId?: string;
  };
};

export type SetCityProductionAction = {
  type: "SET_CITY_PRODUCTION";
  payload: {
    cityId: string;
    item:
      | {
          type: "unit";
          unitType: UnitType;
        }
      | { type: "improvement"; improvementType: CityImprovementType };
  };
};

export type EndTurnAction = {
  type: "END_TURN";
  payload: Record<string, never>;
};

export type PlayerAction =
  | MoveUnitAction
  | AttackUnitAction
  | FoundCityAction
  | BuildStructureAction
  | SetCityProductionAction
  | EndTurnAction;

export interface TurnChangedEvent {
  type: "TURN_CHANGED";
  payload: {
    nextPlayerId: string;
    turnNumber: number;
  };
}

export interface UnitMovedEvent {
  type: "UNIT_MOVED";
  payload: {
    unitId: string;
    path: HexCoord[];
    newMovementPoints: number;
  };
}

export interface UnitAttackedEvent {
  type: "UNIT_ATTACKED";
  payload: {
    attackerId: string;
    defenderId: string;
  };
}

export interface UnitTookDamageEvent {
  type: "UNIT_TOOK_DAMAGE";
  payload: {
    unitId: string;
    damageDealt: number;
    newHealth: number;
  };
}

export interface UnitDiedEvent {
  type: "UNIT_DIED";
  payload: {
    unitId: string;
  };
}

export interface CityFoundedEvent {
  type: "CITY_FOUNDED";
  payload: {
    newCity: CityData;
    acquiredTileIds: string[];
  };
}

export interface StructureCreatedEvent {
  type: "STRUCTURE_CREATED";
  payload: {
    newStructure: StructureData;
    position: HexCoord;
  };
}

export interface ProductionCompletedEvent {
  type: "PRODUCTION_COMPLETED";
  payload: {
    cityId: string;
    createdUnit?: UnitData;
    createdImprovement?: CityImprovementType;
  };
}

export interface CityFortificationChangedEvent {
  type: "CITY_FORTIFICATION_CHANGED";
  payload: {
    cityId: string;
    newFortification: number;
    damage?: number;
  };
}

export interface CityCapturedEvent {
  type: "CITY_CAPTURED";
  payload: {
    cityId: string;
    newOwnerId: string;
    oldOwnerId: string;
    populationLost: number;
  };
}

export interface PlayerDefeatedEvent {
  type: "PLAYER_DEFEATED";
  payload: {
    playerId: string;
    removedUnitIds: string[];
    removedStructureIds: string[];
  };
}

export interface GameFinishedEvent {
  type: "GAME_FINISHED";
  payload: {
    winnerId: string;
  };
}

export interface CityDestroyedEvent {
  type: "CITY_DESTROYED";
  payload: {
    cityId: string;
  };
}

export type GameEvent =
  | TurnChangedEvent
  | UnitMovedEvent
  | UnitAttackedEvent
  | UnitTookDamageEvent
  | UnitDiedEvent
  | CityFoundedEvent
  | StructureCreatedEvent
  | ProductionCompletedEvent
  | CityFortificationChangedEvent
  | CityCapturedEvent
  | PlayerDefeatedEvent
  | GameFinishedEvent
  | CityDestroyedEvent;

export const API_CONTRACT = {
  http: {
    getLobbies: {
      method: "GET",
      route: "/api/lobbies",
      payload: null,
      response: [] as LobbySummary[],
    } satisfies HttpContractEntry<null, LobbySummary[]>,
    createLobby: {
      method: "POST",
      route: "/api/lobbies",
      payload: { name: "", playerName: "" },
      response: {} as LobbyState,
    } satisfies HttpContractEntry<
      { name: string; playerName: string },
      LobbyState
    >,
    getGameState: {
      method: "GET",
      route: "/api/games/:gameId/state",
      payload: null,
      response: {} as GameState,
    } satisfies HttpContractEntry<null, GameState>,
  },
} as const;
