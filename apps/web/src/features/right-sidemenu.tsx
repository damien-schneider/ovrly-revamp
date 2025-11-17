import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useParams, useRouterState } from "@tanstack/react-router";
import ChatRightPanelSettings from "@/features/chat/components/chat-right-panel-settings";
import WallEmoteRightPanelSettings from "@/features/wall-emote/components/wall-emote-right-panel-settings";

export default function RightSidemenu() {
  const pathname = useRouterState().location.pathname;
  const params = useParams({ strict: false });

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");

  const chatOverlayId =
    isChatRoute && params.id ? (params.id as Id<"overlays">) : undefined;
  const wallEmoteOverlayId =
    isWallEmoteRoute && params.id ? (params.id as Id<"overlays">) : undefined;

  const renderSettings = () => {
    if (isChatRoute) {
      return (
        <ChatRightPanelSettings
          key={chatOverlayId || "loading"}
          overlayId={chatOverlayId}
        />
      );
    }
    if (isWallEmoteRoute) {
      return (
        <WallEmoteRightPanelSettings
          key={wallEmoteOverlayId || "loading"}
          overlayId={wallEmoteOverlayId}
        />
      );
    }
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Settings</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="h-full w-72 min-w-72 rounded-xl bg-background-2">
        {renderSettings()}
      </div>
      <div className="flex w-72 min-w-72 flex-col gap-1">
        {/* Additional settings and configuration will go here */}
      </div>
    </div>
  );
}
