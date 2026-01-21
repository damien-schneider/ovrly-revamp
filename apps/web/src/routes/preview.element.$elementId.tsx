import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { OverlayElement } from "@/features/canvas/types";
import { ElementType } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/preview/element/$elementId")({
  component: ElementPreviewPage,
});

function ElementPreviewPage() {
  const { elementId } = Route.useParams();

  const project = useQuery(api.projects.getByElementId, {
    elementId,
  });

  if (project === undefined) {
    return null; // Loading
  }

  if (project === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500 backdrop-blur-md">
          Element not found
        </div>
      </div>
    );
  }

  const elements = (project.elements as OverlayElement[]) || [];
  const element = elements.find((el) => el.id === elementId);

  if (!element) {
    return (
      <div className="flex h-screen items-center justify-center bg-transparent">
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500 backdrop-blur-md">
          Element not found in project
        </div>
      </div>
    );
  }

  // Calculate children if this is an overlay container
  const children =
    element.type === ElementType.OVERLAY
      ? elements.filter((el) => el.parentId === element.id)
      : [];

  // Sort children by zIndex for proper layering
  const sortedChildren = [...children].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: element.width,
        height: element.height,
        backgroundColor:
          element.type === ElementType.OVERLAY
            ? (element as { backgroundColor?: string }).backgroundColor
            : "transparent",
      }}
    >
      {/* Render the element itself if it's not just a container */}
      {element.type !== ElementType.OVERLAY && (
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: element.width,
            height: element.height,
            opacity: element.opacity,
            zIndex: element.zIndex,
            transform: `rotate(${element.rotation}deg)`,
          }}
        >
          <ElementRenderer
            element={element}
            isLiveView={true}
            projectId={project._id}
          />
        </div>
      )}

      {/* Render children if this is an overlay container */}
      {sortedChildren.map((child) => {
        if (!child.visible) {
          return null;
        }

        // Position children relative to the overlay container
        const relativeX = child.x - element.x;
        const relativeY = child.y - element.y;

        return (
          <div
            className="absolute"
            key={child.id}
            style={{
              left: relativeX,
              top: relativeY,
              width: child.width,
              height: child.height,
              opacity: child.opacity,
              zIndex: child.zIndex,
              transform: `rotate(${child.rotation}deg)`,
            }}
          >
            <ElementRenderer
              element={child}
              isLiveView={true}
              projectId={project._id}
            />
          </div>
        );
      })}
    </div>
  );
}
