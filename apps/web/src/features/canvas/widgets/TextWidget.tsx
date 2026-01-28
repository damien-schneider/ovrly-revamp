import type { TextElement } from "@/features/canvas/types";

function getTextAlignment(textAlign: string): string {
  if (textAlign === "center") {
    return "center";
  }
  if (textAlign === "right") {
    return "flex-end";
  }
  return "flex-start";
}

export function TextWidget({ element }: { element: TextElement }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: getTextAlignment(element.textAlign),
        color: element.color,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        opacity: element.opacity,
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        textShadow: element.textShadow || "none",
        letterSpacing: element.letterSpacing
          ? `${element.letterSpacing}px`
          : undefined,
        lineHeight: element.lineHeight ? element.lineHeight : undefined,
      }}
    >
      {element.content}
    </div>
  );
}
