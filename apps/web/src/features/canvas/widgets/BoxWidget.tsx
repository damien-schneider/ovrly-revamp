import type { BoxElement } from "@/features/canvas/types";

export function BoxWidget({ element }: { element: BoxElement }) {
  // Build border radius string from individual corners
  const borderRadius = `${element.borderRadiusTL}px ${element.borderRadiusTR}px ${element.borderRadiusBR}px ${element.borderRadiusBL}px`;

  // Only apply border if stroke is set (not null)
  const hasStroke =
    element.borderColor !== null && element.borderWidth !== null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor:
          element.gradient ?? element.backgroundColor ?? "transparent",
        borderColor: hasStroke ? (element.borderColor ?? undefined) : undefined,
        borderWidth: hasStroke ? (element.borderWidth ?? undefined) : undefined,
        borderStyle: hasStroke ? "solid" : "none",
        borderRadius,
        opacity: element.opacity,
        boxShadow: element.boxShadow ?? "none",
        background:
          element.gradient ?? element.backgroundColor ?? "transparent",
      }}
    />
  );
}
