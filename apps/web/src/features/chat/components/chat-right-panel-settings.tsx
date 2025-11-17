import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { ChatSettings } from "@/features/chat/components/chat-settings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type ChatRightPanelSettingsProps = {
  overlayId: Id<"overlays"> | undefined;
};

export default function ChatRightPanelSettings({
  overlayId,
}: ChatRightPanelSettingsProps) {
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
        {overlayId && <ChatSettings overlayId={overlayId} />}
      </div>
    </ScrollArea>
  );
}
