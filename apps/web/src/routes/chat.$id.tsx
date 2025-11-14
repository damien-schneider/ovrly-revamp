import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChatOverlay from "@/components/chat-overlay";
import { ObsOverlayContainer } from "@/components/obs-overlay-container";

export const Route = createFileRoute("/chat/$id")({
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

  // Public view - use Convex query directly (not atoms) for consistency across browsers/OBS
  return (
    <ObsOverlayContainer>
      <ChatOverlay overlayId={id as Id<"overlays">} useEditMode={false} />
    </ObsOverlayContainer>
  );
}
