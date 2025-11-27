import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { overlayTypes } from "@/features/overlay/overlay-types";

export const Route = createFileRoute("/(with_navbar)/overlays/")({
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
        {overlayTypes.map(
          ({
            to,
            title,
            description,
            icon: Icon,
            gradient,
            hoverGradient,
            iconColor,
          }) => (
            <Link className="group block" key={to} to={to}>
              <Card className="group-hover:-translate-y-1 overflow-hidden border-0 bg-transparent shadow-none transition-all duration-300">
                {/* Preview Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted/50 shadow-sm transition-all duration-300 group-hover:shadow-md">
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradient} transition-colors ${hoverGradient}`}
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 dark:bg-zinc-900 dark:ring-white/10">
                      <Icon
                        className={`h-10 w-10 ${iconColor}`}
                        weight="duotone"
                      />
                    </div>
                  </div>
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
