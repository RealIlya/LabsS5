import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
  type CityData,
  type CityImprovementType,
  type StandaloneStructureData,
  type TerrainType,
  type UnitType,
} from "@hex/shared";
import { translations } from "../../../shared/i18n";
import { useGameState } from "../../../entities/game/model/useGameState";
import type { PlayerAction } from "@hex/shared";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import { useConnectionStatus } from "../../../shared/hooks/useConnectionStatus";
import { useGameMutations } from "../../../entities/game/model/useGameMutations";
import { TopBar } from "./components/TopBar";
import { InfoPanel } from "./components/InfoPanel";
import { ActionsPanel } from "./components/ActionsPanel";
import { ActionMenus } from "./components/ActionMenus";
import { MapTile as TileView } from "./components/MapTile";
import { useMapCamera } from "./hooks/useMapCamera";
import { useAutoSelectTile } from "./hooks/useAutoSelectTile";
import { useActionTargets } from "./hooks/useActionTargets";
import {
  HEX_CONFIG,
  HEX_NEIGHBORS,
  terrainColor,
  terrainTexture,
  unitEmoji,
} from "./mapConfig";
import type { MapTile } from "./types";
import "./GameMapPage.css";
import { useProfileStore } from "../../../entities/profile/model/useProfileStore";
import { Button } from "../../../shared/ui/button";

type PlayerCityTile = MapTile & { structure: CityData };

export function GameMapPage() {
  const t = useMemo(() => translations.ru.game, []);
  const [searchParams] = useSearchParams();

  // --- Hooks & State ---
  const storedGameId = useLobbyStore((state) => state.currentGameId);
  const lobby = useLobbyStore((state) => state.lobby);
  const setGameId = useLobbyStore((state) => state.setGameId);
  const selfId = useLobbyStore((state) => state.selfId);
  const setSelfId = useLobbyStore((state) => state.setSelfId);
  const connectionStatus = useConnectionStatus();
  const profile = useProfileStore((state) => state.profile);

  const gameIdFromParams = searchParams.get("gameId");
  const effectiveGameId =
    gameIdFromParams ?? storedGameId ?? lobby?.gameId ?? "demo-game";
  const effectivePlayerId = selfId ?? profile?.id ?? null;

  useEffect(() => {
    if (gameIdFromParams) setGameId(gameIdFromParams);
  }, [gameIdFromParams, setGameId]);

  useEffect(() => {
    if (!selfId && profile?.id) {
      setSelfId(profile.id);
    }
  }, [selfId, profile?.id, setSelfId]);

  const { data: gameState, isLoading, isError } = useGameState(effectiveGameId);
  const { placeCapitalMutation, submitActionMutation } = useGameMutations(
    effectiveGameId,
    effectivePlayerId
  );

  // --- Data Processing ---
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    gameState?.players.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [gameState?.players]);

  const mapTiles = useMemo(() => {
    if (!gameState?.tiles) return [];
    return gameState.tiles.map((tile) => ({
      id: tile.id,
      x: Number(tile.x),
      y: Number(tile.y),
      terrain: tile.terrain as TerrainType,
      ownerId: tile.ownerId ?? null,
      ownerName: tile.ownerId
        ? playerNameMap.get(tile.ownerId) ?? (tile as any).ownerName ?? null
        : null,
      structure: tile.structure
        ? tile.structure.type === "City"
          ? ({
              id: tile.structure.id,
              type: "City",
              ownerId: tile.structure.ownerId,
              ownerName: tile.structure.ownerName,
              population: (tile.structure as any).population ?? 0,
              fortification: (tile.structure as any).fortification ?? 0,
              improvement: (tile.structure as any).improvement ?? null,
              isCapital: Boolean((tile.structure as any).isCapital),
              production: (tile.structure as any).production ?? null,
            } satisfies CityData)
          : ({
              id: tile.structure.id,
              type: tile.structure.type as StandaloneStructureData["type"],
              ownerId: tile.structure.ownerId,
              ownerName: tile.structure.ownerName,
            } satisfies StandaloneStructureData)
        : undefined,
      unit: tile.unit
        ? {
            id: tile.unit.id,
            type: tile.unit.type as UnitType,
            ownerId: tile.unit.ownerId,
            ownerName: tile.unit.ownerName,
            health: tile.unit.health,
            isVeteran: tile.unit.isVeteran,
            movementPoints: tile.unit.movementPoints,
          }
        : undefined,
    }));
  }, [gameState?.tiles, playerNameMap]);

  const playerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    gameState?.players.forEach((p) => map.set(p.id, p.color));
    return map;
  }, [gameState?.players]);

  const tileByCoord = useMemo(() => {
    const coordMap = new Map<string, MapTile>();
    mapTiles.forEach((t) => coordMap.set(`${t.x},${t.y}`, t));
    return coordMap;
  }, [mapTiles]);

  const playerCityTiles = useMemo(
    () =>
      mapTiles.filter(
        (tile): tile is PlayerCityTile =>
          tile.structure?.type === "City" &&
          tile.structure.ownerId === effectivePlayerId
      ),
    [effectivePlayerId, mapTiles]
  );

  const playerState = effectivePlayerId
    ? gameState?.players?.find((p) => p.id === effectivePlayerId) ?? null
    : null;
  const playerDefeated = playerState?.status === "defeated";
  const isPlacementPhase = gameState?.phase === "capital-placement";
  const needsCapital =
    Boolean(playerState) && isPlacementPhase && !playerState?.capitalCityId;
  const waitingForOpponents = isPlacementPhase && !needsCapital;
  const controlsDisabled = isPlacementPhase || playerDefeated; // В будущем можно разблокировать для других фаз
  const isMyTurn =
    Boolean(effectivePlayerId) &&
    Boolean(gameState) &&
    !isPlacementPhase &&
    !playerDefeated &&
    gameState?.currentPlayerId === effectivePlayerId;
  const connectionDown = connectionStatus.status === "offline";
  const connectionMessage = connectionStatus.message ?? t.connectionLost;

  // --- Map & Drag Logic ---
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  const [menuType, setMenuType] = useState<
    null | "city-production" | "city-improvement" | "worker-build"
  >(null);
  const [activeAction, setActiveAction] = useState<null | "move" | "attack">(
    null
  );
  const [showPlayers, setShowPlayers] = useState(false);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);

  const clearSelection = useCallback(() => {
    setAutoSelectEnabled(false);
    setSelectedTile(null);
    setActiveAction(null);
  }, []);

  useEffect(() => {
    if (!selectedTile) return;
    const fresh = mapTiles.find((t) => t.id === selectedTile.id);
    if (fresh) {
      setSelectedTile(fresh);
    } else {
      setSelectedTile(null);
    }
  }, [mapTiles, selectedTile]);

  const columns = gameState?.map?.columns ?? 12;
  const rows = gameState?.map?.rows ?? 10;
  const mapPixelWidth =
    (columns - 1) * HEX_CONFIG.WIDTH + HEX_CONFIG.WIDTH * 1.5;
  const mapPixelHeight =
    (rows - 1) * HEX_CONFIG.ROW_SPACING_V + HEX_CONFIG.HEIGHT * 1.5;
  const overscroll = 100;
  const {
    viewportRef,
    offset,
    zoom,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleWheel,
    spacePressed,
    isDragging,
  } = useMapCamera({
    mapPixelWidth,
    mapPixelHeight,
    overscroll,
  });
  useAutoSelectTile(
    mapTiles,
    needsCapital,
    selectedTile,
    autoSelectEnabled,
    (tile) => setSelectedTile(tile)
  );

  const handleEndTurn = () => {
    if (!isMyTurn || submitActionMutation.isPending) {
      return;
    }
    const action: PlayerAction = { type: "END_TURN", payload: {} };
    submitActionMutation.mutate(action);
  };

  // --- Interaction Helpers ---
  const hasEnemyAdjacentCity = (tile: MapTile) => {
    const neighbors = HEX_NEIGHBORS[tile.y % 2 === 0 ? "even" : "odd"].map(
      ({ dx, dy }) => ({
        x: tile.x + dx,
        y: tile.y + dy,
      })
    );
    return neighbors.some(({ x, y }) => {
      const neighbor = tileByCoord.get(`${x},${y}`);
      return (
        neighbor?.structure?.type === "City" &&
        neighbor.structure.ownerId !== effectivePlayerId
      );
    });
  };

  const isTileEligibleForCapital = (tile: MapTile | null) =>
    !!tile &&
    tile.terrain !== "Mountains" &&
    tile.terrain !== "Water" &&
    !tile.structure &&
    !hasEnemyAdjacentCity(tile);

  // --- Render Vars ---
  const selectedTileUnit = selectedTile?.unit ?? null;
  const selectedUnitStats = selectedTileUnit
    ? UNIT_RULES[selectedTileUnit.type]
    : null;
  const selectedCity =
    selectedTile?.structure?.type === "City" ? selectedTile.structure : null;
  const remainingMovement =
    selectedTileUnit && selectedUnitStats
      ? selectedTileUnit.movementPoints ?? selectedUnitStats.baseStats.movement
      : 0;

  const { moveTargets, attackTargets } = useActionTargets({
    activeAction,
    selectedTile,
    selectedTileUnit,
    mapTiles,
    selfId: effectivePlayerId,
    canUseActions: remainingMovement > 0,
  });

  const handleSelect = (tile: MapTile) => {
    if (spacePressed || isDragging) return;
    setAutoSelectEnabled(true);

    if (needsCapital) {
      setSelectedTile(tile);
      if (isTileEligibleForCapital(tile) && !placeCapitalMutation.isPending) {
        placeCapitalMutation.mutate(tile.id);
      }
      return;
    }

    if (
      activeAction === "move" &&
      moveTargets.has(tile.id) &&
      selectedTile?.unit
    ) {
      const action: PlayerAction = {
        type: "MOVE_UNIT",
        payload: {
          unitId: selectedTile.unit.id,
          path: [{ x: tile.x, y: tile.y }],
        },
      };
      submitActionMutation.mutate(action, {
        onSuccess: () => {
          setSelectedTile(tile);
          setActiveAction(null);
        },
      });
      return;
    }

    if (activeAction === "attack" && attackTargets.has(tile.id)) {
      if (selectedTile?.unit && (tile.unit || tile.structure)) {
        const action: PlayerAction = {
          type: "ATTACK_UNIT",
          payload: {
            attackerId: selectedTile.unit.id,
            defenderId: tile.unit?.id ?? tile.structure?.id ?? "",
          },
        };
        submitActionMutation.mutate(action, {
          onSuccess: () => {
            setActiveAction(null);
            setSelectedTile(tile);
          },
        });
      } else {
        setActiveAction(null);
      }
      return;
    }

    setSelectedTile(tile);
    setActiveAction(null);
  };

  const cityProductionOptions = [
    {
      key: "warrior",
      label: t.actions.produceWarrior,
      cost: UNIT_RULES.Warrior.cost,
      payload: { type: "unit" as const, unitType: "Warrior" as UnitType },
    },
    {
      key: "spearman",
      label: t.actions.produceSpearman,
      cost: UNIT_RULES.Spearman.cost,
      payload: { type: "unit" as const, unitType: "Spearman" as UnitType },
    },
    {
      key: "archer",
      label: t.actions.produceArcher,
      cost: UNIT_RULES.Archer.cost,
      payload: { type: "unit" as const, unitType: "Archer" as UnitType },
    },
    {
      key: "horseman",
      label: t.actions.produceHorseman,
      cost: UNIT_RULES.Horseman.cost,
      payload: { type: "unit" as const, unitType: "Horseman" as UnitType },
    },
    {
      key: "worker",
      label: t.actions.produceWorker,
      cost: UNIT_RULES.Worker.cost,
      payload: { type: "unit" as const, unitType: "Worker" as UnitType },
    },
    {
      key: "settler",
      label: t.actions.produceSettler,
      cost: UNIT_RULES.Settler.cost,
      payload: { type: "unit" as const, unitType: "Settler" as UnitType },
    },
    {
      key: "barracks",
      label: t.actions.produceBarracks,
      cost: STRUCTURE_RULES.Barracks.cost,
      payload: {
        type: "improvement" as const,
        improvementType: "Barracks" as CityImprovementType,
      },
    },
    {
      key: "granary",
      label: t.actions.produceGranary,
      cost: STRUCTURE_RULES.Granary.cost,
      payload: {
        type: "improvement" as const,
        improvementType: "Granary" as CityImprovementType,
      },
    },
  ];

  const workerBuildOptions = [
    {
      key: "fort",
      label: t.actions.buildFort,
      cost: STRUCTURE_RULES.Fort.cost,
      structureType: "Fort" as const,
      turns: STRUCTURE_RULES.Fort.productionTurns,
    },
    {
      key: "farm",
      label: t.actions.buildFarm,
      cost: STRUCTURE_RULES.Farm.cost,
      structureType: "Farm" as const,
      turns: STRUCTURE_RULES.Farm.productionTurns,
    },
  ];

  const lowestCityProductionCost =
    cityProductionOptions.length > 0
      ? cityProductionOptions.reduce(
          (min, option) => Math.min(min, option.cost),
          Infinity
        )
      : Infinity;
  const insufficientCityPopulation = Boolean(
    selectedCity &&
      lowestCityProductionCost !== Infinity &&
      selectedCity.population < lowestCityProductionCost
  );
  const terrainName = selectedTile
    ? t.terrainNames[selectedTile.terrain] ?? selectedTile.terrain
    : "";
  const terrainDescription = selectedTile
    ? t.terrainDescriptions[selectedTile.terrain]
    : undefined;
  const activeProductionTurns =
    selectedCity?.production?.item?.type === "unit"
      ? UNIT_RULES[selectedCity.production.item.unitType]?.productionTurns ??
        null
      : selectedCity?.production?.item?.type === "improvement"
      ? STRUCTURE_RULES[selectedCity.production.item.improvementType]
          ?.productionTurns ?? null
      : null;
  const activeProductionProgress = selectedCity?.production?.progressTurns ?? 0;
  const activeProductionName =
    selectedCity?.production?.item?.type === "unit"
      ? t.actions[
          selectedCity.production.item.unitType === "Warrior"
            ? "produceWarrior"
            : selectedCity.production.item.unitType === "Worker"
            ? "produceWorker"
            : selectedCity.production.item.unitType === "Settler"
            ? "produceSettler"
            : selectedCity.production.item.unitType === "Spearman"
            ? "produceSpearman"
            : selectedCity.production.item.unitType === "Archer"
            ? "produceArcher"
            : "produceHorseman"
        ]
      : selectedCity?.production?.item?.type === "improvement"
      ? t.actions[
          selectedCity.production.item.improvementType === "Barracks"
            ? "buildBarracks"
            : "buildGranary"
        ]
      : null;

  const canBuild = Boolean(
    !controlsDisabled &&
      selectedTileUnit &&
      selectedTileUnit.ownerId === effectivePlayerId &&
      selectedTileUnit.type === "Worker" &&
      selectedTile &&
      !selectedTile.structure &&
      selectedTile.terrain !== "Water" &&
      selectedTile.terrain !== "Mountains" &&
      playerCityTiles.length > 0
  );

  const canOpenProductionMenu = !!(
    !controlsDisabled &&
    isMyTurn &&
    selectedCity &&
    selectedCity.ownerId === effectivePlayerId &&
    !submitActionMutation.isPending
  );

  const canMove = !!(
    !controlsDisabled &&
    isMyTurn &&
    selectedTileUnit?.ownerId === effectivePlayerId &&
    remainingMovement > 0
  );

  const canAttack = Boolean(
    !controlsDisabled &&
      isMyTurn &&
      selectedTileUnit &&
      selectedTileUnit.ownerId === effectivePlayerId &&
      remainingMovement > 0 &&
      UNIT_RULES[selectedTileUnit.type].abilities.canAttack !== false
  );

  const canFoundCity = !!(
    !controlsDisabled &&
    isMyTurn &&
    selectedTile &&
    !selectedTile.structure &&
    selectedTile.terrain !== "Water" &&
    selectedTile.terrain !== "Mountains" &&
    !hasEnemyAdjacentCity(selectedTile) &&
    selectedTileUnit?.ownerId === effectivePlayerId &&
    selectedTileUnit.type === "Settler"
  );

  const enemyCityBuffer = useMemo(() => {
    const buffer = new Set<string>();
    mapTiles.forEach((tile) => {
      if (
        tile.structure?.type === "City" &&
        tile.structure.ownerId !== effectivePlayerId
      ) {
        const parity = tile.y % 2 === 0 ? "even" : "odd";
        HEX_NEIGHBORS[parity].forEach(({ dx, dy }) => {
          const neighbor = tileByCoord.get(`${tile.x + dx},${tile.y + dy}`);
          if (neighbor) buffer.add(neighbor.id);
        });
      }
    });
    return buffer;
  }, [effectivePlayerId, mapTiles, tileByCoord]);

  const showCityBuffer =
    needsCapital ||
    (selectedTileUnit?.type === "Settler" &&
      selectedTileUnit.ownerId === effectivePlayerId);

  const hexDistance = useCallback((a: MapTile, b: MapTile) => {
    const toCube = (x: number, y: number) => {
      const xCube = x - (y - (y & 1)) / 2;
      const zCube = y;
      const yCube = -xCube - zCube;
      return { x: xCube, y: yCube, z: zCube };
    };
    const ac = toCube(a.x, a.y);
    const bc = toCube(b.x, b.y);
    return Math.max(
      Math.abs(ac.x - bc.x),
      Math.abs(ac.y - bc.y),
      Math.abs(ac.z - bc.z)
    );
  }, []);

  const handleBuild = () => {
    if (!canBuild) return;
    setMenuType("worker-build");
  };

  const farmDonorCity = useMemo(() => {
    if (
      !selectedTile ||
      !effectivePlayerId ||
      selectedTile.ownerId !== effectivePlayerId
    ) {
      return null;
    }
    let closest: PlayerCityTile | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    playerCityTiles.forEach((cityTile) => {
      const distance = hexDistance(selectedTile, cityTile);
      if (distance <= 1 && distance < closestDistance) {
        closest = cityTile as PlayerCityTile;
        closestDistance = distance;
      }
    });
    return closest;
  }, [effectivePlayerId, hexDistance, playerCityTiles, selectedTile]);

  const handleFoundCity = () => {
    if (!canFoundCity || !selectedTileUnit) return;
    const action: PlayerAction = {
      type: "FOUND_CITY",
      payload: { settlerId: selectedTileUnit.id },
    };
    submitActionMutation.mutate(action);
  };

  const handleProduceClick = () => {
    if (!canOpenProductionMenu) return;
    setMenuType("city-production");
  };

  const handleMoveToggle = () => {
    if (!canMove) return;
    setActiveAction((prev) => (prev === "move" ? null : "move"));
  };

  const handleAttackToggle = () => {
    if (!canAttack) return;
    setActiveAction((prev) => (prev === "attack" ? null : "attack"));
  };

  const submitCityProduction = (
    item:
      | { type: "unit"; unitType: UnitType }
      | { type: "improvement"; improvementType: CityImprovementType }
  ) => {
    if (!selectedCity) return;
    const action: PlayerAction = {
      type: "SET_CITY_PRODUCTION",
      payload:
        item.type === "unit"
          ? {
              cityId: selectedCity.id,
              item: { type: "unit", unitType: item.unitType },
            }
          : {
              cityId: selectedCity.id,
              item: {
                type: "improvement",
                improvementType: item.improvementType,
              },
            },
    };
    submitActionMutation.mutate(action, {
      onSuccess: () => setMenuType(null),
    });
  };

  const submitWorkerBuild = (
    structureType: "Farm" | "Fort",
    donorCityId?: string | null
  ) => {
    if (!selectedTile || !selectedTileUnit || !effectivePlayerId) {
      return;
    }
    if (
      structureType === "Farm" &&
      selectedTile.ownerId !== effectivePlayerId
    ) {
      return;
    }
    let fromCityId: string | null = donorCityId ?? null;
    if (structureType === "Farm") {
      fromCityId = farmDonorCity?.structure.id ?? null;
    }
    if (!fromCityId) {
      return;
    }
    const action: PlayerAction = {
      type: "BUILD_STRUCTURE",
      payload: {
        workerId: selectedTileUnit.id,
        structureType,
        position: { x: selectedTile.x, y: selectedTile.y },
        fromCityId,
      },
    };
    submitActionMutation.mutate(action, {
      onSuccess: () => setMenuType(null),
    });
  };

  if (isError) {
    return (
      <div className="game">
        <div className="game__status-overlay error">
          <div className="game__status-card">
            <h3>{t.error}</h3>
            <p>{t.connectionLost}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!gameState) {
    return (
      <div className="game">
        <div className="game__status-overlay">
          <div className="game__status-card">
            <p>{t.selectPrompt}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`game ${activeAction ? "game--action-mode" : ""}`}>
      <TopBar
        t={t}
        gameState={gameState}
        isPlacementPhase={isPlacementPhase}
        needsCapital={needsCapital}
        selfPlayer={playerState}
        playerDefeated={playerDefeated}
        onShowPlayers={() => setShowPlayers(true)}
      />

      {isLoading ? (
        <div className="game__status-overlay">
          <div className="game__status-card">
            <div className="spinner" />
            <p>{t.loading}</p>
          </div>
        </div>
      ) : null}

      <section
        className="game__viewport"
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onWheel={handleWheel}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div
          className="game__map-content"
          style={{
            width: mapPixelWidth,
            height: mapPixelHeight,
            transform: `translate3d(${-offset.x}px, ${-offset.y}px, 0) scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          {mapTiles.map((tile) => {
            const isBlocked = needsCapital && !isTileEligibleForCapital(tile);
            const proximityBlocked =
              showCityBuffer && enemyCityBuffer.has(tile.id);
            const highlighted =
              activeAction &&
              (moveTargets.has(tile.id) || attackTargets.has(tile.id));
            return (
              <TileView
                key={tile.id}
                tile={tile}
                selected={selectedTile?.id === tile.id}
                blocked={isBlocked}
                cityBlocked={proximityBlocked}
                highlighted={Boolean(highlighted)}
                territoryColor={
                  tile.ownerId ? playerColorMap.get(tile.ownerId) : undefined
                }
                controlColor={
                  tile.structure?.type === "Fort"
                    ? playerColorMap.get(tile.structure.ownerId)
                    : undefined
                }
                hexConfig={HEX_CONFIG}
                terrainColor={terrainColor}
                terrainTextures={terrainTexture}
                onSelect={handleSelect}
              />
            );
          })}
        </div>
      </section>

      <div className="game__hud-layer">
        <InfoPanel
          t={t}
          selectedTile={selectedTile}
          selectedCity={selectedCity}
          selectedTileUnit={selectedTileUnit}
          selectedUnitStats={selectedUnitStats}
          terrainName={terrainName}
          terrainDescription={terrainDescription}
          needsCapital={needsCapital}
          isTileEligibleForCapital={isTileEligibleForCapital}
          insufficientCityPopulation={insufficientCityPopulation}
          unitEmoji={unitEmoji}
          activeProductionTurns={activeProductionTurns}
          activeProductionProgress={activeProductionProgress}
          activeProductionName={activeProductionName}
          onClose={clearSelection}
        />

        <ActionsPanel
          t={t}
          canFoundCity={canFoundCity}
          canBuild={canBuild}
          canOpenProductionMenu={canOpenProductionMenu}
          canMove={canMove}
          canAttack={canAttack}
          moveActive={activeAction === "move"}
          attackActive={activeAction === "attack"}
          controlsDisabled={controlsDisabled}
          isMyTurn={isMyTurn}
          submitPending={submitActionMutation.isPending}
          onFoundCity={handleFoundCity}
          onBuild={handleBuild}
          onProduce={handleProduceClick}
          onMoveToggle={handleMoveToggle}
          onAttackToggle={handleAttackToggle}
          onEndTurn={handleEndTurn}
          endTurnDisabled={
            controlsDisabled || !isMyTurn || submitActionMutation.isPending
          }
          waitingForOpponents={waitingForOpponents}
        />
      </div>
      {connectionDown ? (
        <div className="connection-modal" role="alert">
          <div className="connection-modal__content">
            <h3>{t.connectionLost}</h3>
            <p>{connectionMessage ?? t.connectionRetry}</p>
          </div>
        </div>
      ) : null}
      <ActionMenus
        t={t}
        menuType={menuType}
        setMenuType={setMenuType}
        cityProductionOptions={cityProductionOptions}
        workerBuildOptions={workerBuildOptions}
        selectedCity={selectedCity}
        canBuild={canBuild}
        playerCities={playerCityTiles}
        farmCityId={farmDonorCity?.structure.id ?? null}
        canBuildFarm={
          selectedTile?.ownerId === effectivePlayerId &&
          selectedTile?.terrain === "Plains" &&
          !selectedTile?.structure
        }
        canBuildFort={
          !!selectedTile &&
          !selectedTile.structure &&
          (selectedTile.ownerId === null ||
            selectedTile.ownerId === effectivePlayerId) &&
          ["Plains", "Hills"].includes(selectedTile.terrain) &&
          mapTiles.every((t) =>
            t.structure?.type === "City"
              ? hexDistance(t, selectedTile) > 2
              : true
          )
        }
        submitPending={submitActionMutation.isPending}
        submitCityProduction={submitCityProduction}
        submitWorkerBuild={submitWorkerBuild}
      />
      {showPlayers ? (
        <div className="game__menu" role="dialog">
          <div className="game__menu-content">
            <div className="game__menu-header">
              <h4>{t.playersList}</h4>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowPlayers(false)}
                aria-label={t.playersClose}
              >
                ✖
              </Button>
            </div>
            <div className="game__players-table-wrapper">
              <table className="game__players-table">
                <thead>
                  <tr>
                    <th>{t.playersTable.name}</th>
                    <th>{t.playersTable.population}</th>
                    <th>{t.playersTable.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {gameState.players.map((p) => {
                    const statusLabel =
                      (t.statuses as Record<string, string>)[p.status] ??
                      p.status;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="game__player-name">
                            <span
                              className="game__player-color"
                              style={{ background: p.color }}
                            />
                            {p.name}
                            {p.id === effectivePlayerId
                              ? ` ${t.playersYou}`
                              : ""}
                          </span>
                        </td>
                        <td>
                          {p.currentPopulation}/{p.populationCap}
                        </td>
                        <td>{statusLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
