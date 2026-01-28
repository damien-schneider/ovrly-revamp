import type { ImageElement } from "@/features/canvas/types";

export function ImageWidget({ element }: { element: ImageElement }) {
  return (
    <img
      alt="overlay"
      height={element.height}
      src={element.src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: element.objectFit,
        opacity: element.opacity,
        pointerEvents: "none",
        borderRadius: element.borderRadius ?? 0,
        borderWidth: element.borderWidth ?? 0,
        borderColor: element.borderColor ?? "transparent",
        borderStyle: element.borderWidth ? "solid" : "none",
      }}
      width={element.width}
    />
  );
}
