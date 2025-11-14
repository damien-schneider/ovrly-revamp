import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import WallEmoteOverlay from "@/components/wall-emote-overlay";
import { ObsOverlayContainer } from "@/components/obs-overlay-container";

export const Route = createFileRoute("/wall-emote/$id")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { queryClient } = context;
    await queryClient.prefetchQuery(
      convexQuery(api.overlays.getById, { id: params.id as Id<"overlays"> })
    );
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const overlayQuery = useSuspenseQuery(
    convexQuery(api.overlays.getById, { id: id as Id<"overlays"> })
  );

  if (!overlayQuery.data) {
    return (
      <ObsOverlayContainer>
        <div className="flex h-full items-center justify-center">
          <p>Overlay not found</p>
        </div>
      </ObsOverlayContainer>
    );
  }

  return (
    <ObsOverlayContainer>
      <WallEmoteOverlay overlayId={id as Id<"overlays">} />
    </ObsOverlayContainer>
  );
}
