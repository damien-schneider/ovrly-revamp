import type React from "react";
import type { BaseElement, FilterSettings } from "@/features/canvas/types";

interface WidgetWrapperProps {
  element: BaseElement;
  children: React.ReactNode;
}

function buildFilterString(
  filters: FilterSettings | undefined
): string | undefined {
  if (!filters) {
    return undefined;
  }

  const parts: string[] = [];

  if (filters.blur !== undefined && filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.brightness !== undefined && filters.brightness !== 100) {
    parts.push(`brightness(${filters.brightness}%)`);
  }
  if (filters.contrast !== undefined && filters.contrast !== 100) {
    parts.push(`contrast(${filters.contrast}%)`);
  }
  if (filters.grayscale !== undefined && filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.saturate !== undefined && filters.saturate !== 100) {
    parts.push(`saturate(${filters.saturate}%)`);
  }
  if (filters.hueRotate !== undefined && filters.hueRotate !== 0) {
    parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  }
  if (filters.invert !== undefined && filters.invert > 0) {
    parts.push(`invert(${filters.invert}%)`);
  }
  if (filters.sepia !== undefined && filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function WidgetWrapper({ element, children }: WidgetWrapperProps) {
  const filterString = buildFilterString(element.filters);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: element.overflow ?? "visible",
        mixBlendMode: element.blendMode ?? "normal",
        filter: filterString,
      }}
    >
      {children}
    </div>
  );
}
