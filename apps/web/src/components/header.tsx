import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FileRouteTypes } from "@/routeTree.gen";

const overlayMenuItems = [
  { to: "/overlays/chat", label: "Chat", icon: MessageSquare },
  { to: "/overlays/wall-emote", label: "Wall Emote", icon: Sparkles },
  // { to: "/music", label: "Music" },
] as const satisfies {
  to: FileRouteTypes["to"];
  label: string;
  icon: typeof MessageSquare;
}[];

export default function Header() {
  const pathname = useRouterState().location.pathname;

  return (
    <div className="h-14 w-72 rounded-xl bg-background-2">
      <nav className="flex gap-4">
        {pathname.includes("/overlays") && (
          <div className="flex items-center gap-2 p-2">
            {overlayMenuItems.map(({ to, label, icon: Icon }) => (
              <MenuItem icon={Icon} key={to} label={label} to={to} />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

const MenuItem = ({
  to,
  label,
  icon: Icon,
}: {
  to: FileRouteTypes["to"];
  label: string;
  icon: typeof MessageSquare;
}) => {
  const isActive = useRouterState().location.pathname.includes(to);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-3 py-1 transition-colors",
            isActive && "bg-background"
          )}
          to={to}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};
