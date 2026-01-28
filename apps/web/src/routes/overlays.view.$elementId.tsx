import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  type OverlayRow,
  overlayRowToElement,
} from "@/features/canvas/lib/overlay-conversion";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";

export const Route = createFileRoute("/overlays/view/$elementId")({
  component: ElementViewPage,
});

function ElementViewPage() {
  const { elementId } = Route.useParams();
  const element = useQuery(api.overlays.getById, {
    id: elementId as Id<"overlays">,
  });

  if (element === undefined) {
    return null; // Loading
  }

  if (element === null) {
    return null; // Not found - show nothing in OBS
  }

  const overlayElement = overlayRowToElement(element as OverlayRow);

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          width: overlayElement.width,
          height: overlayElement.height,
          opacity: overlayElement.opacity,
          transform: `rotate(${overlayElement.rotation}deg)`,
        }}
      >
        <ElementRenderer element={overlayElement} isLiveView />
      </div>
    </div>
  );
}
