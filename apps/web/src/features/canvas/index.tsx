import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  elementsAtom,
  isPropertiesPanelCollapsedAtom,
  redoAtom,
  selectedIdsAtom,
  toolModeAtom,
  undoAtom,
  updateElementsAtom,
  viewportAtom,
} from "@/atoms/canvas-atoms";
import { Canvas } from "./components/Canvas";
import { LayersPanel } from "./components/LayersPanel";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Toolbar } from "./components/Toolbar";
import {
  type BoxElement,
  type ChatElement,
  defaultChatStyle,
  defaultEmoteWallStyle,
  defaultTimerStyle,
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
import {
  downloadOBSHtml,
  generateOBSDataUri,
  generateOBSHtml,
} from "./utils/export-generator";

interface CanvasEditorProps {
  projectId?: string;
}

// Helper functions for handleUpdate complexity reduction
function getDescendantIds(
  elements: OverlayElement[],
  parentId: string
): string[] {
  const children = elements.filter((e) => e.parentId === parentId);
  const result: string[] = [];
  for (const child of children) {
    result.push(child.id);
    result.push(...getDescendantIds(elements, child.id));
  }
  return result;
}

function findNewParent(
  elements: OverlayElement[],
  cx: number,
  cy: number,
  excludeId: string
): string | null {
  const parent = elements
    .filter((e) => e.type === ElementType.OVERLAY && e.id !== excludeId)
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(
      (p) =>
        cx >= p.x && cx <= p.x + p.width && cy >= p.y && cy <= p.y + p.height
    );
  return parent ? parent.id : null;
}

function moveDescendants(
  elements: OverlayElement[],
  parentId: string,
  dx: number,
  dy: number
): OverlayElement[] {
  const descendants = getDescendantIds(elements, parentId);
  if (descendants.length === 0) {
    return elements;
  }
  return elements.map((el) => {
    if (descendants.includes(el.id)) {
      return { ...el, x: el.x + dx, y: el.y + dy };
    }
    return el;
  });
}

function getIndependentUpdateIds(
  elements: OverlayElement[],
  idsToUpdate: string[]
): string[] {
  return idsToUpdate.filter((targetId) => {
    const target = elements.find((e) => e.id === targetId);
    return !(target?.parentId && idsToUpdate.includes(target.parentId));
  });
}

interface UpdateContext {
  id: string;
  dx: number;
  dy: number;
  isPrimary: boolean;
  updates: Partial<OverlayElement>;
}

function applyElementUpdate(
  elements: OverlayElement[],
  targetId: string,
  el: OverlayElement,
  ctx: UpdateContext
): OverlayElement[] {
  const newProperties: Partial<OverlayElement> = ctx.isPrimary
    ? { ...ctx.updates }
    : { x: el.x + ctx.dx, y: el.y + ctx.dy };

  // Reparenting check
  const shouldCheckReparent =
    ctx.isPrimary &&
    (newProperties.x !== undefined || newProperties.y !== undefined) &&
    el.type !== ElementType.OVERLAY;

  if (shouldCheckReparent) {
    const cx =
      (newProperties.x ?? el.x) + (newProperties.width ?? el.width) / 2;
    const cy =
      (newProperties.y ?? el.y) + (newProperties.height ?? el.height) / 2;
    newProperties.parentId = findNewParent(elements, cx, cy, targetId);
  }

  let result = elements.map((e) =>
    e.id === targetId ? ({ ...e, ...newProperties } as OverlayElement) : e
  );

  // Move descendants
  const hasPositionChange =
    newProperties.x !== undefined || newProperties.y !== undefined;
  if (hasPositionChange) {
    const moveDx = (newProperties.x ?? el.x) - el.x;
    const moveDy = (newProperties.y ?? el.y) - el.y;
    if (moveDx !== 0 || moveDy !== 0) {
      result = moveDescendants(result, targetId, moveDx, moveDy);
    }
  }

  return result;
}

export function CanvasEditor({ projectId }: CanvasEditorProps) {
  const elements = useAtomValue(elementsAtom);
  const updateElements = useSetAtom(updateElementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const setToolMode = useSetAtom(toolModeAtom);
  const viewport = useAtomValue(viewportAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const setIsPropertiesCollapsed = useSetAtom(isPropertiesPanelCollapsedAtom);

  // Auto-collapse right sidebar when selection is empty
  useEffect(() => {
    setIsPropertiesCollapsed(selectedIds.length === 0);
  }, [selectedIds, setIsPropertiesCollapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const isTextInput = (target: EventTarget | null): boolean => {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      );
    };

    const handleUndoRedo = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    const handleDelete = () => {
      if (selectedIds.length === 0) {
        return;
      }
      const newElements = elements.filter((el) => !selectedIds.includes(el.id));
      updateElements(newElements);
      setSelectedIds([]);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextInput(e.target)) {
        return;
      }

      const isModKey = e.ctrlKey || e.metaKey;

      if (isModKey && e.key === "z") {
        handleUndoRedo(e);
        return;
      }

      switch (e.key) {
        case "h":
          setToolMode("hand");
          break;
        case "v":
          setToolMode("select");
          break;
        case "Delete":
        case "Backspace":
          handleDelete();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    elements,
    redo,
    undo,
    selectedIds,
    setToolMode,
    setSelectedIds,
    updateElements,
  ]);

  const addElement = (type: ElementType) => {
    const id = crypto.randomUUID();
    const { scale, position } = viewport;

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
          style: { ...defaultChatStyle },
          mockMessages: [
            {
              user: "StreamFan",
              text: "This looks amazing!",
              color: "#ff5555",
              badges: ["subscriber"],
            },
            {
              user: "ModBot",
              text: "Enjoy the stream.",
              color: "#55ff55",
              badges: ["moderator"],
            },
          ],
          previewEnabled: false,
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
          style: { ...defaultEmoteWallStyle },
          previewEnabled: false,
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
          style: { ...defaultTimerStyle },
          isRunning: false,
          elapsedMs: 0,
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
          showLabel: false,
          labelColor: "#ffffff",
          labelPosition: "inside",
          animated: false,
          stripes: false,
        } as ProgressBarElement;
        break;
      default:
        break;
    }

    if (newElement) {
      updateElements([...elements, newElement]);
      setSelectedIds([id]);
      setToolMode("select");
    }
  };

  const handleUpdate = (id: string, updates: Partial<OverlayElement>) => {
    const originalEl = elements.find((e) => e.id === id);
    if (!originalEl) {
      return;
    }

    const dx = updates.x !== undefined ? updates.x - originalEl.x : 0;
    const dy = updates.y !== undefined ? updates.y - originalEl.y : 0;
    const isTranslation = dx !== 0 || dy !== 0;

    let idsToUpdate = [id];
    if (isTranslation && selectedIds.includes(id)) {
      idsToUpdate = [...selectedIds];
    }

    const independentIds = getIndependentUpdateIds(elements, idsToUpdate);
    let finalElements = [...elements];

    for (const targetId of independentIds) {
      const el = finalElements.find((e) => e.id === targetId);
      if (!el) {
        continue;
      }

      finalElements = applyElementUpdate(finalElements, targetId, el, {
        id,
        dx,
        dy,
        isPrimary: targetId === id,
        updates,
      });
    }

    updateElements(finalElements);
  };

  const handleDelete = (id: string) => {
    const newElements = elements.filter(
      (el) => el.id !== id && el.parentId !== id
    );
    updateElements(newElements);
    setSelectedIds([]);
  };

  const handleExport = (id?: string) => {
    const targets = id ? elements.filter((e) => e.id === id) : elements;
    downloadOBSHtml(targets, id ? `overlay-${id}.html` : "project.html");
    toast.success("HTML file downloaded");
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
    const dataUri = generateOBSDataUri([target]);
    navigator.clipboard.writeText(dataUri);
    toast.success("OBS Data URI copied to clipboard");
  };

  return (
    <div className="flex h-screen w-full select-none overflow-hidden bg-[#f8fafc] font-sans text-gray-900">
      <NavigationSidebar />

      <Toolbar onAddElement={addElement} />

      <LayersPanel onUpdate={handleUpdate} />

      <Canvas onUpdateElement={handleUpdate} projectId={projectId} />

      <PropertiesPanel
        onCopyLink={handleCopyLink}
        onDelete={handleDelete}
        onExport={handleExport}
        onPreview={handlePreview}
        onUpdate={handleUpdate}
        projectId={projectId}
      />
    </div>
  );
}
