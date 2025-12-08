import { useEffect, useRef, useState } from "react";

interface UseMapCameraProps {
  mapPixelWidth: number;
  mapPixelHeight: number;
  overscroll: number;
  minZoom?: number;
  maxZoom?: number;
  stepZoom?: number;
}

export function useMapCamera({
  mapPixelWidth,
  mapPixelHeight,
  overscroll,
  minZoom = 0.5,
  maxZoom = 1,
  stepZoom = 0.0002,
}: UseMapCameraProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinchState = useRef<{
    active: boolean;
    startDistance: number;
    startZoom: number;
    center: { x: number; y: number };
  }>({
    active: false,
    startDistance: 0,
    startZoom: 1,
    center: { x: 0, y: 0 },
  });
  const dragState = useRef({
    active: false,
    pointerId: 0,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
  });

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const getBounds = (scaledWidth: number, scaledHeight: number) => {
    const { width: vw, height: vh } = viewportSize;
    const centerX = (scaledWidth - vw) / 2;
    const centerY = (scaledHeight - vh) / 2;

    const minX = scaledWidth <= vw ? centerX - overscroll : -overscroll;
    const maxX =
      scaledWidth <= vw ? centerX + overscroll : scaledWidth - vw + overscroll;

    const minY = scaledHeight <= vh ? centerY - overscroll : -overscroll;
    const maxY =
      scaledHeight <= vh
        ? centerY + overscroll
        : scaledHeight - vh + overscroll;

    return { minX, maxX, minY, maxY, centerX, centerY };
  };

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  useEffect(() => {
    if (
      viewportSize.width > 0 &&
      viewportSize.height > 0 &&
      offset.x === 0 &&
      offset.y === 0
    ) {
      const scaledWidth = mapPixelWidth * zoom;
      const scaledHeight = mapPixelHeight * zoom;
      const { minX, maxX, minY, maxY, centerX, centerY } = getBounds(
        scaledWidth,
        scaledHeight
      );
      setOffset({
        x: clamp(centerX, minX, maxX),
        y: clamp(centerY, minY, maxY),
      });
    }
  }, [
    viewportSize.width,
    viewportSize.height,
    mapPixelWidth,
    mapPixelHeight,
    zoom,
  ]);

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const isTouch = e.pointerType === "touch";
    const isMiddleButton = e.button === 1;
    const isSpacePan = e.button === 0 && spacePressed;
    // На тач-устройствах разрешаем панорамирование одним пальцем,
    // на десктопе — средней кнопкой или удержанием пробела + ЛКМ.
    if (!isTouch && !isMiddleButton && !isSpacePan) return;

    // Регистрируем палец для pinch-zoom
    if (isTouch) {
      touchPoints.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPoints.current.size === 2) {
        const points = Array.from(touchPoints.current.values());
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        const distance = Math.hypot(dx, dy);
        const center = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
        pinchState.current = {
          active: true,
          startDistance: distance,
          startZoom: zoom,
          center,
        };
        dragState.current.active = false;
        setIsDragging(false);
      }
    }

    setIsDragging(true);
    dragState.current = {
      active: true,
      pointerId: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      startOffset: { ...offset },
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerType === "touch") {
      touchPoints.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Pinch-zoom, когда два пальца
      if (pinchState.current.active && touchPoints.current.size >= 2) {
        e.preventDefault();
        const points = Array.from(touchPoints.current.values()).slice(0, 2);
        const dx = points[0].x - points[1].x;
        const dy = points[0].y - points[1].y;
        const distance = Math.hypot(dx, dy);
        if (pinchState.current.startDistance > 0) {
          const prevZoom = zoom;
          const nextZoom = clamp(
            (pinchState.current.startZoom * distance) /
              pinchState.current.startDistance,
            minZoom,
            maxZoom
          );
          const centerX = (points[0].x + points[1].x) / 2;
          const centerY = (points[0].y + points[1].y) / 2;
          const ratio = nextZoom / prevZoom;
          setOffset((prevOffset) => {
            const nextWidth = mapPixelWidth * nextZoom;
            const nextHeight = mapPixelHeight * nextZoom;
            const { minX, maxX, minY, maxY } = getBounds(nextWidth, nextHeight);
            const newOffsetX = (prevOffset.x + centerX) * ratio - centerX;
            const newOffsetY = (prevOffset.y + centerY) * ratio - centerY;
            return {
              x: clamp(newOffsetX, minX, maxX),
              y: clamp(newOffsetY, minY, maxY),
            };
          });
          setZoom(nextZoom);
        }
        return;
      }
    }

    if (!dragState.current.active) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.start.x;
    const dy = e.clientY - dragState.current.start.y;

    const scaledWidth = mapPixelWidth * zoom;
    const scaledHeight = mapPixelHeight * zoom;
    const { minX, maxX, minY, maxY } = getBounds(scaledWidth, scaledHeight);

    setOffset({
      x: clamp(dragState.current.startOffset.x - dx, minX, maxX),
      y: clamp(dragState.current.startOffset.y - dy, minY, maxY),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      setIsDragging(false);
      e.currentTarget.releasePointerCapture?.(dragState.current.pointerId);
    }
    if (e.pointerType === "touch") {
      touchPoints.current.delete(e.pointerId);
      if (touchPoints.current.size < 2) {
        pinchState.current.active = false;
      }
    }
  };

  const handleWheel: React.WheelEventHandler<HTMLElement> = (event) => {
    event.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const cursorX = rect ? event.clientX - rect.left : viewportSize.width / 2;
    const cursorY = rect ? event.clientY - rect.top : viewportSize.height / 2;
    const delta = event.deltaY;
    setZoom((prevZoom) => {
      const nextZoom = clamp(prevZoom - delta * stepZoom, minZoom, maxZoom);
      if (nextZoom === prevZoom) return prevZoom;
      const ratio = nextZoom / prevZoom;
      setOffset((prevOffset) => {
        const nextWidth = mapPixelWidth * nextZoom;
        const nextHeight = mapPixelHeight * nextZoom;
        const { minX, maxX, minY, maxY } = getBounds(nextWidth, nextHeight);
        const newOffsetX = (prevOffset.x + cursorX) * ratio - cursorX;
        const newOffsetY = (prevOffset.y + cursorY) * ratio - cursorY;
        return {
          x: clamp(newOffsetX, minX, maxX),
          y: clamp(newOffsetY, minY, maxY),
        };
      });
      return nextZoom;
    });
  };

  const centerOn = (worldX: number, worldY: number) => {
    const scaledWidth = mapPixelWidth * zoom;
    const scaledHeight = mapPixelHeight * zoom;
    const { minX, maxX, minY, maxY } = getBounds(scaledWidth, scaledHeight);
    const targetX = worldX * zoom - viewportSize.width / 2;
    const targetY = worldY * zoom - viewportSize.height / 2;
    setOffset({
      x: clamp(targetX, minX, maxX),
      y: clamp(targetY, minY, maxY),
    });
  };

  return {
    viewportRef,
    viewportSize,
    offset,
    zoom,
    centerOn,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleWheel,
    spacePressed,
    isDragging,
  };
}
