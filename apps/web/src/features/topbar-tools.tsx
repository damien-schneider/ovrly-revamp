import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import {
  ArrowSquareOutIcon,
  CopyIcon,
  Pause,
  Play,
} from "@phosphor-icons/react";
import { useParams, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  getOverlaySettingsAtom,
  isOverlaySettingsInitialized,
  setOverlaySettingsInitialized,
} from "@/atoms/overlay-settings-atoms";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedConvexUpdate } from "@/hooks/use-debounced-convex-update";

export function TopbarTools() {
  const pathname = useRouterState().location.pathname;
  const params = useParams({ strict: false });

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");
  const isAdRoute = pathname.startsWith("/overlays/ad/");

  const overlayId =
    (isChatRoute || isWallEmoteRoute || isAdRoute) && params.id
      ? (params.id as Id<"overlays">)
      : undefined;

  const overlay = useQuery(
    api.overlays.getById,
    overlayId ? { id: overlayId } : "skip"
  );

  // Only create atom if we have an overlayId
  const settingsAtom = overlayId ? getOverlaySettingsAtom(overlayId) : null;
  const [settings, setSettings] = useAtom(
    settingsAtom ?? getOverlaySettingsAtom("" as Id<"overlays">)
  );

  // Initialize atom from Convex data on first load
  useEffect(() => {
    if (
      overlayId &&
      overlay?.settings &&
      settingsAtom &&
      !isOverlaySettingsInitialized(overlayId)
    ) {
      const overlaySettings = overlay.settings as {
        testMessagesEnabled?: boolean;
      };
      const currentSettings = overlaySettings?.testMessagesEnabled
        ? { testMessagesEnabled: overlaySettings.testMessagesEnabled }
        : {};
      setSettings(currentSettings);
      setOverlaySettingsInitialized(overlayId, true);
    }
  }, [overlay, overlayId, setSettings, settingsAtom]);

  // Debounced update to Convex - merge with existing settings
  useDebouncedConvexUpdate({
    overlayId: overlayId ?? ("" as Id<"overlays">),
    settingsAtom: settingsAtom ?? getOverlaySettingsAtom("" as Id<"overlays">),
    delay: 1000,
    enabled: Boolean(overlayId && overlay && settingsAtom),
    mergeWithExisting: true,
  });

  const testMessagesEnabled = settings.testMessagesEnabled ?? false;

  const siteUrl =
    (import.meta as { env?: { VITE_SITE_URL?: string } }).env?.VITE_SITE_URL ||
    window.location.origin;

  let obsUrl = "";
  if (overlayId) {
    if (isChatRoute) {
      obsUrl = `${siteUrl}/chat/${overlayId}`;
    } else if (isWallEmoteRoute) {
      obsUrl = `${siteUrl}/wall-emote/${overlayId}`;
    } else if (isAdRoute) {
      obsUrl = `${siteUrl}/ad/${overlayId}`;
    }
  }

  const handleCopyOBSLink = () => {
    if (!obsUrl) {
      return;
    }
    navigator.clipboard.writeText(obsUrl);
    toast.success("OBS link copied to clipboard");
  };

  const handleOpenOBSLink = () => {
    if (!obsUrl) {
      return;
    }
    window.open(obsUrl, "_blank", "noopener,noreferrer");
  };

  const handleTestMessagesToggle = (pressed: boolean) => {
    if (!overlayId) {
      return;
    }

    // Update atom - debounced hook will sync to database
    setSettings((prev) => ({
      ...prev,
      testMessagesEnabled: pressed,
    }));
  };

  if (!(isChatRoute || isWallEmoteRoute || isAdRoute)) {
    return null;
  }

  return (
    <div className="flex h-14 w-full items-center justify-center px-4">
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button onClick={handleCopyOBSLink} size="sm">
              <CopyIcon className="h-4 w-4" weight="regular" />
              Copy OBS Link
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy OBS link to clipboard</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button onClick={handleOpenOBSLink} size="icon-sm">
              <ArrowSquareOutIcon className="h-4 w-4" weight="regular" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open OBS link in new tab</TooltipContent>
        </Tooltip>
        {(isChatRoute || isWallEmoteRoute) && overlayId && (
          <Tooltip>
            <TooltipTrigger asChild={true}>
              <Toggle
                onPressedChange={handleTestMessagesToggle}
                pressed={testMessagesEnabled}
                size="sm"
                variant="outline"
              >
                {testMessagesEnabled ? (
                  <Pause className="h-4 w-4" weight="regular" />
                ) : (
                  <Play className="h-4 w-4" weight="regular" />
                )}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              {testMessagesEnabled
                ? "Disable test messages"
                : "Enable test messages"}
            </TooltipContent>
          </Tooltip>
        )}
      </ButtonGroup>
    </div>
  );
}
