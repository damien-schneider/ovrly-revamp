import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OverlayBasicSettingsProps = {
  overlayId: Id<"overlays">;
};

export function OverlayBasicSettings({ overlayId }: OverlayBasicSettingsProps) {
  const overlay = useQuery(api.overlays.getById, { id: overlayId });
  const updateOverlay = useMutation(api.overlays.update);

  const [name, setName] = useState("");
  const [channel, setChannel] = useState("");

  useEffect(() => {
    if (overlay) {
      setName(overlay.name || "");
      setChannel(overlay.channel || "");
    }
  }, [overlay]);

  const handleUpdate = async () => {
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

  if (!overlay) {
    return null;
  }

  return (
    <div className="border-border border-t p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="overlay-name">Name</Label>
          <Input
            id="overlay-name"
            onChange={(e) => setName(e.target.value)}
            placeholder="My Overlay"
            value={name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="overlay-channel">Twitch Channel</Label>
          <Input
            id="overlay-channel"
            onChange={(e) => setChannel(e.target.value)}
            placeholder="channelname"
            value={channel}
          />
        </div>
        <Button className="w-full" onClick={handleUpdate} size="sm">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
