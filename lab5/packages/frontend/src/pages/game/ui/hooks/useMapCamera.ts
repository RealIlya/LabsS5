import { useEffect, useRef, useState } from "react";

interface UseMapCameraProps {
  mapPixelWidth: number;
  mapPixelHeight: number;
  overscroll: number;
  minZoom?: number;
  maxZoom?: number;
}

export function useMapCamera({
  mapPixelWidth,
  mapPixelHeight,
  overscroll,
  minZoom = 0.5,
  maxZoom = 3,
}: UseMapCameraProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    active: false,
    pointerId: 0,
    start: { x: 0, y: 0 },
    startOffset: { x: 0, y: 0 },
  });

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

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
    if (viewportSize.width > 0 && offset.x === 0 && offset.y === 0) {
      setOffset({
        x: Math.max(0, (mapPixelWidth * zoom - viewportSize.width) / 2),
        y: Math.max(0, (mapPixelHeight * zoom - viewportSize.height) / 2),
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
    const isMiddleButton = e.button === 1;
    const isSpacePan = e.button === 0 && spacePressed;
    if (!isMiddleButton && !isSpacePan) return;
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
    if (!dragState.current.active) return;
    e.preventDefault();
    const dx = e.clientX - dragState.current.start.x;
    const dy = e.clientY - dragState.current.start.y;

    const scaledWidth = mapPixelWidth * zoom;
    const scaledHeight = mapPixelHeight * zoom;
    const maxDragX = Math.max(0, scaledWidth - viewportSize.width + overscroll);
    const maxDragY = Math.max(
      0,
      scaledHeight - viewportSize.height + overscroll
    );

    setOffset({
      x: clamp(dragState.current.startOffset.x - dx, -overscroll, maxDragX),
      y: clamp(dragState.current.startOffset.y - dy, -overscroll, maxDragY),
    });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (dragState.current.active) {
      dragState.current.active = false;
      setIsDragging(false);
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
      const nextZoom = clamp(prevZoom - delta * 0.0005, minZoom, maxZoom);
      if (nextZoom === prevZoom) return prevZoom;
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

  return {
    viewportRef,
    viewportSize,
    offset,
    zoom,
    handlePointerDown,
    handlePointerMove,
    endDrag,
    handleWheel,
    spacePressed,
    isDragging,
  };
}
