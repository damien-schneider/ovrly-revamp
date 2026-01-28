import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
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
} from "@/atoms/canvas-atoms";
import type { OverlayElement } from "@/features/canvas/types";
import { Canvas } from "./components/Canvas";
import { LayersPanel } from "./components/LayersPanel";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { PropertiesPanel } from "./components/properties-panel";
import { Toolbar } from "./components/Toolbar";
import { useCreateElement } from "./hooks/use-create-element";
import {
  applyElementUpdate,
  getIndependentUpdateIds,
} from "./lib/element-utils";
import { downloadOBSHtml } from "./utils/export-generator";

interface CanvasEditorProps {
  saveStatus?: React.ReactNode;
}

export function CanvasEditor({ saveStatus }: CanvasEditorProps) {
  const elements = useAtomValue(elementsAtom);
  const updateElements = useSetAtom(updateElementsAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedIdsAtom);
  const setToolMode = useSetAtom(toolModeAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const setIsPropertiesCollapsed = useSetAtom(isPropertiesPanelCollapsedAtom);

  const addElement = useCreateElement(
    updateElements,
    setSelectedIds,
    setToolMode
  );
  const removeOverlay = useMutation(api.overlays.remove);

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

  const handleDelete = async (id: string) => {
    try {
      // Remove from backend (cascades to children)
      await removeOverlay({ id: id as Id<"overlays"> });

      // Remove from local state
      const newElements = elements.filter(
        (el) => el.id !== id && el.parentId !== id
      );
      updateElements(newElements);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Failed to delete element");
      console.error(error);
    }
  };

  const handleExport = (id?: string) => {
    const targets = id ? elements.filter((e) => e.id === id) : elements;
    downloadOBSHtml(targets, id ? `overlay-${id}.html` : "project.html");
    toast.success("HTML file downloaded");
  };

  return (
    <div className="flex h-screen w-full select-none overflow-hidden bg-background font-sans text-foreground">
      <NavigationSidebar saveStatus={saveStatus} />

      <Toolbar onAddElement={addElement} />

      <LayersPanel onUpdate={handleUpdate} />

      <Canvas onUpdateElement={handleUpdate} />

      <PropertiesPanel
        onDelete={handleDelete}
        onExport={handleExport}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
