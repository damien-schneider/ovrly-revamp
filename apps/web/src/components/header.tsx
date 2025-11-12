import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { FileRouteTypes } from "@/routeTree.gen";

const overlayMenuItems = [
  { to: "/overlays/chat", label: "Chat" },
  { to: "/overlays/wall-emote", label: "Wall Emote" },
  // { to: "/music", label: "Music" },
] as const satisfies { to: FileRouteTypes["to"]; label: string }[];

export default function Header() {
  const pathname = useRouterState().location.pathname;

  return (
    <div className="flex flex-row items-center justify-between">
      <div className="h-14 w-72 rounded-xl bg-background-2">
        <nav className="flex gap-4 text-lg">
          {pathname.includes("/overlays") && (
            <div>
              {overlayMenuItems.map(({ to, label }) => (
                <MenuItem key={to} label={label} to={to} />
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2" />
    </div>
  );
}

const MenuItem = ({
  to,
  label,
}: {
  to: FileRouteTypes["to"];
  label: string;
}) => {
  const isActive = useRouterState().location.pathname.includes(to);
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        isActive && "bg-background"
      )}
      key={to}
      to={to}
    >
      {label}
    </Link>
  );
};
