import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  createFileRoute,
  Navigate,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/features/layout/components/header";
import LeftSidemenu from "@/features/layout/components/left-sidemenu";
import RightSidemenu from "@/features/layout/components/right-sidemenu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(with_navbar)")({
  component: LayoutComponent,
});

interface SidebarWrapperProps {
  children: ReactNode;
  shouldCollapse: boolean;
  interactive: boolean;
  onClick: () => void;
  className?: string;
  side: "left" | "right";
}

function SidebarWrapper({
  children,
  shouldCollapse,
  interactive,
  onClick,
  className,
  side,
}: SidebarWrapperProps) {
  let widthClass = "w-72 min-w-72";
  if (shouldCollapse) {
    if (side === "right" && className?.includes("w-0")) {
      widthClass = "w-0 min-w-0";
    } else {
      widthClass = "w-12 min-w-12";
    }
  }

  return (
    <button
      className={cn(
        "relative z-10 flex h-full flex-col gap-1 overflow-hidden border-none bg-transparent p-0 text-left transition-all duration-500 ease-in-out",
        widthClass,
        shouldCollapse &&
          (interactive
            ? "cursor-pointer opacity-50 hover:opacity-100"
            : "opacity-50"),
        className
      )}
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      type="button"
    >
      {children}
    </button>
  );
}

function LayoutComponent() {
  const pathname = useRouterState().location.pathname;
  const navigate = useNavigate();
  const isLoginRoute = pathname === "/login";
  const isIndexRoute = pathname === "/" || pathname === "";
  const isFeedbackRoute = pathname === "/feedback";
  const isAccountRoute = pathname === "/account";

  const hasSettings = false;
  const isHomeRoute = pathname === "/home";
  const isHubRoute =
    isHomeRoute || pathname === "/overlays" || pathname === "/overlays/";

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const shouldCollapse = isAccountRoute || isHubRoute;
  const interactive = shouldCollapse && !isHomeRoute;

  const navigateToOverlays = () => navigate({ to: "/overlays" });

  // Public routes that don't require authentication
  if (isLoginRoute || isIndexRoute || isFeedbackRoute) {
    return <Outlet />;
  }

  // All other routes require authentication
  return (
    <>
      <Authenticated>
        <div className="relative flex h-svh gap-1 overflow-hidden p-1">
          <SidebarWrapper
            interactive={interactive}
            onClick={navigateToOverlays}
            shouldCollapse={shouldCollapse}
            side="left"
          >
            <div
              className={cn(
                "flex h-full w-72 flex-col gap-1 transition-transform duration-500 ease-in-out",
                shouldCollapse &&
                  "pointer-events-none -translate-x-[calc(100%-3rem)]"
              )}
            >
              <Header />
              <LeftSidemenu />
            </div>
          </SidebarWrapper>

          <div className="relative min-w-0 flex-1 p-1">
            <div className="flex h-full w-full flex-col gap-1">
              <div className="flex flex-1 items-center justify-center overflow-y-auto">
                <Outlet />
              </div>
            </div>
          </div>

          <SidebarWrapper
            className={cn(
              !(shouldCollapse || (hasSettings && isRightSidebarOpen)) &&
                "w-0 min-w-0"
            )}
            interactive={interactive}
            onClick={navigateToOverlays}
            shouldCollapse={shouldCollapse}
            side="right"
          >
            <div
              className={cn(
                "absolute top-0 right-0 bottom-0 flex h-full w-72 flex-col gap-1 transition-transform duration-500 ease-in-out",
                shouldCollapse &&
                  "pointer-events-none translate-x-[calc(100%-3rem)]",
                !(shouldCollapse || (hasSettings && isRightSidebarOpen)) &&
                  "translate-x-full"
              )}
            >
              <div className="relative h-full w-full">
                <RightSidemenu />
                {!shouldCollapse && hasSettings && (
                  <Button
                    className="absolute top-2 left-2 z-50 h-6 w-6 rounded-full shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRightSidebarOpen(false);
                    }}
                    size="icon-sm"
                    variant="secondary"
                  >
                    <CaretRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </SidebarWrapper>

          {/* Toggle button when closed */}
          {!shouldCollapse && hasSettings && !isRightSidebarOpen && (
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
