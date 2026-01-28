import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  type OverlayRow,
  overlayRowToElement,
} from "@/features/canvas/lib/overlay-conversion";
import { ElementType } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/overlays/view/$elementId")({
  component: ElementViewPage,
});

function ElementViewPage() {
  const { elementId } = Route.useParams();

  const overlay = useQuery(api.overlays.getById, {
    id: elementId as Id<"overlays">,
  });

  const children = useQuery(api.overlays.getChildren, {
    parentId: elementId as Id<"overlays">,
  });

  if (overlay === undefined || children === undefined) {
    return null; // Loading - show nothing in OBS
  }

  if (overlay === null) {
    return null; // Not found - show nothing in OBS
  }

  const element = overlayRowToElement(overlay as OverlayRow);
  const childElements = children.map((child) =>
    overlayRowToElement(child as OverlayRow)
  );

  // Sort children by zIndex for proper layering
  const sortedChildren = [...childElements].sort((a, b) => a.zIndex - b.zIndex);

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
          <ElementRenderer element={element} isLiveView />
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
            <ElementRenderer element={child} isLiveView />
          </div>
        );
      })}
    </div>
  );
}
