import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ObsOverlayContainer } from "@/features/overlay/components/obs-overlay-container";
import WallEmoteOverlay from "@/features/wall-emote/components/wall-emote-overlay";

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
