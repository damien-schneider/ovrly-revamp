import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { OverlayNotFound } from "@/features/overlay/components/overlay-not-found";
import WallEmoteOverlay from "@/features/wall-emote/components/wall-emote-overlay";

export const Route = createFileRoute("/(with_navbar)/overlays/wall-emote/$id")({
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
  const { id } = Route.useParams();
  const overlay = useQuery(api.overlays.getById, { id: id as Id<"overlays"> });

  // undefined = loading, null = not found
  if (overlay === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (overlay === null) {
    return <OverlayNotFound />;
  }

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <WallEmoteOverlay overlayId={id as Id<"overlays">} />
    </div>
  );
}
