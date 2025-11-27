import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AdSettings } from "@/features/ad/components/ad-settings";

type AdRightPanelSettingsProps = {
  overlayId: Id<"overlays"> | undefined;
};

export default function AdRightPanelSettings({
  overlayId,
}: AdRightPanelSettingsProps) {
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
      <div className="flex flex-col gap-4 p-2">
        <AdSettings overlayId={overlayId} />
      </div>
    </ScrollArea>
  );
}
