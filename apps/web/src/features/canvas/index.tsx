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
import {
  downloadOBSHtml,
  generateOBSDataUri,
  generateOBSHtml,
} from "./utils/export-generator";

interface CanvasEditorProps {
  projectId?: string;
  projectName?: string;
  saveStatus?: React.ReactNode;
}

export function CanvasEditor({
  projectId,
  projectName,
  saveStatus,
}: CanvasEditorProps) {
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
    <div className="flex h-screen w-full select-none overflow-hidden bg-background font-sans text-foreground">
      <NavigationSidebar projectName={projectName} saveStatus={saveStatus} />

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
