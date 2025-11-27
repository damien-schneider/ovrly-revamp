import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { Atom } from "jotai";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type UseDebouncedConvexUpdateOptions<T extends Record<string, unknown>> = {
  overlayId: Id<"overlays">;
  settingsAtom: Atom<T>;
  delay?: number;
  enabled?: boolean;
  mergeWithExisting?: boolean;
};

/**
 * Hook that debounces updates to Convex when settings change.
 * Updates are sent to the database after settings haven't changed for the specified delay.
 */
export function useDebouncedConvexUpdate<T extends Record<string, unknown>>({
  overlayId,
  settingsAtom,
  delay = 1000,
  enabled = true,
  mergeWithExisting = false,
}: UseDebouncedConvexUpdateOptions<T>) {
  const settings = useAtomValue(settingsAtom);
  const updateOverlay = useMutation(api.overlays.update);
  const overlay = useQuery(
    api.overlays.getById,
    mergeWithExisting && enabled ? { id: overlayId } : "skip"
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<T | null>(null);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount to avoid saving immediately when component loads
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastSavedRef.current = settings;
      return;
    }

    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to save after delay
    timeoutRef.current = setTimeout(async () => {
      try {
        // Only save if settings have actually changed
        if (JSON.stringify(lastSavedRef.current) !== JSON.stringify(settings)) {
          const settingsToSave =
            mergeWithExisting && overlay?.settings
              ? {
                  ...(overlay.settings as Record<string, unknown>),
                  ...settings,
                }
              : settings;

          await updateOverlay({
            id: overlayId,
            settings: settingsToSave,
          });
          lastSavedRef.current = settings;
        }
      } catch (error) {
        console.error("Failed to update settings:", error);
        toast.error("Failed to save settings");
        // Optionally revert to last saved state on error
        // This would require access to setSettings, which we don't have here
        // The user can manually fix or reload
      }
    }, delay);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    settings,
    overlayId,
    updateOverlay,
    delay,
    enabled,
    mergeWithExisting,
    overlay,
  ]);
}
