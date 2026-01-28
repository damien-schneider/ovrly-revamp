import type { ProgressBarElement } from "@/features/canvas/types";

interface ProgressBarWidgetProps {
  element: ProgressBarElement;
}

export function ProgressBarWidget({ element }: ProgressBarWidgetProps) {
  const {
    showLabel = false,
    labelColor = "#ffffff",
    labelPosition = "inside",
    animated = false,
    stripes = false,
  } = element;

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ opacity: element.opacity ?? 1 }}
    >
      {showLabel && labelPosition === "above" && (
        <span className="mb-1 font-bold text-xs" style={{ color: labelColor }}>
          {Math.round(element.progress)}%
        </span>
      )}
      <div
        className="relative flex flex-1 items-center"
        style={{
          backgroundColor: element.backgroundColor,
          borderRadius: element.borderRadius,
          overflow: "hidden",
          padding: "4px",
        }}
      >
        <div
          className={animated ? "animate-pulse" : ""}
          style={{
            width: `${element.progress}%`,
            height: "100%",
            backgroundColor: element.barColor,
            borderRadius: element.borderRadius / 2,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundImage: stripes
              ? "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)"
              : "none",
            backgroundSize: stripes ? "1rem 1rem" : "auto",
          }}
        >
          {showLabel && labelPosition === "inside" && (
            <span
              className="absolute inset-0 flex items-center justify-center font-bold text-xs"
              style={{ color: labelColor }}
            >
              {Math.round(element.progress)}%
            </span>
          )}
        </div>
      </div>
      {showLabel && labelPosition === "outside" && (
        <span className="mt-1 font-bold text-xs" style={{ color: labelColor }}>
          {Math.round(element.progress)}%
        </span>
      )}
    </div>
  );
}
