import type { OverlayElement } from "@/features/canvas/types";
import { CompactInput, PanelSection } from "../primitives";

interface LayoutSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function LayoutSection({ element, onUpdate }: LayoutSectionProps) {
  return (
    <PanelSection title="Layout">
      <div className="space-y-2">
        {/* Width/Height Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <CompactInput
            label="W"
            onChange={(v) => onUpdate(element.id, { width: Number(v) })}
            value={Math.round(element.width)}
          />
          <CompactInput
            label="H"
            onChange={(v) => onUpdate(element.id, { height: Number(v) })}
            value={Math.round(element.height)}
          />
        </div>
      </div>
    </PanelSection>
  );
}
