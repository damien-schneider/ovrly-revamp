import type { Icon } from "@phosphor-icons/react";
import { House } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { overlayTypes } from "@/features/overlay/overlay-types";
import { cn } from "@/lib/utils";
import type { FileRouteTypes } from "@/routeTree.gen";

export default function Header() {
  const pathname = useRouterState().location.pathname;

  return (
    <div className="flex h-14 w-72 items-center gap-2">
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background-2 transition-colors hover:bg-background"
              to="/home"
            >
              <House className="h-5 w-5" weight="regular" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Home</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex h-full flex-1 items-center rounded-xl bg-background-2 px-2">
        <nav className="flex w-full items-center gap-1">
          {pathname.includes("/overlays") && (
            <div className="flex w-full items-center gap-1">
              {overlayTypes.map(({ to, label, icon, menuClassName }) => (
                <MenuItem
                  className={menuClassName}
                  icon={icon}
                  key={to}
                  label={label}
                  to={to}
                />
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}

const MenuItem = ({
  to,
  label,
  icon: IconComponent,
  className,
}: {
  to: FileRouteTypes["to"];
  label: string;
  icon: Icon;
  className?: string;
}) => {
  const isActive = useRouterState().location.pathname.includes(to);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            isActive && "bg-background",
            !isActive && "hover:bg-background/50",
            className
          )}
          to={to}
        >
          <IconComponent
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
};
