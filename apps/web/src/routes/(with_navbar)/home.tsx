import { ChatCircleDots, Palette, Sparkle } from "@phosphor-icons/react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/(with_navbar)/home")({
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

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Link className="group block" to="/overlays">
          <Card className="group-hover:-translate-y-1 overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300">
            {/* Preview Area */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/50 shadow-sm transition-all duration-300 group-hover:shadow-md">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-purple-500/10 transition-colors group-hover:from-violet-500/20 group-hover:to-purple-500/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 dark:bg-zinc-900 dark:ring-white/10">
                  <motion.div layoutId="icon-overlays">
                    <Sparkle
                      className="h-10 w-10 text-violet-500"
                      weight="duotone"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4 pl-1">
              <h3 className="font-semibold text-xl tracking-tight">Overlays</h3>
              <p className="text-muted-foreground text-sm">
                Manage your chat overlays and emoji walls
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link className="group block" to="/assets">
          <Card className="group-hover:-translate-y-1 overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300">
            {/* Preview Area */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/50 shadow-sm transition-all duration-300 group-hover:shadow-md">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10 transition-colors group-hover:from-emerald-500/20 group-hover:to-teal-500/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 dark:bg-zinc-900 dark:ring-white/10">
                  <motion.div layoutId="icon-assets">
                    <Palette
                      className="h-10 w-10 text-emerald-500"
                      weight="duotone"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4 pl-1">
              <h3 className="font-semibold text-xl tracking-tight">Assets</h3>
              <p className="text-muted-foreground text-sm">
                Generate and manage emotes and sub badges
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link className="group block" to="/chat-interactions">
          <Card className="group-hover:-translate-y-1 overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300">
            {/* Preview Area */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/50 shadow-sm transition-all duration-300 group-hover:shadow-md">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 transition-colors group-hover:from-indigo-500/20 group-hover:to-purple-500/20">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 dark:bg-zinc-900 dark:ring-white/10">
                  <motion.div layoutId="icon-chat-interactions">
                    <ChatCircleDots
                      className="h-10 w-10 text-indigo-500"
                      weight="duotone"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4 pl-1">
              <h3 className="font-semibold text-xl tracking-tight">
                Chat Interactions
              </h3>
              <p className="text-muted-foreground text-sm">
                Manage commands and AI-powered responses
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
