import {
  createFileRoute,
  Navigate,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Header from "@/features/layout/components/header";
import LeftSidemenu from "@/features/left-sidemenu";
import RightSidemenu from "@/features/right-sidemenu";
import { BottombarTools } from "@/features/bottombar-tools";
import { TopbarTools } from "@/features/topbar-tools";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(with_navbar)")({
  component: LayoutComponent,
});

function LayoutComponent() {
  const pathname = useRouterState().location.pathname;
  const navigate = useNavigate();
  const isLoginRoute = pathname === "/login";
  const isAccountRoute = pathname === "/account";

  const isChatRoute = pathname.startsWith("/overlays/chat/");
  const isWallEmoteRoute = pathname.startsWith("/overlays/wall-emote/");
  const hasSettings = isChatRoute || isWallEmoteRoute;

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Login route handles its own authentication state
  if (isLoginRoute) {
    return <Outlet />;
  }

  // All other routes require authentication
  return (
    <>
      <Authenticated>
        <div className="flex h-svh gap-1 p-1 overflow-hidden relative">
          <div
            className={cn(
              "flex h-full flex-col gap-1 transition-all duration-500 ease-in-out overflow-hidden z-10",
              isAccountRoute ? "w-12 min-w-12 cursor-pointer opacity-50 hover:opacity-100" : "w-72 min-w-72"
            )}
            onClick={() => isAccountRoute && navigate({ to: "/overlays" })}
          >
            <div className={cn(
              "flex h-full flex-col gap-1 w-72 transition-transform duration-500 ease-in-out",
              isAccountRoute && "-translate-x-[calc(100%-3rem)] pointer-events-none"
            )}>
              <Header />
              <LeftSidemenu />
            </div>
          </div>
          
          <div className="flex-1 p-1 min-w-0 relative">
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
              "flex h-full flex-col gap-1 transition-all duration-500 ease-in-out overflow-hidden z-10 relative",
              isAccountRoute 
                ? "w-12 min-w-12 cursor-pointer opacity-50 hover:opacity-100" 
                : (hasSettings && isRightSidebarOpen ? "w-72 min-w-72" : "w-0 min-w-0")
            )}
            onClick={() => isAccountRoute && navigate({ to: "/overlays" })}
          >
             <div className={cn(
               "flex h-full flex-col gap-1 w-72 transition-transform duration-500 ease-in-out absolute right-0 top-0 bottom-0",
               isAccountRoute && "translate-x-[calc(100%-3rem)] pointer-events-none",
               !isAccountRoute && (!hasSettings || !isRightSidebarOpen) && "translate-x-full"
             )}>
              <div className="relative h-full w-full">
                <RightSidemenu />
                {!isAccountRoute && hasSettings && (
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="absolute top-2 left-2 h-6 w-6 rounded-full shadow-md z-50"
                    onClick={() => setIsRightSidebarOpen(false)}
                  >
                    <CaretRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Toggle button when closed */}
          {!isAccountRoute && hasSettings && !isRightSidebarOpen && (
            <div className="absolute right-2 top-20 z-20">
              <Button
                size="icon-sm"
                variant="secondary"
                className="h-8 w-8 rounded-full shadow-md"
                onClick={() => setIsRightSidebarOpen(true)}
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
