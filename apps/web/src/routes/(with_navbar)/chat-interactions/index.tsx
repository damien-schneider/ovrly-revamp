import { ChatCircleDots, Robot } from "@phosphor-icons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/(with_navbar)/chat-interactions/")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;
    if (!userId) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: RouteComponent,
});

const subFeatures = [
  {
    to: "/chat-interactions/commands",
    title: "Commands",
    description: "Manage custom chat commands and responses",
    icon: ChatCircleDots,
    gradient: "from-indigo-500/10 to-purple-500/10",
    hoverGradient:
      "group-hover:from-indigo-500/20 group-hover:to-purple-500/20",
    iconColor: "text-indigo-500",
    layoutId: "icon-commands",
    isComingSoon: false,
  },
  {
    to: "/chat-interactions",
    title: "AI Reply",
    description: "Coming soon - AI-powered chat responses",
    icon: Robot,
    gradient: "from-pink-500/10 to-rose-500/10",
    hoverGradient: "group-hover:from-pink-500/20 group-hover:to-rose-500/20",
    iconColor: "text-pink-500",
    layoutId: "icon-ai-reply",
    isComingSoon: true,
  },
] as const;

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {subFeatures.map(
          ({
            to,
            title,
            description,
            icon: Icon,
            gradient,
            hoverGradient,
            iconColor,
            layoutId,
            isComingSoon,
          }) => (
            <Link
              className="group block"
              disabled={isComingSoon}
              key={to}
              to={to}
            >
              <Card
                className={`overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300 ${isComingSoon ? "cursor-not-allowed opacity-60" : "group-hover:-translate-y-1"}`}
              >
                {/* Preview Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/50 shadow-sm transition-all duration-300 group-hover:shadow-md">
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradient} transition-colors ${hoverGradient}`}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 dark:bg-zinc-900 dark:ring-white/10">
                      <motion.div layoutId={layoutId}>
                        <Icon
                          className={`h-10 w-10 ${iconColor}`}
                          weight="duotone"
                        />
                      </motion.div>
                    </div>
                  </div>
                  {isComingSoon && (
                    <div className="absolute top-3 right-3 rounded-full bg-background/80 px-3 py-1 font-medium text-xs backdrop-blur-sm">
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-4 pl-1">
                  <h3 className="font-semibold text-xl tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
