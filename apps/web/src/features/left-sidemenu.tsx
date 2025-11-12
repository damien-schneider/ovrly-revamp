import { UserIcon } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import OverlayForm from "@/components/overlay-form";
import OverlayListCompact from "@/components/overlay-list-compact";
import ThemeSwitcher from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

export default function LeftSidemenu() {
  const pathname = useRouterState().location.pathname;
  const [showForm, setShowForm] = useState(false);

  const isChatRoute = pathname.startsWith("/overlays/chat");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote");

  const shouldShowOverlayList = isChatRoute || isWallEmoteRoute;
  const overlayType = isChatRoute
    ? "chat"
    : isWallEmoteRoute
      ? "emoji-wall"
      : null;

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="flex h-full w-72 min-w-72 flex-col rounded-xl bg-background-2">
        {shouldShowOverlayList && overlayType ? (
          <div className="flex flex-col overflow-hidden">
            <div className="border-border border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {overlayType === "chat"
                    ? "Chat Overlays"
                    : "Wall Emote Overlays"}
                </h3>
              </div>
              {!showForm && (
                <Button
                  className="mt-3 h-8 w-full text-xs"
                  onClick={() => setShowForm(true)}
                  size="sm"
                >
                  Create {overlayType === "chat" ? "Chat" : "Wall Emote"}{" "}
                  Overlay
                </Button>
              )}
            </div>
            {showForm ? (
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
            ) : (
              <div className="flex-1 overflow-y-auto">
                <OverlayListCompact typeFilter={overlayType} />
              </div>
            )}
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
