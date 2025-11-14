import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WallEmoteSettings } from "@/components/wall-emote-settings";

type WallEmoteRightPanelSettingsProps = {
  overlayId: Id<"overlays"> | undefined;
};

export default function WallEmoteRightPanelSettings({
  overlayId,
}: WallEmoteRightPanelSettingsProps) {
  if (!overlayId) {
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
        <WallEmoteSettings overlayId={overlayId} />
      </div>
    </ScrollArea>
  );
}
