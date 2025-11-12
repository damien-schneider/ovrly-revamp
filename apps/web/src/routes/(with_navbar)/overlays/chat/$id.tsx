import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import ChatOverlay from "@/components/chat-overlay";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/(with_navbar)/overlays/chat/$id")({
  beforeLoad: ({ context, location }) => {
    // Access userId from parent route context (set in __root.tsx beforeLoad)
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
  const { id } = Route.useParams();
  const overlay = useQuery(api.overlays.getById, { id: id as Id<"overlays"> });

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="font-bold text-2xl">Chat Overlay Preview</h1>
          <p className="text-muted-foreground text-sm">
            {overlay.name || "Untitled Chat Overlay"}
          </p>
        </div>
        <Link to="/overlays">
          <Button variant="outline">Back to Overlays</Button>
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatOverlay overlayId={id as Id<"overlays">} />
      </div>
    </div>
  );
}
