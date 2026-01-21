import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface HandleProps {
  cursor: string;
  position: string;
  handleId: string;
  onPointerDown: (e: React.PointerEvent, handleId: string) => void;
}

function ResizeHandle({
  cursor,
  position,
  handleId,
  onPointerDown,
}: HandleProps) {
  return (
    <div
      className={`absolute z-100 h-4 w-4 rounded-full border-2 border-blue-600 bg-white shadow-md transition-transform hover:scale-125 ${position}`}
      onPointerDown={(e) => onPointerDown(e, handleId)}
      style={{ cursor, pointerEvents: "auto" }}
    />
  );
}

interface ResizeResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

function calculateResize(
  handle: string,
  dx: number,
  dy: number,
  initial: { x: number; y: number; width: number; height: number }
): ResizeResult {
  const minSize = 10;
  let { x, y, width, height } = initial;

  if (handle.includes("e")) {
    width = Math.max(minSize, initial.width + dx);
  } else if (handle.includes("w")) {
    width = Math.max(minSize, initial.width - dx);
    x = initial.x + (initial.width - width);
  }

  if (handle.includes("s")) {
    height = Math.max(minSize, initial.height + dy);
  } else if (handle.includes("n")) {
    height = Math.max(minSize, initial.height - dy);
    y = initial.y + (initial.height - height);
  }

  return { x, y, width, height };
}

interface TransformBoxProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  isSelected: boolean;
  onUpdate: (
    id: string,
    updates: { x?: number; y?: number; width?: number; height?: number }
  ) => void;
  onSelect: (id: string, multi: boolean) => void;
  children: ReactNode;
  zoom: number;
}

export function TransformBox({
  id,
  x,
  y,
  width,
  height,
  rotation,
  locked,
  isSelected,
  onUpdate,
  onSelect,
  children,
  zoom,
}: TransformBoxProps) {
  const [isInteracting, setIsInteracting] = useState(false);

  // Store initial values when drag starts to calculate deltas correctly
  const initialDragState = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
    handle: string | null;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialW: 0,
    initialH: 0,
    handle: null,
  });

  const hasMoved = useRef(false);

  // Refs for current props to avoid stale closures in window event listeners
  const zoomRef = useRef(zoom);
  const onUpdateRef = useRef(onUpdate);
  const onSelectRef = useRef(onSelect);
  const isSelectedRef = useRef(isSelected);

  // Sync refs with props
  useEffect(() => {
    zoomRef.current = zoom;
    onUpdateRef.current = onUpdate;
    onSelectRef.current = onSelect;
    isSelectedRef.current = isSelected;
  }, [zoom, onUpdate, onSelect, isSelected]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (locked) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const isMultiSelect = e.shiftKey || e.metaKey;

    if (isMultiSelect) {
      onSelect(id, true);
    } else if (!isSelected) {
      onSelect(id, false);
    }

    setIsInteracting(true);
    hasMoved.current = false;

    initialDragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: x,
      initialY: y,
      initialW: width,
      initialH: height,
      handle: null,
    };
  };

  const handleResizePointerDown = (e: React.PointerEvent, handle: string) => {
    if (locked) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    onSelect(id, false);
    setIsInteracting(true);
    hasMoved.current = false;

    initialDragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: x,
      initialY: y,
      initialW: width,
      initialH: height,
      handle,
    };
  };

  useEffect(() => {
    if (!isInteracting) {
      return;
    }

    const handleWindowPointerMove = (e: PointerEvent) => {
      e.preventDefault();

      if (!hasMoved.current) {
        hasMoved.current = true;
      }

      const currentZoom = zoomRef.current;
      const dx = (e.clientX - initialDragState.current.startX) / currentZoom;
      const dy = (e.clientY - initialDragState.current.startY) / currentZoom;

      const { initialX, initialY, initialW, initialH, handle } =
        initialDragState.current;
      const updateFn = onUpdateRef.current;

      if (handle) {
        const result = calculateResize(handle, dx, dy, {
          x: initialX,
          y: initialY,
          width: initialW,
          height: initialH,
        });
        updateFn(id, result);
      } else {
        updateFn(id, { x: initialX + dx, y: initialY + dy });
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      setIsInteracting(false);

      const didNotMove = !hasMoved.current;
      const noModifiers = !(e.shiftKey || e.metaKey);
      const wasSelected = isSelectedRef.current;

      if (didNotMove && noModifiers && wasSelected) {
        onSelectRef.current(id, false);
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [isInteracting, id]);

  return (
    <div
      className="group absolute touch-none"
      onPointerDown={handlePointerDown}
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        width,
        height,
        zIndex: "auto",
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      <div
        className={`relative h-full w-full transition-shadow duration-200 ${isSelected ? "rounded-lg shadow-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent" : ""}`}
      >
        {children}

        {isSelected && !locked && (
          <>
            <ResizeHandle
              cursor="nw-resize"
              handleId="nw"
              onPointerDown={handleResizePointerDown}
              position="-top-2 -left-2"
            />
            <ResizeHandle
              cursor="n-resize"
              handleId="n"
              onPointerDown={handleResizePointerDown}
              position="-top-2 left-1/2 -translate-x-1/2"
            />
            <ResizeHandle
              cursor="ne-resize"
              handleId="ne"
              onPointerDown={handleResizePointerDown}
              position="-top-2 -right-2"
            />
            <ResizeHandle
              cursor="e-resize"
              handleId="e"
              onPointerDown={handleResizePointerDown}
              position="top-1/2 -right-2 -translate-y-1/2"
            />
            <ResizeHandle
              cursor="se-resize"
              handleId="se"
              onPointerDown={handleResizePointerDown}
              position="-bottom-2 -right-2"
            />
            <ResizeHandle
              cursor="s-resize"
              handleId="s"
              onPointerDown={handleResizePointerDown}
              position="-bottom-2 left-1/2 -translate-x-1/2"
            />
            <ResizeHandle
              cursor="sw-resize"
              handleId="sw"
              onPointerDown={handleResizePointerDown}
              position="-bottom-2 -left-2"
            />
            <ResizeHandle
              cursor="w-resize"
              handleId="w"
              onPointerDown={handleResizePointerDown}
              position="top-1/2 -left-2 -translate-y-1/2"
            />
          </>
        )}

        {!(isSelected || locked) && (
          <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-blue-400/20 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
