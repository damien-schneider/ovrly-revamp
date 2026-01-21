import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useParams, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BottombarTools() {
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

  const [channel, setChannel] = useState("");

  useEffect(() => {
    if (overlay) {
      setChannel(overlay.channel || "");
    }
  }, [overlay]);

  const handleUpdate = async () => {
    if (!(overlay && overlayId)) {
      return;
    }

    try {
      const currentSettings = (overlay.settings || {}) as Record<
        string,
        unknown
      >;
      await updateOverlay({
        id: overlayId,
        channel: channel.trim() || undefined,
        settings: currentSettings,
      });
      toast.success("Channel updated successfully");
    } catch (error) {
      toast.error("Failed to update channel");
      console.error(error);
    }
  };

  if (!overlayId) {
    return null;
  }

  return (
    <div className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex h-12 items-center justify-center gap-4 rounded-full border bg-background/80 px-6 shadow-lg backdrop-blur-sm transition-all hover:bg-background">
        <div className="flex items-center gap-2">
          <Label
            className="whitespace-nowrap font-medium text-sm"
            htmlFor="bottom-channel"
          >
            Twitch Channel:
          </Label>
          <div className="flex items-center gap-2">
            <Input
              className="h-7 w-40 rounded-full bg-transparent px-3 text-sm"
              id="bottom-channel"
              onChange={(e) => setChannel(e.target.value)}
              placeholder="channelname"
              value={channel}
            />
            <Button
              className="h-7 rounded-full px-4 text-xs"
              onClick={handleUpdate}
              size="sm"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
