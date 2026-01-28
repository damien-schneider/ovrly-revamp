import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useAtomValue, useSetAtom } from "jotai";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { elementsAtom, resetHistoryAtom } from "@/atoms/canvas-atoms";
import { CanvasEditor } from "@/features/canvas";
import {
  type OverlayRow,
  overlayRowToElement,
} from "@/features/canvas/lib/overlay-conversion";

export const Route = createFileRoute("/overlays")({
  component: OverlaysPage,
});

function OverlaysPage() {
  return (
    <>
      <Authenticated>
        <CanvasEditorPage />
      </Authenticated>
      <Unauthenticated>
        <Navigate search={{ redirect: "/overlays" }} to="/login" />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-svh items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}

function CanvasEditorPage() {
  const overlayRows = useQuery(api.overlays.list);
  const batchUpdate = useMutation(api.overlays.batchUpdate);

  const resetHistory = useSetAtom(resetHistoryAtom);
  const elements = useAtomValue(elementsAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Initialize canvas with overlay data
  useEffect(() => {
    if (overlayRows && !isInitialized.current) {
      const elements = overlayRows.map((row) =>
        overlayRowToElement(row as OverlayRow)
      );
      resetHistory(elements);
      lastSavedRef.current = JSON.stringify(elements);
      isInitialized.current = true;
    }
  }, [overlayRows, resetHistory]);

  // Auto-save with debounce
  useEffect(() => {
    if (!(isInitialized.current && overlayRows)) {
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
        // Build updates for changed elements
        const updates = elements.map((el) => ({
          id: el.id as Id<"overlays">,
          parentId: (el.parentId as Id<"overlays">) ?? null,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          zIndex: el.zIndex,
          locked: el.locked,
          visible: el.visible,
          properties: (() => {
            const {
              id,
              type,
              name,
              parentId,
              x,
              y,
              width,
              height,
              rotation,
              opacity,
              zIndex,
              locked,
              visible,
              ...props
            } = el;
            return props;
          })(),
        }));

        await batchUpdate({ updates });
        lastSavedRef.current = currentJson;
        setHasUnsavedChanges(false);
      } catch (error) {
        toast.error("Failed to save changes");
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, overlayRows, batchUpdate]);

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

  if (overlayRows === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-gray-500">Loading canvas...</div>
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
      <CanvasEditor saveStatus={renderSaveStatus()} />
    </div>
  );
}
