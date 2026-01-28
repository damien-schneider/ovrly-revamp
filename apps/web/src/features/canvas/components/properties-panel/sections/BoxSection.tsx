import type { BoxElement, OverlayElement } from "@/features/canvas/types";
import {
  ColorSwatch,
  CompactInput,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface BoxSectionProps {
  element: BoxElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function BoxFillSection({ element, onUpdate }: BoxSectionProps) {
  return (
    <PanelSection title="Fill">
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={element.backgroundColor}
            onChange={(color) =>
              onUpdate(element.id, {
                backgroundColor: color,
              } as Partial<BoxElement>)
            }
          />
        </PropertyRow>
      </div>
    </PanelSection>
  );
}

export function BoxStrokeSection({ element, onUpdate }: BoxSectionProps) {
  return (
    <PanelSection title="Stroke">
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={element.borderColor}
            onChange={(color) =>
              onUpdate(element.id, {
                borderColor: color,
              } as Partial<BoxElement>)
            }
          />
        </PropertyRow>
        <div className="grid grid-cols-2 gap-1.5">
          <CompactInput
            label="Width"
            onChange={(v) =>
              onUpdate(element.id, {
                borderWidth: Number(v),
              } as Partial<BoxElement>)
            }
            value={element.borderWidth}
          />
          <CompactInput
            label="Radius"
            onChange={(v) =>
              onUpdate(element.id, {
                borderRadius: Number(v),
              } as Partial<BoxElement>)
            }
            value={element.borderRadius}
          />
        </div>
      </div>
    </PanelSection>
  );
}
