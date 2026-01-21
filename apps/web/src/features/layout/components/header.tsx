import { House, SquaresFour } from "@phosphor-icons/react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                    "bg-background"
                  )}
                  to="/overlays"
                >
                  <SquaresFour className="h-5 w-5" weight="fill" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Overlays</p>
              </TooltipContent>
            </Tooltip>
          )}
        </nav>
      </div>
    </div>
  );
}
