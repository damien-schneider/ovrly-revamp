import { Robot, Sparkle, SquaresFour } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { path: "/overlays", icon: SquaresFour, label: "Overlays" },
  { path: "/assets", icon: Sparkle, label: "Assets" },
  { path: "/bot", icon: Robot, label: "Bot" },
] as const;

export default function Header() {
  const pathname = useRouterState().location.pathname;

  return (
    <div className="flex h-14 w-72 items-center gap-2">
      <div className="flex h-full flex-1 items-center rounded-xl bg-background-2 px-2">
        <nav className="flex w-full items-center gap-1">
          {mainNavItems.map(({ path, icon: Icon, label }) => {
            const isActive =
              path === "/overlays"
                ? pathname === "/overlays" || pathname.startsWith("/overlays/")
                : pathname === path || pathname.startsWith(`${path}/`);
            return (
              <Tooltip key={path}>
                <TooltipTrigger asChild>
                  <Link
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      isActive ? "bg-background" : "hover:bg-background/80"
                    )}
                    to={path}
                  >
                    <Icon
                      className="h-5 w-5"
                      weight={isActive ? "fill" : "regular"}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
