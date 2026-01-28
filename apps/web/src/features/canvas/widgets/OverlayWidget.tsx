import type { OverlayContainerElement } from "@/features/canvas/types";

export function OverlayWidget({
  element,
  isLiveView,
}: {
  element: OverlayContainerElement;
  isLiveView: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.backgroundColor || "transparent",
        position: "relative",
        border: isLiveView ? "none" : "2px solid rgba(37, 99, 235, 0.1)",
        borderRadius: isLiveView ? 0 : "4px",
        boxShadow: isLiveView ? "none" : "inset 0 0 10px rgba(0,0,0,0.02)",
        opacity: element.opacity ?? 1,
      }}
    >
      {!isLiveView && (
        <div className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-0.5 font-bold text-[10px] text-white uppercase tracking-wider opacity-60">
          {element.name}
        </div>
      )}
    </div>
  );
}
