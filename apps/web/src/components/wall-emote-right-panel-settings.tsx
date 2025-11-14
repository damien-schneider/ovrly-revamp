import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { Copy } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WallEmoteSettings } from "@/components/wall-emote-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type WallEmoteRightPanelSettingsProps = {
  overlayId: Id<"overlays"> | undefined;
};

export default function WallEmoteRightPanelSettings({
  overlayId,
}: WallEmoteRightPanelSettingsProps) {
  const overlay = useQuery(
    api.overlays.getById,
    overlayId ? { id: overlayId } : "skip"
  );
  const updateOverlay = useMutation(api.overlays.update);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");

  useEffect(() => {
    if (overlay) {
      setName(overlay.name || "");
      setChannel(overlay.channel || "");
    }
  }, [overlay]);

  const siteUrl =
    (import.meta as { env?: { VITE_SITE_URL?: string } }).env?.VITE_SITE_URL ||
    window.location.origin;
  const wallEmoteUrl = overlayId ? `${siteUrl}/wall-emote/${overlayId}` : "";
  const obsUrl = wallEmoteUrl;

  const handleUpdate = async () => {
    if (!overlayId) {
      return;
    }
    if (!overlay) {
      return;
    }

    try {
      const currentSettings = (overlay.settings || {}) as Record<
        string,
        unknown
      >;
      await updateOverlay({
        id: overlayId,
        name: name.trim() || undefined,
        channel: channel.trim() || undefined,
        settings: currentSettings,
      });
      toast.success("Overlay updated successfully");
    } catch (error) {
      toast.error("Failed to update overlay");
      if (error instanceof Error) {
        throw error;
      }
    }
  };

  const handleCopyOBSLink = () => {
    navigator.clipboard.writeText(obsUrl);
    toast.success("OBS link copied to clipboard");
  };

  if (!overlayId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <ScrollBar orientation="vertical" />
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Settings</h2>
            <p className="text-muted-foreground text-sm">
              Configure your wall emote overlay
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My Wall Emote Overlay"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Twitch Channel</Label>
              <Input
                id="channel"
                onChange={(e) => setChannel(e.target.value)}
                placeholder="channelname"
                value={channel}
              />
            </div>

            <Button className="w-full" onClick={handleUpdate}>
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <div>
            <h2 className="font-semibold text-lg">OBS Browser Source</h2>
            <p className="text-muted-foreground text-sm">
              Use this URL in OBS as a Browser Source
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input className="text-xs" readOnly value={obsUrl} />
              <Button onClick={handleCopyOBSLink} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {overlayId && (
          <div className="border-t pt-4">
            <WallEmoteSettings overlayId={overlayId} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
