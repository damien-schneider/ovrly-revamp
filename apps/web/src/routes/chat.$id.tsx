import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChatOverlay from "@/components/chat-overlay";

export const Route = createFileRoute("/chat/$id")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { queryClient } = context;
    await queryClient.prefetchQuery(
      convexQuery(api.overlays.getById, { id: params.id as any })
    );
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const overlayQuery = useSuspenseQuery(
    convexQuery(api.overlays.getById, { id: id as any })
  );

  if (!overlayQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Overlay not found</p>
      </div>
    );
  }

  return <ChatOverlay overlayId={id as any} />;
}
