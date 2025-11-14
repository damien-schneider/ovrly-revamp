import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { ArrowSquareOutIcon, CopyIcon, PlayIcon } from "@phosphor-icons/react";
import { useParams, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TopbarTools() {
  const pathname = useRouterState().location.pathname;
  const params = useParams({ strict: false });

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");

  const overlayId =
    (isChatRoute || isWallEmoteRoute) && params.id
      ? (params.id as Id<"overlays">)
      : undefined;

  const overlay = useQuery(
    api.overlays.getById,
    overlayId ? { id: overlayId } : "skip"
  );
  const updateOverlay = useMutation(api.overlays.update);

  const [testMessagesEnabled, setTestMessagesEnabled] = useState(false);

  useEffect(() => {
    if (overlay) {
      setTestMessagesEnabled(
        (overlay.settings as { testMessagesEnabled?: boolean })
          ?.testMessagesEnabled ?? false
      );
    }
  }, [overlay]);

  const siteUrl =
    (import.meta as { env?: { VITE_SITE_URL?: string } }).env?.VITE_SITE_URL ||
    window.location.origin;

  let obsUrl = "";
  if (overlayId) {
    if (isChatRoute) {
      obsUrl = `${siteUrl}/chat/${overlayId}`;
    } else if (isWallEmoteRoute) {
      obsUrl = `${siteUrl}/wall-emote/${overlayId}`;
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

  const handleTestMessagesToggle = async (pressed: boolean) => {
    if (!overlayId) {
      return;
    }
    if (!overlay) {
      return;
    }

    setTestMessagesEnabled(pressed);

    try {
      const currentSettings = (overlay.settings || {}) as Record<
        string,
        unknown
      >;
      await updateOverlay({
        id: overlayId,
        settings: {
          ...currentSettings,
          testMessagesEnabled: pressed,
        },
      });
    } catch (error) {
      toast.error("Failed to update test messages setting");
      setTestMessagesEnabled(!pressed);
      if (error instanceof Error) {
        throw error;
      }
    }
  };

  if (!(isChatRoute || isWallEmoteRoute)) {
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
        {isChatRoute && overlayId && (
          <Tooltip>
            <TooltipTrigger asChild={true}>
              <Toggle
                onPressedChange={handleTestMessagesToggle}
                pressed={testMessagesEnabled}
                size="sm"
                variant="outline"
              >
                <PlayIcon className="h-4 w-4" weight="regular" />
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
