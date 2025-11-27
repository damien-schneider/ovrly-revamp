import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useParams, useRouterState } from "@tanstack/react-router";
import AdRightPanelSettings from "@/features/ad/components/ad-right-panel-settings";
import ChatRightPanelSettings from "@/features/chat/components/chat-right-panel-settings";
import WallEmoteRightPanelSettings from "@/features/wall-emote/components/wall-emote-right-panel-settings";

export default function RightSidemenu() {
  const pathname = useRouterState().location.pathname;
  const params = useParams({ strict: false });

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");
  const isAdRoute = pathname.startsWith("/overlays/ad/");

  const chatOverlayId =
    isChatRoute && params.id ? (params.id as Id<"overlays">) : undefined;
  const wallEmoteOverlayId =
    isWallEmoteRoute && params.id ? (params.id as Id<"overlays">) : undefined;
  const adOverlayId =
    isAdRoute && params.id ? (params.id as Id<"overlays">) : undefined;

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
    if (isAdRoute) {
      return (
        <AdRightPanelSettings
          key={adOverlayId || "loading"}
          overlayId={adOverlayId}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="h-full w-72 min-w-72 rounded-xl bg-background-2">
        {renderSettings()}
      </div>
      <div className="flex w-72 min-w-72 flex-col gap-1">
        {/* Additional settings and configuration will go here */}
      </div>
    </div>
  );
}
