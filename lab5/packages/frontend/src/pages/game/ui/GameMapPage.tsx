import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
  type CityImprovementType,
  type StructureType,
  type TerrainType,
  type UnitType,
} from "@hex/shared";
import { translations } from "../../../shared/i18n";
import { useGameState } from "../../../entities/game/model/useGameState";
import { placeCapital, submitAction } from "../../../entities/game/api/gameApi";
import type { PlayerAction } from "@hex/shared";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import { useConnectionStatus } from "../../../shared/hooks/useConnectionStatus";
import "./GameMapPage.css";

interface MapStructure {
  id: string;
  type: StructureType;
  ownerId: string;
  ownerName: string;
  isCapital?: boolean;
}

interface MapUnit {
  id: string;
  type: UnitType;
  ownerId: string;
  ownerName: string;
  health: number;
  isVeteran: boolean;
  movementPoints?: number;
}

interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  ownerId: string | null;
  structure?: MapStructure;
  unit?: MapUnit;
}

const isTilePassable = (tile: MapTile, playerId: string | null) => {
  if (tile.terrain === "Water" || tile.terrain === "Mountains") {
    return false;
  }
  if (tile.unit) {
    return false;
  }
  if (tile.structure && tile.structure.ownerId !== playerId) {
    return false;
  }
  return true;
};

const isAdjacent = (from: MapTile, to: MapTile) => {
  const offsets = HEX_NEIGHBORS[from.y % 2 === 0 ? "even" : "odd"];
  return offsets.some(
    (offset) => from.x + offset.dx === to.x && from.y + offset.dy === to.y
  );
};

// --- Constants ---
const HEX_CONFIG = {
  SIZE: 60,
  get HEIGHT() {
    return this.SIZE * 2;
  },
  get WIDTH() {
    return (Math.sqrt(3) / 2) * this.HEIGHT;
  },
  get ROW_SPACING_V() {
    return this.HEIGHT * 0.75;
  },
};

const terrainColor: Record<TerrainType, string> = {
  Plains: "#86bb63", // Немного более мягкий зеленый
  Forest: "#4a7c47",
  Hills: "#d4b483",
  Mountains: "#718096",
  Water: "#63b3ed",
};

const unitEmoji: Record<UnitType, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🏳️", // Флаг для поселенца более понятен
  Worker: "🔨",
};

const HEX_NEIGHBORS = {
  even: [
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
  ],
  odd: [
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },
    { dx: 0, dy: 1 },
  ],
};

export function GameMapPage() {
  const t = useMemo(() => translations.ru.game, []);
  const [searchParams] = useSearchParams();

  // --- Hooks & State ---
  const storedGameId = useLobbyStore((state) => state.currentGameId);
  const lobby = useLobbyStore((state) => state.lobby);
  const setGameId = useLobbyStore((state) => state.setGameId);
  const selfId = useLobbyStore((state) => state.selfId);
  const connectionStatus = useConnectionStatus();

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const gameIdFromParams = searchParams.get("gameId");
  const effectiveGameId =
    gameIdFromParams ?? storedGameId ?? lobby?.gameId ?? "demo-game";

  useEffect(() => {
    if (gameIdFromParams) setGameId(gameIdFromParams);
  }, [gameIdFromParams, setGameId]);

  // Resize Observer для полноэкранного контейнера
  useEffect(() => {
    const updateSize = () => {
      if (viewportRef.current) {
        setViewportSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };
    window.addEventListener("resize", updateSize);
    updateSize(); // Init
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const { data: gameState, isLoading, isError } = useGameState(effectiveGameId);
  const queryClient = useQueryClient();

  const placeCapitalMutation = useMutation({
    mutationFn: (tileId: string) => {
      if (!effectiveGameId || !selfId) throw new Error("Missing identifiers");
      return placeCapital({
        gameId: effectiveGameId,
        tileId,
        playerId: selfId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", effectiveGameId] });
    },
  });

  const submitActionMutation = useMutation({
    mutationFn: (action: PlayerAction) => {
      if (!effectiveGameId || !selfId) {
        throw new Error("Missing identifiers for action");
      }
      return submitAction({
        gameId: effectiveGameId,
        playerId: selfId,
        action,
      });
    },
    onSuccess: (data) => {
      if (effectiveGameId) {
        queryClient.setQueryData(["game", effectiveGameId], data);
      }
    },
  });

  // --- Data Processing ---
  const mapTiles = useMemo(() => {
    if (!gameState?.tiles) return [];
    return gameState.tiles.map((tile) => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      terrain: tile.terrain as TerrainType,
      ownerId: tile.ownerId ?? null,
      structure: tile.structure
        ? {
            id: tile.structure.id,
            type: tile.structure.type as StructureType,
            ownerId: tile.structure.ownerId,
            ownerName: tile.structure.ownerName,
            isCapital:
              tile.structure.type === "City"
                ? Boolean(tile.structure.isCapital)
                : undefined,
          }
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
  }, [gameState?.tiles]);

  const playerState = selfId
    ? gameState?.players?.find((p) => p.id === selfId) ?? null
    : null;
  const isPlacementPhase = gameState?.phase === "capital-placement";
  const needsCapital =
    Boolean(playerState) && isPlacementPhase && !playerState?.capitalCityId;
  const waitingForOpponents = isPlacementPhase && !needsCapital;
  const controlsDisabled = isPlacementPhase; // В будущем можно разблокировать для других фаз
  const isMyTurn =
    Boolean(selfId) &&
    Boolean(gameState) &&
    !isPlacementPhase &&
    gameState?.currentPlayerId === selfId;
  const connectionDown = connectionStatus.status !== "online";
  const connectionMessage = connectionStatus.message ?? t.connectionLost;

  // --- Map & Drag Logic ---
  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  const [menuType, setMenuType] = useState<
    null | "city-production" | "worker-build"
  >(null);

  // Авто-выбор первого тайла
  useEffect(() => {
    if (!selectedTile && mapTiles.length > 0 && !needsCapital) {
      // Можно центрировать камеру на столице, если она есть
      setSelectedTile(mapTiles[0]);
    }
  }, [mapTiles, selectedTile, needsCapital]);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [spacePressed, setSpacePressed] = useState(false);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const dragState = useRef({
    active: false,
    pointerId: 0,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
  });

  const columns = gameState?.map?.columns ?? 12;
  const rows = gameState?.map?.rows ?? 10;
  const mapPixelWidth =
    (columns - 1) * HEX_CONFIG.WIDTH + HEX_CONFIG.WIDTH * 1.5;
  const mapPixelHeight =
    (rows - 1) * HEX_CONFIG.ROW_SPACING_V + HEX_CONFIG.HEIGHT * 1.5;
  const scaledWidth = mapPixelWidth * zoom;
  const scaledHeight = mapPixelHeight * zoom;
  const overscroll = 100;
  const maxDragX = Math.max(0, scaledWidth - viewportSize.width + overscroll);
  const maxDragY = Math.max(0, scaledHeight - viewportSize.height + overscroll);

  // Центрирование карты при старте (опционально)
  useEffect(() => {
    if (viewportSize.width > 0 && offset.x === 0 && offset.y === 0) {
      setOffset({
        x: Math.max(0, (scaledWidth - viewportSize.width) / 2),
        y: Math.max(0, (scaledHeight - viewportSize.height) / 2),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportSize.width, viewportSize.height, scaledWidth, scaledHeight]);

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setSpacePressed(true);
        event.preventDefault();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setSpacePressed(false);
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const isMiddleButton = e.button === 1;
    const isSpacePan = e.button === 0 && spacePressed;
    if (!isMiddleButton && !isSpacePan) {
      return;
    }
    dragState.current = {
      active: true,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      startOffset: { ...offset },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragState.current.active) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.start.x;
    const dy = e.clientY - dragState.current.start.y;

    // Позволяем уходить чуть за границы (overscroll), чтобы видеть края карты
    setOffset({
      x: clamp(dragState.current.startOffset.x - dx, -overscroll, maxDragX),
      y: clamp(dragState.current.startOffset.y - dy, -overscroll, maxDragY),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      e.currentTarget.releasePointerCapture?.(dragState.current.pointerId);
    }
  };

  const handleWheel: React.WheelEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const cursorX = rect ? event.clientX - rect.left : viewportSize.width / 2;
    const cursorY = rect ? event.clientY - rect.top : viewportSize.height / 2;
    const delta = event.deltaY;
    setZoom((prevZoom) => {
      const nextZoom = clamp(prevZoom - delta * 0.0015, MIN_ZOOM, MAX_ZOOM);
      if (nextZoom === prevZoom) {
        return prevZoom;
      }
      const ratio = nextZoom / prevZoom;
      setOffset((prevOffset) => {
        const nextWidth = mapPixelWidth * nextZoom;
        const nextHeight = mapPixelHeight * nextZoom;
        const nextMaxX = Math.max(
          0,
          nextWidth - viewportSize.width + overscroll
        );
        const nextMaxY = Math.max(
          0,
          nextHeight - viewportSize.height + overscroll
        );
        const newOffsetX = (prevOffset.x + cursorX) * ratio - cursorX;
        const newOffsetY = (prevOffset.y + cursorY) * ratio - cursorY;
        return {
          x: clamp(newOffsetX, -overscroll, nextMaxX),
          y: clamp(newOffsetY, -overscroll, nextMaxY),
        };
      });
      return nextZoom;
    });
  };

  const handleEndTurn = () => {
    if (!isMyTurn || submitActionMutation.isPending) {
      return;
    }
    const action: PlayerAction = { type: "END_TURN", payload: {} };
    submitActionMutation.mutate(action);
  };

  // --- Interaction Helpers ---
  const isTileEligibleForCapital = (tile: MapTile | null) =>
    !!tile &&
    tile.terrain !== "Mountains" &&
    tile.terrain !== "Water" &&
    !tile.structure;

  const handleSelect = (tile: MapTile) => {
    if (dragState.current.active || spacePressed) return;

    if (needsCapital) {
      setSelectedTile(tile);
      if (isTileEligibleForCapital(tile) && !placeCapitalMutation.isPending) {
        placeCapitalMutation.mutate(tile.id);
      }
      return;
    }

    const selectedHasUnit = Boolean(
      selectedTile?.unit && selectedTile.unit.ownerId === selfId
    );
    const attemptingMove =
      selectedHasUnit &&
      isMyTurn &&
      tile.id !== selectedTile?.id &&
      isAdjacent(selectedTile as MapTile, tile) &&
      isTilePassable(tile, selfId ?? null);

    if (
      attemptingMove &&
      !submitActionMutation.isPending &&
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
        onSuccess: () => setSelectedTile(tile),
      });
      return;
    }

    setSelectedTile(tile);
  };

  const getStructureEmoji = (s?: MapStructure) => {
    if (!s) return null;
    if (s.type === "City") return s.isCapital ? "🏛️" : "🏰";
    if (s.type === "Farm") return "🌾";
    if (s.type === "Fort") return "🧱";
    return "🏗️";
  };

  // --- Render Vars ---
  const selectedTileUnit = selectedTile?.unit ?? null;
  const selectedUnitStats = selectedTileUnit
    ? UNIT_RULES[selectedTileUnit.type]
    : null;
  const selectedCity =
    selectedTile?.structure?.type === "City" ? selectedTile.structure : null;

  const cityProductionOptions = [
    {
      key: "warrior",
      label: t.actions.produceWarrior,
      cost: UNIT_RULES.Warrior.cost,
      payload: { type: "unit" as const, unitType: "Warrior" as UnitType },
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
      label: t.actions.buildBarracks,
      cost: STRUCTURE_RULES.Barracks.cost,
      payload: {
        type: "improvement" as const,
        improvementType: "Barracks" as CityImprovementType,
      },
    },
    {
      key: "granary",
      label: t.actions.buildGranary,
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
    },
    {
      key: "farm",
      label: t.actions.buildFarm,
      cost: STRUCTURE_RULES.Farm.cost,
      structureType: "Farm" as const,
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

  const canFortify = Boolean(
    !controlsDisabled &&
      selectedTileUnit &&
      selectedTileUnit.ownerId === selfId &&
      selectedTileUnit.type === "Worker" &&
      selectedTile &&
      !selectedTile.structure &&
      selectedTile.terrain !== "Water" &&
      selectedTile.terrain !== "Mountains" &&
      playerState?.capitalCityId
  );

  const canOpenProductionMenu =
    !controlsDisabled &&
    isMyTurn &&
    selectedCity &&
    selectedCity.ownerId === selfId &&
    !submitActionMutation.isPending;

  const handleProduceWarrior = () => {
    if (!canOpenProductionMenu || !selectedCity) return;
    const action: PlayerAction = {
      type: "SET_CITY_PRODUCTION",
      payload: {
        cityId: selectedCity.id,
        item: { type: "unit", unitType: "Warrior" },
      },
    };
    submitActionMutation.mutate(action);
  };

  const canFoundCity =
    !controlsDisabled &&
    isMyTurn &&
    selectedTile &&
    !selectedTile.structure &&
    selectedTile.terrain !== "Water" &&
    selectedTile.terrain !== "Mountains" &&
    selectedTileUnit?.ownerId === selfId &&
    selectedTileUnit.type === "Settler";

  const handleFortify = () => {
    if (!canFortify) return;
    setMenuType("worker-build");
  };

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

  const submitWorkerBuild = (structureType: "Farm" | "Fort") => {
    if (!selectedTile || !selectedTileUnit || !playerState?.capitalCityId) {
      return;
    }
    const action: PlayerAction = {
      type: "BUILD_STRUCTURE",
      payload: {
        workerId: selectedTileUnit.id,
        structureType,
        position: { x: selectedTile.x, y: selectedTile.y },
        fromCityId: playerState.capitalCityId,
      },
    };
    submitActionMutation.mutate(action, {
      onSuccess: () => setMenuType(null),
    });
  };

  if (isLoading)
    return (
      <div className="game flex items-center justify-center text-white">
        {t.loading}
      </div>
    );
  if (isError || !gameState)
    return (
      <div className="game flex items-center justify-center text-red-400">
        {t.error}
      </div>
    );

  return (
    <div className="game">
      {/* --- TOP HUD: Stats --- */}
      <header className="game__top-bar">
        <div className="game__stats-group">
          <div className="game__stat-item">
            <span className="game__stat-label">{t.turn}</span>
            <span className="game__stat-value">{gameState.turn}</span>
          </div>
          <div className="game__stat-item">
            <span className="game__stat-label">{t.population}</span>
            <span className="game__stat-value">
              {gameState.population.current} / {gameState.population.cap}
            </span>
          </div>
          <div className="game__stat-item">
            {/* Placeholder for Gold/Resources if needed */}
            <span className="game__stat-label">{t.currentPlayer}</span>
            <span className="game__stat-value" style={{ color: "#60a5fa" }}>
              {gameState.currentPlayerName ?? gameState.currentPlayerId}
            </span>
          </div>
        </div>

        {isPlacementPhase && (
          <div className="game__phase-banner">
            {needsCapital
              ? t.capitalPlacement.hint
              : t.capitalPlacement.waiting}
          </div>
        )}
      </header>

      {/* --- MAP VIEWPORT --- */}
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
            const offsetX =
              tile.x * HEX_CONFIG.WIDTH +
              (tile.y % 2 ? HEX_CONFIG.WIDTH / 2 : 0);
            const offsetY = tile.y * HEX_CONFIG.ROW_SPACING_V;
            const isBlocked = needsCapital && !isTileEligibleForCapital(tile);

            return (
              <div
                key={tile.id}
                className={`
                  game__tile 
                  ${selectedTile?.id === tile.id ? "game__tile--selected" : ""}
                  ${isBlocked ? "game__tile--blocked" : ""}
                `}
                onClick={() => handleSelect(tile)}
                style={{
                  backgroundColor: terrainColor[tile.terrain],
                  width: HEX_CONFIG.WIDTH,
                  height: HEX_CONFIG.HEIGHT,
                  left: offsetX,
                  top: offsetY,
                }}
              >
                {tile.structure && (
                  <span className="game__tile-structure">
                    {getStructureEmoji(tile.structure)}
                  </span>
                )}
                {tile.unit && (
                  <span className="game__tile-unit">
                    {unitEmoji[tile.unit.type]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --- BOTTOM HUD: Split Info & Actions --- */}
      <div className="game__hud-layer">
        {/* LEFT: Context Info */}
        <div className="game__hud-left game__hud-panel">
          {selectedTile ? (
            <>
              <div className="game__hud-header">
                <h2>
                  {terrainName}
                  <span
                    style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: 8 }}
                  >
                    ({selectedTile.x}, {selectedTile.y})
                  </span>
                </h2>
                {terrainDescription ? (
                  <p className="game__hud-subtext">{terrainDescription}</p>
                ) : null}
                {selectedTile.structure && (
                  <p className="game__hud-subtext">
                    {getStructureEmoji(selectedTile.structure)}{" "}
                    {selectedTile.structure.type}
                    {selectedTile.structure.isCapital
                      ? ` (${t.capitalPlacement.capitalLabel})`
                      : ""}
                  </p>
                )}
              </div>

              {selectedCity && (
                <div className="game__city-stats">
                  <span>
                    {t.ownerLabel}: {selectedCity.ownerName}
                  </span>
                  <span>
                    {t.cityPopulation}: {Math.floor(selectedCity.population)}
                  </span>
                </div>
              )}

              {selectedUnitStats && selectedTileUnit && (
                <div className="game__unit-stats">
                  <div className="flex flex-col">
                    <span className="text-white font-bold flex items-center gap-2">
                      {unitEmoji[selectedTileUnit.type as UnitType]}{" "}
                      {selectedTileUnit.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.ownerLabel}: {selectedTile.unit?.ownerName}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 ml-auto">
                    <div className="game__stat-row" title={t.unitStats.attack}>
                      ⚔️ {selectedUnitStats.baseStats.attack}
                    </div>
                    <div className="game__stat-row" title={t.unitStats.health}>
                      ❤️ {selectedUnitStats.baseStats.health}
                    </div>
                    <div
                      className="game__stat-row"
                      title={t.unitStats.movement}
                    >
                      👟
                      {selectedTile.unit?.movementPoints ??
                        selectedUnitStats.baseStats.movement}
                    </div>
                  </div>
                </div>
              )}

              {!selectedCity && !selectedUnitStats && !needsCapital && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  {t.selectPrompt}
                </p>
              )}

              {insufficientCityPopulation && (
                <p className="game__warning">{t.warnings.population}</p>
              )}

              {needsCapital && (
                <div
                  className={`mt-2 text-sm ${
                    isTileEligibleForCapital(selectedTile)
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isTileEligibleForCapital(selectedTile)
                    ? t.capitalPlacement.action
                    : t.capitalPlacement.invalid}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400">{t.selectPrompt}</p>
          )}
        </div>

        {/* RIGHT: Actions */}
        <div className="game__hud-right">
          {/* Здесь могут быть уведомления (тосты) */}

          <div className="game__hud-panel flex flex-col gap-3">
            {/* Кнопки действий юнита (скрыты если не выбран свой юнит) */}
            <div className="game__actions-grid">
              <Button
                variant="secondary"
                size="icon"
                disabled={controlsDisabled || !selectedTileUnit || !isMyTurn}
                title={t.actions.attack}
                aria-label={t.actions.attack}
              >
                ⚔️
              </Button>
              <Button
                variant="secondary"
                size="icon"
                disabled={controlsDisabled || !selectedTileUnit || !isMyTurn}
                title={t.actions.move}
                aria-label={t.actions.move}
              >
                👟
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleFoundCity}
                disabled={!canFoundCity}
                title={t.actions.foundCity}
                aria-label={t.actions.foundCity}
              >
                🏠
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleFortify}
                disabled={
                  controlsDisabled ||
                  !canFortify ||
                  submitActionMutation.isPending ||
                  !isMyTurn
                }
                title={t.actions.fortify}
                aria-label={t.actions.fortify}
              >
                🛡️
              </Button>
              {/* Слот для строительства */}
              <Button
                variant="secondary"
                size="icon"
                disabled={controlsDisabled || !selectedTileUnit || !isMyTurn}
                title={t.actions.build}
                aria-label={t.actions.build}
              >
                🏗️
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleProduceClick}
                disabled={!canOpenProductionMenu}
                title={t.actions.produceWarrior}
                aria-label={t.actions.produceWarrior}
              >
                🏭
              </Button>
            </div>

            <Button
              className="game__end-turn-btn"
              onClick={handleEndTurn}
              disabled={
                controlsDisabled || !isMyTurn || submitActionMutation.isPending
              }
            >
              {waitingForOpponents ? t.capitalPlacement.waiting : t.endTurn}
            </Button>
          </div>
        </div>
      </div>
      {connectionDown ? (
        <div className="connection-modal" role="alert">
          <div className="connection-modal__content">
            <h3>{t.connectionLost}</h3>
            <p>{connectionMessage ?? t.connectionRetry}</p>
          </div>
        </div>
      ) : null}
      {menuType === "city-production" && (
        <div className="game__menu" role="dialog">
          <div className="game__menu-content">
            <div className="game__menu-header">
              <h4>{t.actions.productionMenu}</h4>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMenuType(null)}
              >
                ✖
              </Button>
            </div>
            <div className="game__menu-list">
              {cityProductionOptions.map((option) => (
                <button
                  key={option.key}
                  className="game__menu-item"
                  onClick={() => submitCityProduction(option.payload)}
                  disabled={
                    submitActionMutation.isPending ||
                    !selectedCity ||
                    selectedCity.population < option.cost
                  }
                >
                  <span>{option.label}</span>
                  <span className="game__menu-cost">-{option.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {menuType === "worker-build" && (
        <div className="game__menu" role="dialog">
          <div className="game__menu-content">
            <div className="game__menu-header">
              <h4>{t.actions.buildMenu}</h4>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setMenuType(null)}
              >
                ✖
              </Button>
            </div>
            <div className="game__menu-list">
              {workerBuildOptions.map((option) => (
                <button
                  key={option.key}
                  className="game__menu-item"
                  onClick={() => submitWorkerBuild(option.structureType)}
                  disabled={submitActionMutation.isPending || !canFortify}
                >
                  <span>{option.label}</span>
                  <span className="game__menu-cost">-{option.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
