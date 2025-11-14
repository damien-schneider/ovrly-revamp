import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ChatSettingsData } from "@/atoms/chat-settings-atoms";
import type { Atom } from "jotai";

type UseDebouncedConvexUpdateOptions = {
  overlayId: Id<"overlays">;
  settingsAtom: Atom<ChatSettingsData>;
  delay?: number;
  enabled?: boolean;
};

/**
 * Hook that debounces updates to Convex when chat settings change.
 * Updates are sent to the database after settings haven't changed for the specified delay.
 */
export function useDebouncedConvexUpdate({
  overlayId,
  settingsAtom,
  delay = 1000,
  enabled = true,
}: UseDebouncedConvexUpdateOptions) {
  const settings = useAtomValue(settingsAtom);
  const updateOverlay = useMutation(api.overlays.update);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<ChatSettingsData | null>(null);
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
          await updateOverlay({
            id: overlayId,
            settings: settings as Record<string, unknown>,
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
  }, [settings, overlayId, updateOverlay, delay, enabled]);
}

