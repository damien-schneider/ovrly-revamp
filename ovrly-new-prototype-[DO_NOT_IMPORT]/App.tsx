import { Scan } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayersPanel } from "./components/LayersPanel";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Toolbar } from "./components/Toolbar";
import { TransformBox } from "./components/TransformBox";
import { ElementRenderer } from "./components/Widgets";
import {
  type BoxElement,
  type ChatElement,
  ElementType,
  type EmoteWallElement,
  type ImageElement,
  type OverlayContainerElement,
  type OverlayElement,
  type ProgressBarElement,
  type TextElement,
  type TimerElement,
  type WebcamElement,
} from "./types";
import { generateOBSHtml } from "./utils/exportGenerator";
import {
  type HistoryState,
  initialHistory,
  pushToHistory,
  redo,
  undo,
} from "./utils/history";

// Sort elements hierarchically: Parents first, then children (so children are on top)
const getRenderSortedElements = (elements: OverlayElement[]) => {
  const childrenMap = new Map<string, OverlayElement[]>();

  // Group by parent
  elements.forEach((el) => {
    const pid = el.parentId || "root";
    if (!childrenMap.has(pid)) {
      childrenMap.set(pid, []);
    }
    childrenMap.get(pid)?.push(el);
  });

  const result: OverlayElement[] = [];

  const traverse = (parentId: string) => {
    const siblings = childrenMap.get(parentId) || [];
    // Sort by zIndex ASC for rendering (Painter's algo)
    siblings.sort((a, b) => a.zIndex - b.zIndex);

    siblings.forEach((el) => {
      result.push(el); // Render parent
      traverse(el.id); // Render children (on top of parent)
    });
  };

  traverse("root");
  return result;
};

// Helper to get Axis Aligned Bounding Box of a potentially rotated element for hit testing
const getRotatedAABB = (el: OverlayElement) => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = el.width / 2;
  const hh = el.height / 2;

  // Corners relative to center
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  // Rotate and translate corners to world space
  const rx = corners.map((p) => cx + (p.x * cos - p.y * sin));
  const ry = corners.map((p) => cy + (p.x * sin + p.y * cos));

  return {
    minX: Math.min(...rx),
    maxX: Math.max(...rx),
    minY: Math.min(...ry),
    maxY: Math.max(...ry),
  };
};

export default function App() {
  const [history, setHistory] = useState<HistoryState>(initialHistory);
  const elements = history.present;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Viewport
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isHandTool, setIsHandTool] = useState(false);

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const selectionStartSelectedIds = useRef<string[]>([]);

  // Layout State
  const [isLayersCollapsed, setIsLayersCollapsed] = useState(false);
  const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Initialize view center
  useEffect(() => {
    setPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
  }, []);

  // Auto-collapse right sidebar when selection is empty
  useEffect(() => {
    setIsPropertiesCollapsed(selectedIds.length === 0);
  }, [selectedIds]);

  // Undo/Redo Wrappers
  const updateState = (newElements: OverlayElement[]) => {
    setHistory((prev) => pushToHistory(prev, newElements));
  };

  const handleUndo = useCallback(() => setHistory((prev) => undo(prev)), []);
  const handleRedo = useCallback(() => setHistory((prev) => redo(prev)), []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if (e.key === "h") {
        setIsHandTool(true);
      }
      if (e.key === "v") {
        setIsHandTool(false);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIds.length > 0
      ) {
        const newElements = elements.filter(
          (el) => !selectedIds.includes(el.id)
        );
        updateState(newElements);
        setSelectedIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [elements, handleRedo, handleUndo, selectedIds, updateState]);

  const addElement = (type: ElementType) => {
    const id = crypto.randomUUID();

    // Spawn in center of view
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const worldX = (viewportCenterX - position.x) / scale;
    const worldY = (viewportCenterY - position.y) / scale;

    const maxZ = Math.max(0, ...elements.map((e) => e.zIndex));

    const base = {
      id,
      name: `${type.charAt(0) + type.slice(1).toLowerCase()} ${elements.filter((e) => e.type === type).length + 1}`,
      x: worldX - 100,
      y: worldY - 100,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 1,
      zIndex: maxZ + 1,
      locked: false,
      visible: true,
      parentId: null,
    };

    let newElement: OverlayElement | null = null;

    switch (type) {
      case ElementType.OVERLAY:
        newElement = {
          ...base,
          type: ElementType.OVERLAY,
          width: 1280,
          height: 720,
          x: worldX - 640,
          y: worldY - 360,
          backgroundColor: "rgba(255,255,255,0.1)",
          name: `Overlay ${elements.filter((e) => e.type === ElementType.OVERLAY).length + 1}`,
        } as OverlayContainerElement;
        break;
      case ElementType.TEXT:
        newElement = {
          ...base,
          type: ElementType.TEXT,
          width: 300,
          height: 80,
          x: worldX - 150,
          y: worldY - 40,
          content: "New Text Layer",
          fontFamily: "Inter",
          fontSize: 48,
          color: "#111827",
          fontWeight: "bold",
          textAlign: "left",
        } as TextElement;
        break;
      case ElementType.BOX:
        newElement = {
          ...base,
          type: ElementType.BOX,
          backgroundColor: "#3b82f6",
          borderColor: "#1d4ed8",
          borderWidth: 0,
          borderRadius: 16,
        } as BoxElement;
        break;
      case ElementType.IMAGE:
        newElement = {
          ...base,
          type: ElementType.IMAGE,
          src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400",
          objectFit: "cover",
        } as ImageElement;
        break;
      case ElementType.CHAT:
        newElement = {
          ...base,
          type: ElementType.CHAT,
          width: 400,
          height: 500,
          x: worldX - 200,
          y: worldY - 250,
          style: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            textColor: "#ffffff",
            fontFamily: "Inter",
            fontSize: 14,
            borderRadius: 12,
            messageSpacing: 8,
            showAvatars: true,
            usernameColor: "#a855f7",
            animation: "slide",
          },
          mockMessages: [
            {
              user: "StreamFan",
              text: "This looks amazing!",
              color: "#ff5555",
            },
            { user: "ModBot", text: "Enjoy the stream.", color: "#55ff55" },
          ],
        } as ChatElement;
        break;
      case ElementType.EMOTE_WALL:
        newElement = {
          ...base,
          type: ElementType.EMOTE_WALL,
          density: 5,
          speed: 1,
          direction: "up",
          width: 400,
          height: 400,
          x: worldX - 200,
          y: worldY - 200,
        } as EmoteWallElement;
        break;
      case ElementType.WEBCAM:
        newElement = {
          ...base,
          type: ElementType.WEBCAM,
          width: 480,
          height: 270,
          x: worldX - 240,
          y: worldY - 135,
          borderColor: "#ffffff",
          borderWidth: 4,
          borderRadius: 12,
          shape: "rectangle",
          shadowColor: "rgba(0,0,0,0.5)",
          shadowBlur: 20,
        } as WebcamElement;
        break;
      case ElementType.TIMER:
        newElement = {
          ...base,
          type: ElementType.TIMER,
          width: 240,
          height: 80,
          x: worldX - 120,
          y: worldY - 40,
          mode: "countdown",
          targetDate: new Date(Date.now() + 600_000).toISOString(),
          fontFamily: "Inter",
          fontSize: 64,
          color: "#111827",
        } as TimerElement;
        break;
      case ElementType.PROGRESS:
        newElement = {
          ...base,
          type: ElementType.PROGRESS,
          width: 400,
          height: 32,
          x: worldX - 200,
          y: worldY - 16,
          progress: 75,
          barColor: "#3b82f6",
          backgroundColor: "#e2e8f0",
          borderRadius: 16,
        } as ProgressBarElement;
        break;
    }

    if (newElement) {
      updateState([...elements, newElement]);
      setSelectedIds([id]);
      setIsHandTool(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<OverlayElement>) => {
    const originalEl = elements.find((e) => e.id === id);
    if (!originalEl) {
      return;
    }

    // 1. Calculate Delta from the primary interaction (usually mouse drag)
    const dx = updates.x !== undefined ? updates.x - originalEl.x : 0;
    const dy = updates.y !== undefined ? updates.y - originalEl.y : 0;
    const isTranslation = dx !== 0 || dy !== 0;

    // 2. Determine which elements to modify (Group Move Logic)
    let idsToUpdate = [id];

    // If dragging a selected item, move all selected items
    if (isTranslation && selectedIds.includes(id)) {
      idsToUpdate = [...selectedIds];
    }

    // Filter out children if their parent is also being updated (prevent double move)
    // because we have descendant propagation logic below
    const independentIdsToUpdate = idsToUpdate.filter((targetId) => {
      const target = elements.find((e) => e.id === targetId);
      return !(target?.parentId && idsToUpdate.includes(target.parentId));
    });

    let finalElements = [...elements];

    // 3. Apply updates to the independent roots
    independentIdsToUpdate.forEach((targetId) => {
      const isPrimary = targetId === id;
      const el = finalElements.find((e) => e.id === targetId)!;

      let newProperties: Partial<OverlayElement> = {};

      if (isPrimary) {
        newProperties = { ...updates };
      } else {
        // Secondary items only get the translation delta
        newProperties = { x: el.x + dx, y: el.y + dy };
      }

      // Reparenting Check (Only for the primary element for now to keep behavior predictable)
      if (
        isPrimary &&
        (newProperties.x !== undefined || newProperties.y !== undefined) &&
        el.type !== ElementType.OVERLAY
      ) {
        const cx =
          (newProperties.x ?? el.x) + (newProperties.width ?? el.width) / 2;
        const cy =
          (newProperties.y ?? el.y) + (newProperties.height ?? el.height) / 2;

        const parent = finalElements
          .filter((e) => e.type === ElementType.OVERLAY && e.id !== targetId)
          .sort((a, b) => b.zIndex - a.zIndex)
          .find(
            (p) =>
              cx >= p.x &&
              cx <= p.x + p.width &&
              cy >= p.y &&
              cy <= p.y + p.height
          );
        newProperties.parentId = parent ? parent.id : null;
      }

      // Apply changes to the target element
      finalElements = finalElements.map((e) =>
        e.id === targetId ? { ...e, ...newProperties } : e
      );

      // Propagate movement to descendants
      if (newProperties.x !== undefined || newProperties.y !== undefined) {
        const moveDx = (newProperties.x ?? el.x) - el.x;
        const moveDy = (newProperties.y ?? el.y) - el.y;

        if (moveDx !== 0 || moveDy !== 0) {
          const getDescendants = (pid: string): string[] => {
            const children = finalElements.filter((e) => e.parentId === pid);
            return children.reduce(
              (acc, child) => [...acc, child.id, ...getDescendants(child.id)],
              [] as string[]
            );
          };
          const descendants = getDescendants(targetId);
          if (descendants.length > 0) {
            finalElements = finalElements.map((child) => {
              if (descendants.includes(child.id)) {
                return { ...child, x: child.x + moveDx, y: child.y + moveDy };
              }
              return child;
            });
          }
        }
      }
    });

    updateState(finalElements);
  };

  const handleDelete = (id: string) => {
    const newElements = elements.filter(
      (el) => el.id !== id && el.parentId !== id
    );
    updateState(newElements);
    setSelectedIds([]);
  };

  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // If clicking on an element, TransformBox handles it (stopPropagation).
    // If we reach here, we are clicking the empty canvas.

    if (isHandTool || e.button === 1 || e.buttons === 4) {
      // Middle or Hand tool
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // Left click: Start Selection Box
    const isMultiSelect = e.shiftKey || e.metaKey;
    if (isMultiSelect) {
      selectionStartSelectedIds.current = selectedIds;
    } else {
      setSelectedIds([]);
      selectionStartSelectedIds.current = [];
    }

    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });

    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (selectionBox) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      setSelectionBox((prev) =>
        prev ? { ...prev, currentX, currentY } : null
      );

      // Calculate Geometry
      const boxLeft = Math.min(selectionBox.startX, currentX);
      const boxTop = Math.min(selectionBox.startY, currentY);
      const boxWidth = Math.abs(currentX - selectionBox.startX);
      const boxHeight = Math.abs(currentY - selectionBox.startY);

      // Micro-movement threshold to avoid clearing selection on accidental clicks
      if (boxWidth < 2 && boxHeight < 2) {
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
        // Merge initial selection with new intersections
        const combined = Array.from(
          new Set([...selectionStartSelectedIds.current, ...intersectingIds])
        );
        setSelectedIds(combined);
      } else {
        setSelectedIds(intersectingIds);
      }
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    setSelectionBox(null);
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      setScale((prev) => Math.min(Math.max(0.1, prev + delta * 0.001), 3));
    } else {
      setPosition((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => canvas?.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const fitToView = () => {
    if (elements.length === 0) {
      setScale(1);
      setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
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

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  const handleExport = (id?: string) => {
    const targets = id ? elements.filter((e) => e.id === id) : elements;
    const html = generateOBSHtml(targets);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = id ? `overlay-${id}.html` : "project.html";
    a.click();
  };

  const handlePreview = (id: string) => {
    const target = elements.find((e) => e.id === id);
    if (!target) {
      return;
    }
    const html = generateOBSHtml([target]);
    const win = window.open();
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const handleCopyLink = (id: string) => {
    const target = elements.find((e) => e.id === id);
    if (!target) {
      return;
    }
    const html = generateOBSHtml([target]);
    const base64 = btoa(unescape(encodeURIComponent(html)));
    const dataUri = `data:text/html;base64,${base64}`;
    navigator.clipboard.writeText(dataUri);
    alert("OBS Data URI copied to clipboard!");
  };

  return (
    <div className="flex h-screen w-full select-none overflow-hidden bg-[#f8fafc] font-sans text-gray-900">
      <Toolbar
        activeTool={null}
        isHandTool={isHandTool}
        onAdd={addElement}
        onSetTool={() => {}}
        setHandTool={setIsHandTool}
      />

      <LayersPanel
        elements={elements}
        isCollapsed={isLayersCollapsed}
        onSelect={handleSelect}
        onToggleCollapse={() => setIsLayersCollapsed(!isLayersCollapsed)}
        onUpdate={handleUpdate}
        selectedIds={selectedIds}
      />

      <main
        className={`relative flex-1 overflow-hidden outline-none ${isHandTool ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerLeave={handleCanvasPointerUp}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        ref={canvasRef}
        style={{
          backgroundColor: "#f8fafc",
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
          touchAction: "none",
        }}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Elements */}
          {getRenderSortedElements(elements).map((el) => (
            <TransformBox
              height={el.height}
              id={el.id}
              isSelected={selectedIds.includes(el.id)}
              key={el.id}
              locked={el.locked}
              onSelect={handleSelect}
              onUpdate={handleUpdate}
              rotation={el.rotation}
              width={el.width}
              x={el.x}
              y={el.y}
              zoom={scale}
            >
              <ElementRenderer element={el} />
            </TransformBox>
          ))}
        </div>

        {/* Selection Marquee Box */}
        {selectionBox && (
          <div
            className="pointer-events-none fixed z-[1000] border border-blue-500 bg-blue-500/10"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
            }}
          />
        )}

        {/* Zoom & Fit Controls */}
        <div className="absolute bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2">
          <button
            className="rounded-full border border-gray-200 bg-white/80 p-2 text-gray-500 shadow-lg backdrop-blur-md transition-all hover:bg-white hover:text-gray-900"
            onClick={fitToView}
            title="Fit to Layers"
          >
            <Scan size={16} />
          </button>
          <div className="min-w-[60px] rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-center font-bold text-[11px] text-gray-500 shadow-lg backdrop-blur-md">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </main>

      <PropertiesPanel
        elements={elements}
        isCollapsed={isPropertiesCollapsed}
        onCopyLink={handleCopyLink}
        onDelete={handleDelete}
        onDeselect={() => setSelectedIds([])}
        onExport={handleExport}
        onPreview={handlePreview}
        onToggleCollapse={() =>
          setIsPropertiesCollapsed(!isPropertiesCollapsed)
        }
        onUpdate={handleUpdate}
        selectedIds={selectedIds}
      />
    </div>
  );
}
