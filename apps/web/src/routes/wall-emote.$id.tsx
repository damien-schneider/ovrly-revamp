import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ObsOverlayContainer } from "@/features/overlay/components/obs-overlay-container";
import { OverlayNotFound } from "@/features/overlay/components/overlay-not-found";
import WallEmoteOverlay from "@/features/wall-emote/components/wall-emote-overlay";

export const Route = createFileRoute("/wall-emote/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: id as Id<"overlays"> })
  );

  if (overlayQuery.isLoading) {
    return null; // Transparent loading state for OBS
  }

  if (!overlayQuery.data) {
    return <OverlayNotFound />;
  }

  return (
    <ObsOverlayContainer>
      <WallEmoteOverlay overlayId={id as Id<"overlays">} />
    </ObsOverlayContainer>
  );
}
