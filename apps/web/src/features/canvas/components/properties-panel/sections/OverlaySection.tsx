import type {
  OverlayContainerElement,
  OverlayElement,
} from "@/features/canvas/types";
import { ColorSwatch, PanelSection, PropertyRow } from "../primitives";

interface OverlaySectionProps {
  element: OverlayContainerElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function OverlaySection({ element, onUpdate }: OverlaySectionProps) {
  return (
    <PanelSection title="Fill">
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={element.backgroundColor}
            onChange={(color) =>
              onUpdate(element.id, {
                backgroundColor: color,
              } as Partial<OverlayContainerElement>)
            }
          />
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
