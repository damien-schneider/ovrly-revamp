import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OverlayType = "chat" | "emoji-wall" | "ad";

interface OverlayFormProps {
  overlayId?: Id<"overlays">;
  initialName?: string;
  initialType?: OverlayType;
  initialChannel?: string;
  initialSettings?: Record<string, unknown>;
  onSuccess?: () => void;
}

export default function OverlayForm({
  overlayId,
  initialName = "",
  initialType = "chat",
  initialChannel = "",
  initialSettings = {},
  onSuccess,
}: OverlayFormProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<OverlayType>(initialType);
  const [channel, setChannel] = useState(initialChannel);

  const createOverlay = useMutation(api.overlays.create);
  const updateOverlay = useMutation(api.overlays.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name for the overlay");
      return;
    }

    try {
      const settings = {
        fontSize: 16,
        fontFamily: "Inter",
        textColor: "#ffffff",
        backgroundColor: "transparent",
        maxMessages: 50,
        ...initialSettings,
      };

      if (overlayId) {
        await updateOverlay({
          id: overlayId,
          name: name.trim(),
          type,
          channel: channel.trim() || undefined,
          settings,
        });
        toast.success("Overlay updated successfully");
      } else {
        await createOverlay({
          name: name.trim(),
          type,
          channel: channel.trim() || undefined,
          settings,
        });
        toast.success("Overlay created successfully");
      }

      setName("");
      setChannel("");
      onSuccess?.();
    } catch (error) {
      toast.error(`Failed to ${overlayId ? "update" : "create"} overlay`);
      console.error(error);
    }
  };

  const showChannelInput = type === "chat" || type === "emoji-wall";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {overlayId ? "Edit Overlay" : "Create New Overlay"}
        </CardTitle>
        <CardDescription>
          {overlayId
            ? "Update your overlay settings"
            : "Create a new chat, emoji wall, or ad overlay"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="My Chat Overlay"
              required
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id="type"
              onChange={(e) => setType(e.target.value as OverlayType)}
              value={type}
            >
              <option value="chat">Chat</option>
              <option value="emoji-wall">Emoji Wall</option>
              <option value="ad">Ad / Sponsors</option>
            </select>
          </div>

          {showChannelInput && (
            <div className="space-y-2">
              <Label htmlFor="channel">Twitch Channel (optional)</Label>
              <Input
                id="channel"
                onChange={(e) => setChannel(e.target.value)}
                placeholder="channelname"
                value={channel}
              />
            </div>
          )}

          <Button className="w-full" type="submit">
            {overlayId ? "Update Overlay" : "Create Overlay"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
