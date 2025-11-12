import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(with_navbar)/overlays/wall-emote/")({
  beforeLoad: ({ context, location }) => {
    const userId = (context as { userId?: string }).userId;

    if (!userId) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Wall Emote Overlays</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your wall emote overlays
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/overlays">
            <Button variant="outline">All Overlays</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
