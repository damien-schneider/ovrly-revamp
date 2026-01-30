import { useDrag, usePinch, useWheel } from "@use-gesture/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Scan } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  elementsAtom,
  isPanningAtom,
  selectedIdsAtom,
  selectionBoxAtom,
  toolModeAtom,
  viewportAtom,
} from "@/atoms/canvas-atoms";
import type { OverlayElement } from "@/features/canvas/types";
import {
  getEffectiveLayout,
  getRenderSortedElements,
  getRotatedAABB,
} from "../lib/canvas-utils";
import { ElementRenderer } from "../widgets/ElementRenderer";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { TransformBox } from "./TransformBox";

const CLICK_MOVEMENT_THRESHOLD = 3; // pixels

interface CanvasProps {
  onUpdateElement: (id: string, updates: Partial<OverlayElement>) => void;
}

export function Canvas({ onUpdateElement }: CanvasProps) {
  const elements = useAtomValue(elementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [viewport, setViewport] = useAtom(viewportAtom);
  const toolMode = useAtomValue(toolModeAtom);
  const [selectionBox, setSelectionBox] = useAtom(selectionBoxAtom);
  const setIsPanning = useSetAtom(isPanningAtom);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isHandTool = toolMode === "hand";
  const { scale, position } = viewport;

  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartSelectedIds = useRef<string[]>([]);
  const canvasPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const canvasPointerMovedRef = useRef(false);

  const handleSelect = useCallback(
    (id: string, multi: boolean) => {
      if (multi) {
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
      } else {
        setSelectedIds([id]);
      }
    },
    [setSelectedIds]
  );

  const updateSelectionFromBox = useCallback(
    (startX: number, startY: number, currentX: number, currentY: number) => {
      const boxLeft = Math.min(startX, currentX);
      const boxTop = Math.min(startY, currentY);
      const boxWidth = Math.abs(currentX - startX);
      const boxHeight = Math.abs(currentY - startY);

      if (boxWidth < 3 && boxHeight < 3) {
        return;
      }

      const worldLeft = (boxLeft - position.x) / scale;
      const worldTop = (boxTop - position.y) / scale;
      const worldRight = worldLeft + boxWidth / scale;
      const worldBottom = worldTop + boxHeight / scale;

      const intersectingIds = elements
        .filter((el) => {
          if (!el.visible || el.locked) {
            return false;
          }
          // Use effective layout for fill mode elements
          const layout = getEffectiveLayout(el, elements);
          const effectiveEl = { ...el, ...layout };
          const bounds = getRotatedAABB(effectiveEl);
          return (
            worldLeft < bounds.maxX &&
            worldRight > bounds.minX &&
            worldTop < bounds.maxY &&
            worldBottom > bounds.minY
          );
        })
        .map((el) => el.id);

      if (selectionStartSelectedIds.current.length > 0) {
        const combined = Array.from(
          new Set([...selectionStartSelectedIds.current, ...intersectingIds])
        );
        setSelectedIds(combined);
      } else {
        setSelectedIds(intersectingIds);
      }
    },
    [elements, position.x, position.y, scale, setSelectedIds]
  );

  const fitToView = useCallback(() => {
    if (elements.length === 0) {
      setViewport({
        scale: 1,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
      return;
    }

    const padding = 100;
    // Use effective layouts for fill mode elements
    const layouts = elements.map((e) => getEffectiveLayout(e, elements));
    const minX = Math.min(...layouts.map((l) => l.x));
    const minY = Math.min(...layouts.map((l) => l.y));
    const maxX = Math.max(...layouts.map((l) => l.x + l.width));
    const maxY = Math.max(...layouts.map((l) => l.y + l.height));

    const width = maxX - minX;
    const height = maxY - minY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleX = (vw - padding * 2) / width;
    const scaleY = (vh - padding * 2) / height;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 2);

    const worldCenterX = minX + width / 2;
    const worldCenterY = minY + height / 2;
    const newX = vw / 2 - worldCenterX * newScale;
    const newY = vh / 2 - worldCenterY * newScale;

    setViewport({ scale: newScale, position: { x: newX, y: newY } });
  }, [elements, setViewport]);

  const trackPointerMovement = useCallback((event: PointerEvent) => {
    if (canvasPointerStartRef.current) {
      const dx = Math.abs(event.clientX - canvasPointerStartRef.current.x);
      const dy = Math.abs(event.clientY - canvasPointerStartRef.current.y);
      if (dx > CLICK_MOVEMENT_THRESHOLD || dy > CLICK_MOVEMENT_THRESHOLD) {
        canvasPointerMovedRef.current = true;
      }
    }
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only handle left button on canvas background
    if (e.button !== 0) {
      return;
    }

    const target = e.target as HTMLElement;
    const isCanvasArea =
      target.classList.contains("canvas-area") ||
      target.classList.contains("canvas-content");

    if (isCanvasArea) {
      canvasPointerStartRef.current = { x: e.clientX, y: e.clientY };
      canvasPointerMovedRef.current = false;
    }
  };

  const handleCanvasPointerUp = () => {
    if (!canvasPointerStartRef.current) {
      return;
    }

    // Check if this was a click (minimal movement)
    const isClick = !canvasPointerMovedRef.current;

    // Reset tracking state
    canvasPointerStartRef.current = null;
    canvasPointerMovedRef.current = false;

    // If pointer down was on canvas and no movement occurred, clear selection
    if (isClick && selectedIds.length > 0) {
      setSelectedIds([]);
    }
  };

  useWheel(
    ({ event, delta: [dx, dy], ctrlKey, metaKey }) => {
      event.preventDefault();

      if (ctrlKey || metaKey) {
        const zoomFactor = 1 - dy * 0.01;
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 3);
        const rect = canvasRef.current?.getBoundingClientRect();

        if (rect) {
          const cursorX = event.clientX - rect.left;
          const cursorY = event.clientY - rect.top;
          const worldX = (cursorX - position.x) / scale;
          const worldY = (cursorY - position.y) / scale;
          const newPosX = cursorX - worldX * newScale;
          const newPosY = cursorY - worldY * newScale;
          setViewport({
            scale: newScale,
            position: { x: newPosX, y: newPosY },
          });
        } else {
          setViewport((prev) => ({ ...prev, scale: newScale }));
        }
      } else {
        setViewport((prev) => ({
          ...prev,
          position: { x: prev.position.x - dx, y: prev.position.y - dy },
        }));
      }
    },
    { target: canvasRef, eventOptions: { passive: false } }
  );

  usePinch(
    ({ event, offset: [d], origin: [ox, oy] }) => {
      event?.preventDefault();
      const newScale = Math.min(Math.max(d, 0.1), 3);
      const rect = canvasRef.current?.getBoundingClientRect();

      if (rect) {
        const cursorX = ox - rect.left;
        const cursorY = oy - rect.top;
        const worldX = (cursorX - position.x) / scale;
        const worldY = (cursorY - position.y) / scale;
        const newPosX = cursorX - worldX * newScale;
        const newPosY = cursorY - worldY * newScale;
        setViewport({ scale: newScale, position: { x: newPosX, y: newPosY } });
      }
    },
    {
      target: canvasRef,
      eventOptions: { passive: false },
      scaleBounds: { min: 0.1, max: 3 },
      from: () => [scale, 0],
    }
  );

  const bindDrag = useDrag(
    ({ event, delta: [dx, dy], first, last, xy: [x, y], target }) => {
      const targetEl = target as HTMLElement;
      const isCanvasArea =
        targetEl.classList.contains("canvas-area") ||
        targetEl.classList.contains("canvas-content");

      if (!isCanvasArea) {
        return;
      }

      if (first) {
        if (isHandTool) {
          setIsPanning(true);
        } else {
          const pointerEvent = event as PointerEvent;
          const isMultiSelect = pointerEvent.shiftKey || pointerEvent.metaKey;

          if (isMultiSelect) {
            selectionStartSelectedIds.current = selectedIds;
          } else {
            setSelectedIds([]);
            selectionStartSelectedIds.current = [];
          }

          selectionStartRef.current = { x, y };
          setIsSelecting(true);
          setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
        }
        return;
      }

      // Track movement for click detection
      trackPointerMovement(event as PointerEvent);

      if (isHandTool) {
        setViewport((prev) => ({
          ...prev,
          position: { x: prev.position.x + dx, y: prev.position.y + dy },
        }));
      } else if (isSelecting && selectionStartRef.current) {
        setSelectionBox({
          startX: selectionStartRef.current.x,
          startY: selectionStartRef.current.y,
          currentX: x,
          currentY: y,
        });
        updateSelectionFromBox(
          selectionStartRef.current.x,
          selectionStartRef.current.y,
          x,
          y
        );
      }

      if (last) {
        setIsPanning(false);
        setIsSelecting(false);
        setSelectionBox(null);
        selectionStartRef.current = null;
      }
    },
    { filterTaps: true, pointer: { buttons: [1] } }
  );

  return (
    <CanvasContextMenu selectedIds={selectedIds}>
      <div
        onPointerDownCapture={handleCanvasPointerDown}
        onPointerUpCapture={handleCanvasPointerUp}
        ref={canvasRef}
        {...bindDrag()}
        className={`canvas-area relative h-full w-full overflow-hidden outline-none ${
          isHandTool ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        style={{
          backgroundColor: "var(--background)",
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
          touchAction: "none",
        }}
      >
        <div
          className="canvas-content absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {getRenderSortedElements(elements).map((el) => {
            // Calculate effective layout based on fill modes
            const layout = getEffectiveLayout(el, elements);

            return (
              <TransformBox
                height={layout.height}
                id={el.id}
                isSelected={selectedIds.includes(el.id)}
                key={el.id}
                locked={el.locked}
                onSelect={handleSelect}
                onUpdate={onUpdateElement}
                rotation={el.rotation}
                width={layout.width}
                x={layout.x}
                y={layout.y}
                zoom={scale}
              >
                <ElementRenderer element={el} />
              </TransformBox>
            );
          })}
        </div>

        {selectionBox && (
          <div
            className="pointer-events-none fixed z-[1000] border-2 border-blue-500 bg-blue-500/10"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
            }}
          />
        )}

        <div className="absolute bottom-6 left-1/2 z-90 flex -translate-x-1/2 items-center gap-2">
          <button
            className="rounded-full border border-border bg-background/80 p-2 text-muted-foreground shadow-lg backdrop-blur-md transition-all hover:bg-accent hover:text-foreground"
            onClick={fitToView}
            title="Fit to Layers"
            type="button"
          >
            <Scan size={16} />
          </button>
          <div className="min-w-15 rounded-full border border-border bg-background/80 px-4 py-2 text-center font-bold text-[11px] text-muted-foreground shadow-lg backdrop-blur-md">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>
    </CanvasContextMenu>
  );
}
