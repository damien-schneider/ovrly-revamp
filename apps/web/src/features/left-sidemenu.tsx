import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { UserIcon } from "@phosphor-icons/react";
import { Link, useParams, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import OverlayForm from "@/components/overlay-form";
import OverlayListCompact from "@/components/overlay-list-compact";
import ThemeSwitcher from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { OverlayBasicSettings } from "@/features/overlay-basic-settings";

export default function LeftSidemenu() {
  const pathname = useRouterState().location.pathname;
  const params = useParams({ strict: false });
  const [showForm, setShowForm] = useState(false);

  const isChatRoute = pathname.startsWith("/overlays/chat");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote");

  let overlayId: Id<"overlays"> | undefined;
  if ((isChatRoute || isWallEmoteRoute) && params.id) {
    overlayId = params.id as Id<"overlays">;
  }

  const shouldShowOverlayList = isChatRoute || isWallEmoteRoute;

  let overlayType: "chat" | "emoji-wall" | null = null;
  if (isChatRoute) {
    overlayType = "chat";
  } else if (isWallEmoteRoute) {
    overlayType = "emoji-wall";
  }

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const renderOverlayContent = () => {
    if (showForm && overlayType) {
      return (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <OverlayForm
              initialType={overlayType}
              onSuccess={handleFormSuccess}
            />
            <Button
              className="w-full"
              onClick={() => setShowForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    if (overlayId && overlayType) {
      return (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <OverlayListCompact typeFilter={overlayType} />
          </div>
          <OverlayBasicSettings overlayId={overlayId} />
        </div>
      );
    }

    if (overlayType) {
      return (
        <div className="flex-1 overflow-y-auto">
          <OverlayListCompact typeFilter={overlayType} />
        </div>
      );
    }

    return null;
  };

  const getOverlayTypeLabel = () => {
    if (overlayType === "chat") {
      return "Chat Overlays";
    }
    if (overlayType === "emoji-wall") {
      return "Wall Emote Overlays";
    }
    return "";
  };

  const getCreateButtonLabel = () => {
    if (overlayType === "chat") {
      return "Create Chat Overlay";
    }
    if (overlayType === "emoji-wall") {
      return "Create Wall Emote Overlay";
    }
    return "";
  };

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex h-full w-72 min-w-72 flex-col rounded-xl bg-background-2">
        {shouldShowOverlayList && overlayType ? (
          <div className="flex flex-col overflow-hidden">
            <div className="border-border border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {getOverlayTypeLabel()}
                </h3>
              </div>
              {!showForm && (
                <Button
                  className="mt-3 h-8 w-full text-xs"
                  onClick={() => setShowForm(true)}
                  size="sm"
                >
                  {getCreateButtonLabel()}
                </Button>
              )}
            </div>
            {renderOverlayContent()}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-muted-foreground text-sm">Navigation</p>
          </div>
        )}
      </div>
      <div className="flex w-72 min-w-72 flex-col gap-1">
        <ThemeSwitcher />
        <Link className="w-full" to="/account">
          <Button
            className="h-12 w-full justify-start gap-2 rounded-xl bg-background-2"
            variant="ghost"
          >
            <UserIcon size={20} weight="regular" />
            <span>Account</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
