import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BottombarTools } from "@/features/bottombar-tools";
import Header from "@/features/layout/components/header";
import LeftSidemenu from "@/features/left-sidemenu";
import RightSidemenu from "@/features/right-sidemenu";
import { TopbarTools } from "@/features/topbar-tools";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(with_navbar)")({
  component: LayoutComponent,
});

function LayoutComponent() {
  const pathname = useRouterState().location.pathname;
  const navigate = useNavigate();
  const isLoginRoute = pathname === "/login";
  const isIndexRoute = pathname === "/" || pathname === "";
  const isAccountRoute = pathname === "/account";

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");
  const hasSettings = isChatRoute || isWallEmoteRoute;
  const isHomeRoute = pathname === "/home";
  const isHubRoute =
    isHomeRoute || pathname === "/overlays" || pathname === "/overlays/";

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const shouldShowCollapsedSidebars = isAccountRoute || isHubRoute;
  const shouldBeInteractive = shouldShowCollapsedSidebars && !isHomeRoute;

  // Login route and index (landing) route handle their own authentication state
  if (isLoginRoute || isIndexRoute) {
    return <Outlet />;
  }

  // All other routes require authentication
  return (
    <>
      <Authenticated>
        <div className="relative flex h-svh gap-1 overflow-hidden p-1">
          <div
            className={cn(
              "z-10 flex h-full flex-col gap-1 overflow-hidden transition-all duration-500 ease-in-out",
              shouldShowCollapsedSidebars
                ? shouldBeInteractive
                  ? "w-12 min-w-12 cursor-pointer opacity-50 hover:opacity-100"
                  : "w-12 min-w-12 opacity-50"
                : "w-72 min-w-72"
            )}
            onClick={() => shouldBeInteractive && navigate({ to: "/overlays" })}
          >
            <div
              className={cn(
                "flex h-full w-72 flex-col gap-1 transition-transform duration-500 ease-in-out",
                shouldShowCollapsedSidebars &&
                  "-translate-x-[calc(100%-3rem)] pointer-events-none"
              )}
            >
              <Header />
              <LeftSidemenu />
            </div>
          </div>

          <div className="relative min-w-0 flex-1 p-1">
            <div className="flex h-full w-full flex-col gap-1">
              <TopbarTools />
              <div className="flex-1 overflow-y-auto">
                <Outlet />
              </div>
              <BottombarTools />
            </div>
          </div>

          <div
            className={cn(
              "relative z-10 flex h-full flex-col gap-1 overflow-hidden transition-all duration-500 ease-in-out",
              shouldShowCollapsedSidebars
                ? shouldBeInteractive
                  ? "w-12 min-w-12 cursor-pointer opacity-50 hover:opacity-100"
                  : "w-12 min-w-12 opacity-50"
                : hasSettings && isRightSidebarOpen
                  ? "w-72 min-w-72"
                  : "w-0 min-w-0"
            )}
            onClick={() => shouldBeInteractive && navigate({ to: "/overlays" })}
          >
            <div
              className={cn(
                "absolute top-0 right-0 bottom-0 flex h-full w-72 flex-col gap-1 transition-transform duration-500 ease-in-out",
                shouldShowCollapsedSidebars &&
                  "pointer-events-none translate-x-[calc(100%-3rem)]",
                !(
                  shouldShowCollapsedSidebars ||
                  (hasSettings && isRightSidebarOpen)
                ) && "translate-x-full"
              )}
            >
              <div className="relative h-full w-full">
                <RightSidemenu />
                {!shouldShowCollapsedSidebars && hasSettings && (
                  <Button
                    className="absolute top-2 left-2 z-50 h-6 w-6 rounded-full shadow-md"
                    onClick={() => setIsRightSidebarOpen(false)}
                    size="icon-sm"
                    variant="secondary"
                  >
                    <CaretRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Toggle button when closed */}
          {!shouldShowCollapsedSidebars &&
            hasSettings &&
            !isRightSidebarOpen && (
              <div className="absolute top-20 right-2 z-20">
                <Button
                  className="h-8 w-8 rounded-full shadow-md"
                  onClick={() => setIsRightSidebarOpen(true)}
                  size="icon-sm"
                  variant="secondary"
                >
                  <CaretLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
        </div>
      </Authenticated>
      <Unauthenticated>
        <Navigate
          search={{
            redirect: pathname,
          }}
          to="/login"
        />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-svh items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}
