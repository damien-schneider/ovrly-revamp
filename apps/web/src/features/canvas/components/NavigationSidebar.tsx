import { Link, useRouterState } from "@tanstack/react-router";
import { Bot, ChevronLeft, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { path: "/overlays", icon: Layers, label: "Overlays" },
  { path: "/assets", icon: Sparkles, label: "Assets" },
  { path: "/bot", icon: Bot, label: "Bot" },
] as const;

interface NavigationSidebarProps {
  saveStatus?: React.ReactNode;
}

export function NavigationSidebar({ saveStatus }: NavigationSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delay={400}>
      <div className="fixed top-4 left-4 z-100 flex h-10 w-fit items-center gap-1 rounded-xl border border-border/60 bg-background/95 p-1 shadow-lg backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/overlays">
              <Button
                className="h-8 w-8 border-none text-muted-foreground hover:bg-accent hover:text-foreground"
                size="icon-xs"
                variant="ghost"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent className="px-2 py-1 text-[10px]" side="bottom">
            Back to overlays
          </TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-4 w-px bg-border/50" />

        <div className="flex items-center gap-2 px-2.5">
          <div className="flex items-center">{saveStatus}</div>
        </div>
        <div className="mx-1 h-4 w-px bg-border/50" />

        {mainNavItems.map((item) => {
          const isActive =
            item.path === "/overlays"
              ? pathname === "/overlays" || pathname.startsWith("/overlays/")
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;

          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Link to={item.path}>
                  <Button
                    className={cn(
                      "h-8 w-8 border-none transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-[10px]" side="bottom">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
