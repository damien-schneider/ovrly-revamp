import type React from "react";
import { useEffect, useRef, useState } from "react";

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
  children: React.ReactNode;
  zoom: number;
}

export const TransformBox: React.FC<TransformBoxProps> = ({
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
}) => {
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
    } else {
      if (!isSelected) {
        onSelect(id, false);
      }
      // If already selected, wait until mouse up to see if it was a click or drag
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
      handle: null, // null means dragging body
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

  // Add/remove window listeners based on interaction state
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
        // Resizing
        let newX = initialX;
        let newY = initialY;
        let newW = initialW;
        let newH = initialH;

        if (handle.includes("e")) {
          newW = Math.max(10, initialW + dx);
        } else if (handle.includes("w")) {
          newW = Math.max(10, initialW - dx);
          newX = initialX + (initialW - newW);
        }

        if (handle.includes("s")) {
          newH = Math.max(10, initialH + dy);
        } else if (handle.includes("n")) {
          newH = Math.max(10, initialH - dy);
          newY = initialY + (initialH - newH);
        }

        updateFn(id, { x: newX, y: newY, width: newW, height: newH });
      } else {
        // Dragging
        updateFn(id, {
          x: initialX + dx,
          y: initialY + dy,
        });
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      setIsInteracting(false);

      // If we didn't move (it was a click) and we didn't use modifiers,
      // and the item was already selected, now we isolate the selection to this item.
      if (
        !(hasMoved.current || e.shiftKey || e.metaKey) &&
        isSelectedRef.current
      ) {
        onSelectRef.current(id, false);
      }
    };

    // Use capture phase to ensure we get the event
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [isInteracting, id]);

  const Handle = ({
    cursor,
    position,
    handleId,
  }: {
    cursor: string;
    position: string;
    handleId: string;
  }) => (
    <div
      className={`absolute z-[100] h-4 w-4 rounded-full border-2 border-blue-600 bg-white shadow-md transition-transform hover:scale-125 ${position}`}
      onPointerDown={(e) => handleResizePointerDown(e, handleId)}
      style={{ cursor, pointerEvents: "auto" }}
    />
  );

  return (
    <div
      className="group absolute touch-none"
      onPointerDown={handlePointerDown}
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        width,
        height,
        zIndex: "auto", // Rely on DOM order for correct parent/child stacking
        pointerEvents: locked ? "none" : "auto",
      }}
    >
      <div
        className={`relative h-full w-full transition-shadow duration-200 ${isSelected ? "rounded-lg shadow-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent" : ""}`}
      >
        {children}

        {isSelected && !locked && (
          <>
            <Handle
              cursor="nw-resize"
              handleId="nw"
              position="-top-2 -left-2"
            />
            <Handle
              cursor="n-resize"
              handleId="n"
              position="-top-2 left-1/2 -translate-x-1/2"
            />
            <Handle
              cursor="ne-resize"
              handleId="ne"
              position="-top-2 -right-2"
            />
            <Handle
              cursor="e-resize"
              handleId="e"
              position="top-1/2 -right-2 -translate-y-1/2"
            />
            <Handle
              cursor="se-resize"
              handleId="se"
              position="-bottom-2 -right-2"
            />
            <Handle
              cursor="s-resize"
              handleId="s"
              position="-bottom-2 left-1/2 -translate-x-1/2"
            />
            <Handle
              cursor="sw-resize"
              handleId="sw"
              position="-bottom-2 -left-2"
            />
            <Handle
              cursor="w-resize"
              handleId="w"
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
};
