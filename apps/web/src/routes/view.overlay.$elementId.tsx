import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  type OverlayRow,
  overlayRowToElement,
} from "@/features/canvas/lib/overlay-conversion";
import { ElementType, type OverlayElement } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/view/overlay/$elementId")({
  component: ElementViewPage,
});

/**
 * Get the computed width/height style based on sizing mode
 * - "fill" mode: 100% of parent/viewport
 * - "fixed" mode: px value
 */
function getSizeStyle(element: OverlayElement): {
  width: string | number;
  height: string | number;
} {
  const widthMode = element.widthMode ?? "fixed";
  const heightMode = element.heightMode ?? "fixed";

  return {
    width: widthMode === "fill" ? "100%" : element.width,
    height: heightMode === "fill" ? "100%" : element.height,
  };
}

function ElementViewPage() {
  const { elementId } = Route.useParams();

  // Use public queries (no auth required) for OBS browser sources
  const overlay = useQuery(api.overlays.getByIdPublic, {
    id: elementId as Id<"overlays">,
  });

  const children = useQuery(api.overlays.getChildrenPublic, {
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

  // Get size styles respecting fill mode
  const containerSize = getSizeStyle(element);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: containerSize.width,
        height: containerSize.height,
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
            width: containerSize.width,
            height: containerSize.height,
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

        // Get child size respecting fill mode
        const childSize = getSizeStyle(child);
        const childWidthMode = child.widthMode ?? "fixed";
        const childHeightMode = child.heightMode ?? "fixed";

        return (
          <div
            className="absolute"
            key={child.id}
            style={{
              // Position: if fill mode, position at 0; otherwise use relative position
              left: childWidthMode === "fill" ? 0 : relativeX,
              top: childHeightMode === "fill" ? 0 : relativeY,
              // Size respects fill mode
              width: childSize.width,
              height: childSize.height,
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
