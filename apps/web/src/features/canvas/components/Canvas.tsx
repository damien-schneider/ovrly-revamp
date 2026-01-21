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
import { ElementRenderer } from "../widgets/ElementRenderer";
import { TransformBox } from "./TransformBox";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getRenderSortedElements(elements: OverlayElement[]) {
  const childrenMap = new Map<string, OverlayElement[]>();

  for (const el of elements) {
    const pid = el.parentId || "root";
    if (!childrenMap.has(pid)) {
      childrenMap.set(pid, []);
    }
    childrenMap.get(pid)?.push(el);
  }

  const result: OverlayElement[] = [];

  const traverse = (parentId: string) => {
    const siblings = childrenMap.get(parentId) || [];
    siblings.sort((a, b) => a.zIndex - b.zIndex);

    for (const el of siblings) {
      result.push(el);
      traverse(el.id);
    }
  };

  traverse("root");
  return result;
}

function getRotatedAABB(el: OverlayElement) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = el.width / 2;
  const hh = el.height / 2;

  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  const rx = corners.map((p) => cx + (p.x * cos - p.y * sin));
  const ry = corners.map((p) => cy + (p.x * sin + p.y * cos));

  return {
    minX: Math.min(...rx),
    maxX: Math.max(...rx),
    minY: Math.min(...ry),
    maxY: Math.max(...ry),
  };
}

// ============================================================================
// CANVAS COMPONENT
// ============================================================================

interface CanvasProps {
  onUpdateElement: (id: string, updates: Partial<OverlayElement>) => void;
  projectId?: string;
}

export function Canvas({ onUpdateElement, projectId }: CanvasProps) {
  const elements = useAtomValue(elementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [viewport, setViewport] = useAtom(viewportAtom);
  const toolMode = useAtomValue(toolModeAtom);
  const [selectionBox, setSelectionBox] = useAtom(selectionBoxAtom);
  const setIsPanning = useSetAtom(isPanningAtom);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isHandTool = toolMode === "hand";
  const { scale, position } = viewport;

  // Track selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionStartSelectedIds = useRef<string[]>([]);

  // ============================================================================
  // ELEMENT SELECTION
  // ============================================================================

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

  // ============================================================================
  // MARQUEE SELECTION LOGIC
  // ============================================================================

  const updateSelectionFromBox = useCallback(
    (startX: number, startY: number, currentX: number, currentY: number) => {
      const boxLeft = Math.min(startX, currentX);
      const boxTop = Math.min(startY, currentY);
      const boxWidth = Math.abs(currentX - startX);
      const boxHeight = Math.abs(currentY - startY);

      // Ignore micro-movements
      if (boxWidth < 3 && boxHeight < 3) {
        return;
      }

      // Convert screen coords to world coords
      const worldLeft = (boxLeft - position.x) / scale;
      const worldTop = (boxTop - position.y) / scale;
      const worldRight = worldLeft + boxWidth / scale;
      const worldBottom = worldTop + boxHeight / scale;

      const intersectingIds = elements
        .filter((el) => {
          if (!el.visible || el.locked) {
            return false;
          }
          const bounds = getRotatedAABB(el);
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

  // ============================================================================
  // FIT TO VIEW
  // ============================================================================

  const fitToView = useCallback(() => {
    if (elements.length === 0) {
      setViewport({
        scale: 1,
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
      return;
    }

    const padding = 100;
    const minX = Math.min(...elements.map((e) => e.x));
    const minY = Math.min(...elements.map((e) => e.y));
    const maxX = Math.max(...elements.map((e) => e.x + e.width));
    const maxY = Math.max(...elements.map((e) => e.y + e.height));

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

  // ============================================================================
  // WHEEL GESTURE: Pan with scroll, Zoom with Ctrl/Cmd+scroll
  // ============================================================================

  useWheel(
    ({ event, delta: [dx, dy], ctrlKey, metaKey }) => {
      event.preventDefault();

      if (ctrlKey || metaKey) {
        // Pinch-to-zoom or Ctrl+scroll = zoom
        const zoomFactor = 1 - dy * 0.01;
        const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 3);

        // Zoom towards cursor position
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
        // Regular scroll = pan
        setViewport((prev) => ({
          ...prev,
          position: {
            x: prev.position.x - dx,
            y: prev.position.y - dy,
          },
        }));
      }
    },
    {
      target: canvasRef,
      eventOptions: { passive: false },
    }
  );

  // ============================================================================
  // PINCH GESTURE: Zoom with two-finger pinch
  // ============================================================================

  usePinch(
    ({ event, offset: [d], origin: [ox, oy] }) => {
      event?.preventDefault();

      const newScale = Math.min(Math.max(d, 0.1), 3);

      // Zoom towards pinch center
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

  // ============================================================================
  // DRAG GESTURE: Pan with hand tool OR marquee selection with select tool
  // ============================================================================

  const bindDrag = useDrag(
    ({ event, delta: [dx, dy], first, last, xy: [x, y], target }) => {
      const targetEl = target as HTMLElement;
      const isCanvasArea =
        targetEl.classList.contains("canvas-area") ||
        targetEl.classList.contains("canvas-content");

      // Only handle drags on canvas area, not on elements
      if (!isCanvasArea) {
        return;
      }

      if (first) {
        if (isHandTool) {
          setIsPanning(true);
        } else {
          // Select tool: start marquee selection
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
          setSelectionBox({
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
          });
        }
        return;
      }

      if (isHandTool) {
        // Hand tool: pan the canvas
        setViewport((prev) => ({
          ...prev,
          position: {
            x: prev.position.x + dx,
            y: prev.position.y + dy,
          },
        }));
      } else if (isSelecting && selectionStartRef.current) {
        // Select tool: update marquee selection
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
    {
      filterTaps: true,
      pointer: { buttons: [1] }, // Left mouse button only
    }
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={canvasRef}
      {...bindDrag()}
      className={`canvas-area relative h-full w-full overflow-hidden outline-none ${
        isHandTool ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: `${20 * scale}px ${20 * scale}px`,
        backgroundPosition: `${position.x}px ${position.y}px`,
        touchAction: "none",
      }}
    >
      {/* Transformed canvas content */}
      <div
        className="canvas-content absolute"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {getRenderSortedElements(elements).map((el) => (
          <TransformBox
            height={el.height}
            id={el.id}
            isSelected={selectedIds.includes(el.id)}
            key={el.id}
            locked={el.locked}
            onSelect={handleSelect}
            onUpdate={onUpdateElement}
            rotation={el.rotation}
            width={el.width}
            x={el.x}
            y={el.y}
            zoom={scale}
          >
            <ElementRenderer element={el} projectId={projectId} />
          </TransformBox>
        ))}
      </div>

      {/* Selection Marquee Box */}
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

      {/* Zoom & Fit Controls */}
      <div className="absolute bottom-6 left-1/2 z-90 flex -translate-x-1/2 items-center gap-2">
        <button
          className="rounded-full border border-gray-200 bg-white/80 p-2 text-gray-500 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:text-gray-900"
          onClick={fitToView}
          title="Fit to Layers"
          type="button"
        >
          <Scan size={16} />
        </button>
        <div className="min-w-15 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-center font-bold text-[11px] text-gray-500 shadow-lg backdrop-blur-md">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
