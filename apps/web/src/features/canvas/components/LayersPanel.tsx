"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BarChartHorizontal,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  GripHorizontal,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Layout,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Square,
  Type,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import {
  elementsAtom,
  isLayersPanelCollapsedAtom,
  selectedIdsAtom,
  updateElementsAtom,
} from "@/atoms/canvas-atoms";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ElementType, type OverlayElement } from "@/features/canvas/types";
import { cn } from "@/lib/utils";
import {
  bringForward,
  bringToFront,
  canBringForward,
  canSendBackward,
  getChildrenSorted,
  moveToPosition,
  sendBackward,
  sendToBack,
  wouldCreateCircularReference,
} from "../lib/z-index-utils";

interface LayersPanelProps {
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

interface DragState {
  draggedIds: string[];
  dragOverId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

function getIcon(type: ElementType) {
  const iconClass = "h-3.5 w-3.5";
  switch (type) {
    case ElementType.OVERLAY:
      return <Layout className={iconClass} />;
    case ElementType.TEXT:
      return <Type className={iconClass} />;
    case ElementType.BOX:
      return <Square className={iconClass} />;
    case ElementType.IMAGE:
      return <ImageIcon className={iconClass} />;
    case ElementType.CHAT:
      return <MessageSquare className={iconClass} />;
    case ElementType.EMOTE_WALL:
      return <GripHorizontal className={iconClass} />;
    case ElementType.WEBCAM:
      return <Camera className={iconClass} />;
    case ElementType.TIMER:
      return <Clock className={iconClass} />;
    case ElementType.PROGRESS:
      return <BarChartHorizontal className={iconClass} />;
    default:
      return <Square className={iconClass} />;
  }
}

interface LayerItemRowProps {
  element: OverlayElement;
  depth: number;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dropPosition: DragState["dropPosition"];
  hasChildren: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSelect: (multi: boolean) => void;
  onToggleVisibility: () => void;
}

function LayerItemRow({
  element,
  depth,
  isSelected,
  isDragging,
  isDragOver,
  dropPosition,
  hasChildren,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSelect,
  onToggleVisibility,
}: LayerItemRowProps) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: drag-and-drop requires event handlers on list items
    <li
      className={cn(
        "group flex h-7 w-full select-none list-none items-center gap-1 px-2 transition-colors",
        isSelected
          ? "bg-secondary text-secondary-foreground"
          : "text-foreground hover:bg-accent",
        isDragging && "opacity-50",
        isDragOver &&
          dropPosition === "inside" &&
          "ring-2 ring-blue-500 ring-inset"
      )}
      draggable
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div
        className={cn(
          "shrink-0 cursor-grab opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-60",
          isSelected ? "text-secondary-foreground" : "text-muted-foreground"
        )}
      >
        <GripVertical className="h-3 w-3" />
      </div>

      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        style={{ paddingLeft: `${depth * 10}px` }}
      >
        <button
          className={cn(
            "shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100",
            !element.visible && "opacity-60",
            isSelected
              ? "text-secondary-foreground hover:bg-accent"
              : "text-muted-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          title={element.visible ? "Hide layer" : "Show layer"}
          type="button"
        >
          {element.visible ? (
            <Eye className="h-3 w-3" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </button>

        <button
          className="flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent p-0 text-left outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(e.shiftKey || e.metaKey);
          }}
          type="button"
        >
          <span
            className={cn(
              "shrink-0",
              isSelected ? "text-secondary-foreground" : "text-muted-foreground"
            )}
          >
            {getIcon(element.type)}
          </span>
          <span className="truncate font-medium text-[11px] leading-none">
            {element.name || element.type}
          </span>
        </button>
      </div>

      {hasChildren && (
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 opacity-60",
            isSelected ? "text-secondary-foreground" : "text-muted-foreground"
          )}
        />
      )}
    </li>
  );
}

interface LayerContextMenuProps {
  children: ReactNode;
  canMoveForward: boolean;
  canMoveBackward: boolean;
  onBringToFront: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onSendToBack: () => void;
}

function LayerContextMenu({
  children,
  canMoveForward,
  canMoveBackward,
  onBringToFront,
  onBringForward,
  onSendBackward,
  onSendToBack,
}: LayerContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem disabled={!canMoveForward} onClick={onBringToFront}>
          <ArrowUpToLine className="mr-2 h-4 w-4" />
          Bring to Front
        </ContextMenuItem>
        <ContextMenuItem disabled={!canMoveForward} onClick={onBringForward}>
          <ChevronUp className="mr-2 h-4 w-4" />
          Bring Forward
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!canMoveBackward} onClick={onSendBackward}>
          <ChevronDown className="mr-2 h-4 w-4" />
          Send Backward
        </ContextMenuItem>
        <ContextMenuItem disabled={!canMoveBackward} onClick={onSendToBack}>
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Send to Back
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function LayersPanel({ onUpdate }: LayersPanelProps) {
  const elements = useAtomValue(elementsAtom);
  const updateElements = useSetAtom(updateElementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(isLayersPanelCollapsedAtom);

  const [dragState, setDragState] = useState<DragState>({
    draggedIds: [],
    dragOverId: null,
    dropPosition: null,
  });

  const dragImageRef = useRef<HTMLDivElement | null>(null);

  const rootItems = elements
    .filter((el) => !el.parentId)
    .sort((a, b) => b.zIndex - a.zIndex);

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

  // Z-index operations
  const handleBringToFront = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    updateElements(bringToFront(selectedIds, elements));
  }, [selectedIds, elements, updateElements]);

  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    updateElements(bringForward(selectedIds, elements));
  }, [selectedIds, elements, updateElements]);

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    updateElements(sendBackward(selectedIds, elements));
  }, [selectedIds, elements, updateElements]);

  const handleSendToBack = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    updateElements(sendToBack(selectedIds, elements));
  }, [selectedIds, elements, updateElements]);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, elementId: string) => {
      const idsToMove = selectedIds.includes(elementId)
        ? [...selectedIds]
        : [elementId];

      setDragState((prev) => ({ ...prev, draggedIds: idsToMove }));

      const dragImage = document.createElement("div");
      dragImage.className =
        "fixed bg-secondary/90 text-secondary-foreground px-2 py-1 rounded text-xs font-medium pointer-events-none";
      dragImage.textContent =
        idsToMove.length > 1 ? `${idsToMove.length} layers` : "1 layer";
      dragImage.style.left = "-9999px";
      document.body.appendChild(dragImage);
      dragImageRef.current = dragImage;

      e.dataTransfer.setDragImage(dragImage, 0, 0);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", idsToMove.join(","));
    },
    [selectedIds]
  );

  const handleDragEnd = useCallback(() => {
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
    setDragState({ draggedIds: [], dragOverId: null, dropPosition: null });
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, elementId: string, isContainer: boolean) => {
      e.preventDefault();
      e.stopPropagation();

      if (dragState.draggedIds.length === 0) {
        return;
      }

      const targetElement = elements.find((el) => el.id === elementId);
      if (!targetElement) {
        return;
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      let position: "before" | "after" | "inside";

      if (isContainer) {
        if (y < height * 0.25) {
          position = "before";
        } else if (y > height * 0.75) {
          position = "after";
        } else {
          position = "inside";
        }
      } else {
        position = y < height / 2 ? "before" : "after";
      }

      const wouldBeCircular =
        position === "inside" &&
        wouldCreateCircularReference(dragState.draggedIds, elementId, elements);

      if (wouldBeCircular) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      e.dataTransfer.dropEffect = "move";
      setDragState((prev) => ({
        ...prev,
        dragOverId: elementId,
        dropPosition: position,
      }));
    },
    [dragState.draggedIds, elements]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!(relatedTarget && e.currentTarget.contains(relatedTarget))) {
      setDragState((prev) => ({
        ...prev,
        dragOverId: null,
        dropPosition: null,
      }));
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetElementId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const { draggedIds, dropPosition } = dragState;

      if (draggedIds.length === 0 || !dropPosition) {
        return;
      }

      const targetElement = elements.find((el) => el.id === targetElementId);
      if (!targetElement) {
        return;
      }

      let newParentId: string | null;
      let targetIndex: number;

      if (dropPosition === "inside") {
        newParentId = targetElementId;
        const children = getChildrenSorted(targetElementId, elements);
        targetIndex = children.length;
      } else {
        newParentId = targetElement.parentId;
        const siblings = getChildrenSorted(newParentId, elements);
        const targetSiblingIndex = siblings.findIndex(
          (s) => s.id === targetElementId
        );

        if (dropPosition === "before") {
          targetIndex = targetSiblingIndex + 1;
        } else {
          targetIndex = targetSiblingIndex;
        }
      }

      updateElements(
        moveToPosition(draggedIds, targetIndex, newParentId, elements)
      );
    },
    [dragState, elements, updateElements]
  );

  const renderItem = useCallback(
    (element: OverlayElement, depth = 0): ReactNode => {
      const isSelected = selectedIds.includes(element.id);
      const children = elements
        .filter((el) => el.parentId === element.id)
        .sort((a, b) => b.zIndex - a.zIndex);

      const isDragging = dragState.draggedIds.includes(element.id);
      const isDragOver = dragState.dragOverId === element.id;
      const isContainer = element.type === ElementType.OVERLAY;
      const canMoveForward = canBringForward([element.id], elements);
      const canMoveBackward = canSendBackward([element.id], elements);

      return (
        <LayerContextMenu
          canMoveBackward={canMoveBackward}
          canMoveForward={canMoveForward}
          key={element.id}
          onBringForward={handleBringForward}
          onBringToFront={handleBringToFront}
          onSendBackward={handleSendBackward}
          onSendToBack={handleSendToBack}
        >
          <div className="flex flex-col">
            {isDragOver && dragState.dropPosition === "before" && (
              <div
                className="h-0.5 bg-blue-500"
                style={{ marginLeft: `${depth * 10 + 8}px` }}
              />
            )}

            <LayerItemRow
              depth={depth}
              dropPosition={dragState.dropPosition}
              element={element}
              hasChildren={children.length > 0}
              isDragging={isDragging}
              isDragOver={isDragOver}
              isSelected={isSelected}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              onDragOver={(e) => handleDragOver(e, element.id, isContainer)}
              onDragStart={(e) => handleDragStart(e, element.id)}
              onDrop={(e) => handleDrop(e, element.id)}
              onSelect={(multi) => handleSelect(element.id, multi)}
              onToggleVisibility={() =>
                onUpdate(element.id, { visible: !element.visible })
              }
            />

            {isDragOver && dragState.dropPosition === "after" && (
              <div
                className="h-0.5 bg-blue-500"
                style={{ marginLeft: `${depth * 10 + 8}px` }}
              />
            )}

            {children.length > 0 && (
              <div className="flex flex-col">
                {children.map((child) => renderItem(child, depth + 1))}
              </div>
            )}
          </div>
        </LayerContextMenu>
      );
    },
    [
      selectedIds,
      elements,
      dragState,
      handleSelect,
      handleBringToFront,
      handleBringForward,
      handleSendBackward,
      handleSendToBack,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      onUpdate,
    ]
  );

  if (isCollapsed) {
    return (
      <div className="fixed top-[60px] left-4 z-100 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm">
        <Button
          className="h-8 w-8 border-none text-foreground transition-colors hover:bg-accent"
          onClick={() => setIsCollapsed(false)}
          size="icon-xs"
          variant="ghost"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-[60px] bottom-4 left-4 z-90 flex w-[240px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur-sm transition-all duration-300">
      <div className="flex h-10 items-center justify-between border-border/50 border-b px-3">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-bold text-[11px] text-foreground tracking-tight">
            Layers
          </span>
        </div>
        <Button
          className="h-6 w-6 rounded border-none hover:bg-accent"
          onClick={() => setIsCollapsed(true)}
          size="icon-xs"
          variant="ghost"
        >
          <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="list-none py-2">
          {rootItems.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center p-6 text-center">
              <span className="font-medium text-[11px] text-muted-foreground">
                No layers yet
              </span>
              <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed opacity-60">
                Add elements from the toolbar to start designing.
              </p>
            </div>
          ) : (
            rootItems.map((item) => renderItem(item))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
