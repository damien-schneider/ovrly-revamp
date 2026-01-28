import type { BoxElement } from "@/features/canvas/types";

export function BoxWidget({ element }: { element: BoxElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: element.gradient || element.backgroundColor,
        borderColor: element.borderColor,
        borderWidth: element.borderWidth,
        borderStyle: "solid",
        borderRadius: element.borderRadius,
        opacity: element.opacity,
        boxShadow: element.boxShadow || "none",
        background: element.gradient || element.backgroundColor,
      }}
    />
  );
}
