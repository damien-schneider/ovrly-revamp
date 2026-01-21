import { Link, useRouterState } from "@tanstack/react-router";
import { Layers, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: typeof Layers;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/overlays", icon: Layers, label: "Overlays" },
  { path: "/assets", icon: Sparkles, label: "Assets" },
  { path: "/chat-interactions", icon: MessageSquare, label: "Chat" },
];

export function NavigationSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full w-12 flex-col items-center gap-1 border-gray-200 border-r bg-white py-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        const Icon = item.icon;

        return (
          <Link
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            )}
            key={item.path}
            title={item.label}
            to={item.path}
          >
            <Icon className="h-5 w-5" />
          </Link>
        );
      })}
    </div>
  );
}
