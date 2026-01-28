import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  type OverlayRow,
  overlayRowToElement,
} from "@/features/canvas/lib/overlay-conversion";
import { ElementType } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/view/canvas")({
  component: OverlaysViewPage,
});

function OverlaysViewPage() {
  const overlayRows = useQuery(api.overlays.list);

  if (overlayRows === undefined) {
    return null; // Loading - show nothing in OBS
  }

  const elements = overlayRows.map((row) =>
    overlayRowToElement(row as OverlayRow)
  );

  // Find the main overlay container (if any) to use as root dimensions
  const overlayContainer = elements.find(
    (el) => el.type === ElementType.OVERLAY && el.parentId === null
  );

  // Sort elements by zIndex for proper layering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

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

        return (
          <div
            className="absolute"
            key={el.id}
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              zIndex: el.zIndex,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            <ElementRenderer element={el} isLiveView />
          </div>
        );
      })}
    </div>
  );
}
