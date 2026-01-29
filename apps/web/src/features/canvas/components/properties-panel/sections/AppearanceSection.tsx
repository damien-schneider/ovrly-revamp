import { Eye, EyeOff } from "lucide-react";
import type { OverlayElement } from "@/features/canvas/types";
import {
  IconButton,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface AppearanceSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function AppearanceSection({
  element,
  onUpdate,
}: AppearanceSectionProps) {
  const opacityPercent = Math.round((element.opacity ?? 1) * 100);

  return (
    <PanelSection
      actions={
        <IconButton
          icon={
            element.visible !== false ? (
              <Eye className="h-3 w-3 text-muted-foreground" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )
          }
          onClick={() =>
            onUpdate(element.id, { visible: !(element.visible !== false) })
          }
          tooltip="Toggle visibility"
        />
      }
      title="Appearance"
    >
      <div className="space-y-2">
        {/* Opacity Row */}
        <PropertyRow label="Opacity">
          <ScrubInput
            className="flex-1"
            max={100}
            min={0}
            onChange={(v) => onUpdate(element.id, { opacity: v / 100 })}
            suffix="%"
            value={opacityPercent}
          />
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
