import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import {
  STRUCTURE_RULES,
  UNIT_RULES,
  type StructureType,
  type TerrainType,
  type UnitType,
} from "@hex/shared";
import { translations } from "../../../shared/i18n";
import { useGameState } from "../../../entities/game/model/useGameState";
import { placeCapital } from "../../../entities/game/api/gameApi";
import { useLobbyStore } from "../../../entities/lobby/model/useLobbyStore";
import "./GameMapPage.css";

interface MapStructure {
  id: string;
  type: StructureType;
  ownerId: string;
  ownerName: string;
  isCapital?: boolean;
}

interface MapTile {
  id: string;
  x: number;
  y: number;
  terrain: TerrainType;
  structure?: MapStructure;
  unit?: {
    type: UnitType;
    owner: string;
  };
}

const HEX_CONFIG = {
  SIZE: 60, // Радиус гексагона (расстояние от центра до вершины)
  get HEIGHT() {
    return this.SIZE * 2;
  },
  get WIDTH() {
    return (Math.sqrt(3) / 2) * this.HEIGHT;
  },
  get ROW_SPACING_V() {
    // Вертикальное расстояние между центрами рядов
    return this.HEIGHT * 0.75;
  },
};

const MAP_COLUMNS = 12;
const MAP_ROWS = 10;
const VIEWPORT_COLUMNS = 8;
const VIEWPORT_ROWS = 6;

const terrainColor: Record<TerrainType, string> = {
  Plains: "#9bd770",
  Forest: "#5d9c59",
  Hills: "#c3a572",
  Mountains: "#8d99ae",
  Water: "#7ec8e3",
};

const unitEmoji: Record<UnitType, string> = {
  Warrior: "⚔️",
  Spearman: "🛡️",
  Archer: "🏹",
  Horseman: "🐎",
  Settler: "🧳",
  Worker: "🛠️",
};

export function GameMapPage() {
  const t = useMemo(() => translations.ru.game, []);
  const [searchParams] = useSearchParams();
  const storedGameId = useLobbyStore((state) => state.currentGameId);
  const lobby = useLobbyStore((state) => state.lobby);
  const setGameId = useLobbyStore((state) => state.setGameId);
  const selfId = useLobbyStore((state) => state.selfId);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const gameIdFromParams = searchParams.get("gameId");
  const effectiveGameId =
    gameIdFromParams ?? storedGameId ?? lobby?.gameId ?? "demo-game";
  useEffect(() => {
    if (gameIdFromParams) {
      setGameId(gameIdFromParams);
    }
  }, [gameIdFromParams, setGameId]);

  useEffect(() => {
    const updateViewport = () => {
      const element = mapWrapperRef.current;
      if (!element) {
        return;
      }
      setViewport({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const { data: gameState, isLoading, isError } = useGameState(effectiveGameId);
  const queryClient = useQueryClient();
  const placeCapitalMutation = useMutation({
    mutationFn: (tileId: string) => {
      if (!effectiveGameId || !selfId) {
        throw new Error("Missing identifiers for capital placement");
      }
      return placeCapital({ gameId: effectiveGameId, tileId, playerId: selfId });
    },
    onSuccess: () => {
      if (effectiveGameId) {
        queryClient.invalidateQueries({ queryKey: ["game", effectiveGameId] });
      }
    },
  });
  const mapTiles = useMemo(() => {
    if (!gameState?.tiles) {
      return [];
    }
    return gameState.tiles.map((tile) => ({
      id: tile.id,
      x: tile.x,
      y: tile.y,
      terrain: tile.terrain as TerrainType,
      structure: tile.structure
        ? {
            id: tile.structure.id,
            type: tile.structure.type as StructureType,
            ownerId: tile.structure.ownerId,
            ownerName: tile.structure.ownerName,
            isCapital: tile.structure.isCapital,
          }
        : undefined,
      unit: tile.unit
        ? { type: tile.unit.type as UnitType, owner: tile.unit.owner }
        : undefined,
    }));
  }, [gameState?.tiles]);

  const playerState = selfId
    ? gameState?.players?.find((player) => player.id === selfId) ?? null
    : null;
  const isPlacementPhase = gameState?.phase === "capital-placement";
  const needsCapital = Boolean(playerState) && isPlacementPhase && !playerState?.capitalCityId;
  const waitingForOpponents = isPlacementPhase && !needsCapital;
  const controlsDisabled = isPlacementPhase;

  const defaultViewportWidth =
    typeof window !== "undefined" ? window.innerWidth - 48 : 1024;
  const defaultViewportHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.5 : 480;
  const viewportWidth = viewport.width || defaultViewportWidth;
  const viewportHeight =
    viewport.height || Math.max(320, defaultViewportHeight);

  const [selectedTile, setSelectedTile] = useState<MapTile | null>(null);
  useEffect(() => {
    if (!selectedTile && mapTiles.length > 0) {
      setSelectedTile(mapTiles[0]);
    }
  }, [mapTiles, selectedTile]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    active: false,
    pointerId: 0,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
  });

  const isTileEligibleForCapital = (tile: MapTile | null) => {
    if (!tile) {
      return false;
    }
    return tile.terrain !== "Mountains" && tile.terrain !== "Water" && !tile.structure;
  };

  const getStructureEmoji = (structure?: MapStructure) => {
    if (!structure) {
      return null;
    }
    if (structure.type === "City") {
      return structure.isCapital ? "🏠" : "🏰";
    }
    if (structure.type === "Farm") {
      return "🌾";
    }
    if (structure.type === "Fort") {
      return "🛡️";
    }
    return "🏗️";
  };

  const handleSelect = (tile: MapTile) => {
    setSelectedTile(tile);
    if (needsCapital && isTileEligibleForCapital(tile) && !placeCapitalMutation.isPending) {
      placeCapitalMutation.mutate(tile.id);
    }
  };
  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) {
      return;
    }
    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      startOffset: { ...offset },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (!dragState.current.active) {
      return;
    }

    event.preventDefault();
    const dx = event.clientX - dragState.current.start.x;
    const dy = event.clientY - dragState.current.start.y;

    setOffset({
      x: clamp(dragState.current.startOffset.x - dx, 0, maxDragX),
      y: clamp(dragState.current.startOffset.y - dy, 0, maxDragY),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      event.currentTarget.releasePointerCapture?.(dragState.current.pointerId);
    }
  };

  const selectedUnit = selectedTile?.unit
    ? UNIT_RULES[selectedTile.unit.type]
    : null;
  const selectedStructure = selectedTile?.structure
    ? STRUCTURE_RULES[selectedTile.structure.type]
    : null;
  const selectedTileEligible = isTileEligibleForCapital(selectedTile);
  const columns = gameState?.map?.columns ?? MAP_COLUMNS;
  const rows = gameState?.map?.rows ?? MAP_ROWS;
  const computedMapWidth =
    (columns - 1) * HEX_CONFIG.WIDTH + HEX_CONFIG.WIDTH / 2;
  const computedMapHeight =
    (rows - 1) * HEX_CONFIG.ROW_SPACING_V + HEX_CONFIG.HEIGHT;
  const maxDragX = Math.max(0, computedMapWidth - viewportWidth);
  const maxDragY = Math.max(0, computedMapHeight - viewportHeight);
  useEffect(() => {
    if (offset.x > maxDragX || offset.y > maxDragY) {
      setOffset({
        x: clamp(offset.x, 0, maxDragX),
        y: clamp(offset.y, 0, maxDragY),
      });
    }
  }, [maxDragX, maxDragY, offset.x, offset.y]);

  if (isLoading) {
    return (
      <div className="game">
        <p>{t.loading}</p>
      </div>
    );
  }

  if (isError || !gameState) {
    return (
      <div className="game">
        <p>{t.error}</p>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="game__stats-section">
        <div className="game__stats">
          <div>
            <p className="game__label">{t.turn}</p>
            <strong>{gameState.turn}</strong>
          </div>
          <div>
            <p className="game__label">{t.currentPlayer}</p>
            <strong>{gameState.currentPlayer}</strong>
          </div>
          <div>
            <p className="game__label">{t.population}</p>
            <strong>
              {gameState.population.current} / {gameState.population.cap}
            </strong>
          </div>
        </div>
        {isPlacementPhase ? (
          <div className="game__placement-banner">
            {needsCapital ? t.capitalPlacement.hint : t.capitalPlacement.waiting}
          </div>
        ) : null}
      </div>

      <div className="game__map-container">
        <section
          className="game__map-wrapper"
          ref={mapWrapperRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <div
            className="game__map"
            style={{
              width: computedMapWidth + HEX_CONFIG.WIDTH,
              height: computedMapHeight,
              transform: `translate(${-offset.x}px, ${-offset.y}px)`,
            }}
          >
            {mapTiles.map((tile) => {
              const offsetX =
                tile.x * HEX_CONFIG.WIDTH +
                (tile.y % 2 ? HEX_CONFIG.WIDTH / 2 : 0);
              const offsetY = tile.y * HEX_CONFIG.ROW_SPACING_V;
              const isBlocked = needsCapital && !isTileEligibleForCapital(tile);
              const structureEmoji = getStructureEmoji(tile.structure);
              const tileClasses = ["game__tile"];
              if (selectedTile?.id === tile.id) {
                tileClasses.push("game__tile--selected");
              }
              if (isBlocked) {
                tileClasses.push("game__tile--blocked");
              }

              return (
                <button
                  key={tile.id}
                  type="button"
                  className={tileClasses.join(" ")}
                  onClick={() => handleSelect(tile)}
                  style={{
                    backgroundColor: terrainColor[tile.terrain],
                    width: HEX_CONFIG.WIDTH,
                    height: HEX_CONFIG.HEIGHT,
                    left: offsetX,
                    top: offsetY,
                  }}
                >
                  {structureEmoji ? (
                    <span className="game__tile-structure">{structureEmoji}</span>
                  ) : null}
                  {tile.unit ? (
                    <span className="game__tile-unit">
                      {unitEmoji[tile.unit.type]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <div className="game__overlay game__overlay-bottom">
          <div className="game__info-card">
            {selectedTile ? (
              <>
                <h2>{t.tileInfo}</h2>
                <p className="game__info-terrain">{selectedTile.terrain}</p>
                {needsCapital ? (
                  <p className="game__placement-banner">
                    {selectedTileEligible
                      ? t.capitalPlacement.action
                      : t.capitalPlacement.invalid}
                  </p>
                ) : (
                  <>
                    {selectedStructure ? (
                      <p className="game__info-structure">
                        {t.structures}: {selectedTile.structure?.type}
                        {selectedTile.structure?.isCapital ? ` · ${t.capitalPlacement.capitalLabel}` : ""}
                      </p>
                    ) : null}
                    {selectedUnit ? (
                      <div className="game__unit-details">
                        <h3>{t.unitInfo}</h3>
                        <p>
                          {selectedTile.unit?.owner}: {selectedTile.unit?.type}
                        </p>
                        <ul>
                          <li>
                            {t.attack}: {selectedUnit.baseStats.attack}
                          </li>
                          <li>
                            {t.health}: {selectedUnit.baseStats.health}
                          </li>
                          <li>
                            {t.movement}: {selectedUnit.baseStats.movement}
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <p>{t.selectPrompt}</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p>{needsCapital ? t.capitalPlacement.hint : t.selectPrompt}</p>
            )}
            {waitingForOpponents ? (
              <p className="game__placement-banner">{t.capitalPlacement.waiting}</p>
            ) : null}
          </div>
          <div className="game__actions">
            <Button variant="secondary" disabled={controlsDisabled}>
              {t.actions.attack}
            </Button>
            <Button variant="secondary" disabled={controlsDisabled}>
              {t.actions.build}
            </Button>
            <Button variant="secondary" disabled={controlsDisabled}>
              {t.actions.fortify}
            </Button>
            <Button className="game__end-turn" disabled>
              {controlsDisabled ? t.capitalPlacement.waiting : t.endTurnDisabled}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
