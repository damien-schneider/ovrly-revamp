import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import AdOverlay from "@/features/ad/components/ad-overlay";
import { ObsOverlayContainer } from "@/features/overlay/components/obs-overlay-container";
import { OverlayNotFound } from "@/features/overlay/components/overlay-not-found";

export const Route = createFileRoute("/ad/$id")({
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
      <AdOverlay overlayId={id as Id<"overlays">} useEditMode={false} />
    </ObsOverlayContainer>
  );
}
