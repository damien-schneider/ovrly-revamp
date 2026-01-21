import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { OverlayElement } from "@/features/canvas/types";
import { ElementType } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/preview/overlay/$overlayId")({
  component: OverlayPreviewPage,
});

function OverlayPreviewPage() {
  const { overlayId } = Route.useParams();

  const project = useQuery(api.projects.getById, {
    id: overlayId as Id<"projects">,
  });

  if (project === undefined) {
    return null; // Loading
  }

  if (project === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500 backdrop-blur-md">
          Overlay not found
        </div>
      </div>
    );
  }

  const elements = (project.elements as OverlayElement[]) || [];

  // Find the main overlay container (if any) to use as root dimensions
  const overlayContainer = elements.find(
    (el) => el.type === ElementType.OVERLAY && el.parentId === null
  );

  // Sort elements by zIndex for proper layering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // Calculate offset based on overlay container position
  // In the canvas editor, elements are positioned in canvas coordinates
  // We need to offset them relative to the overlay container
  const offsetX = overlayContainer?.x ?? 0;
  const offsetY = overlayContainer?.y ?? 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: overlayContainer?.width ?? "100vw",
        height: overlayContainer?.height ?? "100vh",
        backgroundColor: overlayContainer
          ? (overlayContainer as { backgroundColor?: string }).backgroundColor
          : "transparent",
      }}
    >
      {sortedElements.map((el) => {
        if (!el.visible) {
          return null;
        }

        // Skip the root overlay container itself (it's the background)
        if (
          el.type === ElementType.OVERLAY &&
          el.parentId === null &&
          overlayContainer &&
          el.id === overlayContainer.id
        ) {
          return null;
        }

        // Offset element position relative to the overlay container
        const relativeX = el.x - offsetX;
        const relativeY = el.y - offsetY;

        return (
          <div
            className="absolute"
            key={el.id}
            style={{
              left: relativeX,
              top: relativeY,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              zIndex: el.zIndex,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            <ElementRenderer
              element={el}
              isLiveView={true}
              projectId={overlayId}
            />
          </div>
        );
      })}
    </div>
  );
}
