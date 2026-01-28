import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  elementsAtom,
  resetHistoryAtom,
  selectedIdsAtom,
} from "@/atoms/canvas-atoms";
import { CanvasEditor } from "@/features/canvas";
import type { OverlayElement } from "@/features/canvas/types";

export const Route = createFileRoute("/overlays/$projectId")({
  component: ProjectEditorPage,
});

function ProjectEditorPage() {
  const { projectId } = Route.useParams();

  const project = useQuery(api.projects.getById, {
    id: projectId as Id<"projects">,
  });
  const updateProject = useMutation(api.projects.update);

  const resetHistory = useSetAtom(resetHistoryAtom);
  const setSelectedIds = useSetAtom(selectedIdsAtom);
  const elements = useAtomValue(elementsAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Initialize canvas with project data
  useEffect(() => {
    if (project && !isInitialized.current) {
      const projectElements = (project.elements as OverlayElement[]) || [];
      resetHistory(projectElements);
      lastSavedRef.current = JSON.stringify(projectElements);
      isInitialized.current = true;
    }
  }, [project, resetHistory]);

  // Reset initialization flag when projectId changes
  useEffect(() => {
    isInitialized.current = false;
    setSelectedIds([]);
    lastSavedRef.current = "";
    setHasUnsavedChanges(false);
  }, [setSelectedIds]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isInitialized.current) {
      return;
    }
    if (!project) {
      return;
    }

    const currentJson = JSON.stringify(elements);
    if (currentJson === lastSavedRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateProject({
          id: projectId as Id<"projects">,
          elements,
        });
        lastSavedRef.current = currentJson;
        setHasUnsavedChanges(false);
      } catch {
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, project, projectId, updateProject]);

  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (project === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4">
        <div className="text-gray-500">Project not found</div>
        <Link className="text-blue-600 hover:underline" to="/overlays">
          Back to overlays
        </Link>
      </div>
    );
  }

  const renderSaveStatus = () => {
    if (isSaving) {
      return (
        <span className="flex items-center gap-1 font-medium text-[10px] text-muted-foreground">
          <Save className="h-2.5 w-2.5 animate-pulse" />
          Saving...
        </span>
      );
    }
    if (hasUnsavedChanges) {
      return (
        <span className="font-medium text-[10px] text-amber-500">Unsaved</span>
      );
    }
    return (
      <span className="font-medium text-[10px] text-emerald-500 uppercase tracking-wider opacity-80">
        Saved
      </span>
    );
  };

  return (
    <div className="relative h-svh w-full">
      <CanvasEditor
        projectId={projectId}
        projectName={project.name}
        saveStatus={renderSaveStatus()}
      />
    </div>
  );
}
