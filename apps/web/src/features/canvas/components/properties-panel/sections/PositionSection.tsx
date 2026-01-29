import { FlipHorizontal, FlipVertical, RotateCw } from "lucide-react";
import type { OverlayElement } from "@/features/canvas/types";
import { IconButton, PanelSection, ScrubInput } from "../primitives";

interface PositionSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function PositionSection({ element, onUpdate }: PositionSectionProps) {
  return (
    <PanelSection title="Position">
      <div className="space-y-2">
        {/* X/Y Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <ScrubInput
            label="X"
            onChange={(v) => onUpdate(element.id, { x: v })}
            value={Math.round(element.x)}
          />
          <ScrubInput
            label="Y"
            onChange={(v) => onUpdate(element.id, { y: v })}
            value={Math.round(element.y)}
          />
        </div>

        {/* Rotation Row */}
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <ScrubInput
              icon={<RotateCw className="h-3 w-3" />}
              max={360}
              min={-360}
              onChange={(v) => onUpdate(element.id, { rotation: v })}
              suffix="°"
              value={element.rotation ?? 0}
            />
          </div>
          <div className="flex overflow-hidden rounded-md border border-border/60">
            <IconButton
              className="rounded-none border-border/40 border-r"
              icon={
                <FlipHorizontal className="h-3 w-3 text-muted-foreground" />
              }
              tooltip="Flip horizontal"
              variant="subtle"
            />
            <IconButton
              className="rounded-none"
              icon={<FlipVertical className="h-3 w-3 text-muted-foreground" />}
              tooltip="Flip vertical"
              variant="subtle"
            />
          </div>
        </div>
      </div>
    </PanelSection>
  );
}
