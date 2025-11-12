import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";

interface WallEmoteOverlayProps {
  overlayId: Id<"overlays">;
}

export default function WallEmoteOverlay({ overlayId }: WallEmoteOverlayProps) {
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: overlayId })
  );
  const overlay = overlayQuery.data;

  if (overlayQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Overlay not found</p>
      </div>
    );
  }

  if (overlay.type !== "emoji-wall") {
    return (
      <div className="flex h-full items-center justify-center">
        <p>This overlay is not a wall-emote overlay</p>
      </div>
    );
  }

  const settings = overlay.settings as {
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    backgroundColor?: string;
  };

  return (
    <div
      className="flex size-full items-center justify-center overflow-hidden"
      style={{
        backgroundColor: settings.backgroundColor || "transparent",
        color: settings.textColor || "#ffffff",
        fontFamily: settings.fontFamily || "Inter, sans-serif",
        fontSize: `${settings.fontSize || 16}px`,
      }}
    >
      <div className="text-center">
        <p className="font-bold text-2xl">Wall Emote Overlay</p>
        <p className="mt-2 text-muted-foreground">{overlay.name}</p>
      </div>
    </div>
  );
}
