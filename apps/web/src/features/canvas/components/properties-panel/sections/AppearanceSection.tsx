import { Eye, EyeOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { OverlayElement } from "@/features/canvas/types";
import {
  getSliderValue,
  IconButton,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface AppearanceSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function AppearanceSection({
  element,
  onUpdate,
}: AppearanceSectionProps) {
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
          <div className="flex-1">
            <Slider
              className="flex-1"
              max={100}
              min={0}
              onValueChange={(v) =>
                onUpdate(element.id, { opacity: getSliderValue(v) / 100 })
              }
              step={1}
              value={[Math.round((element.opacity ?? 1) * 100)]}
            />
          </div>
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {Math.round((element.opacity ?? 1) * 100)}%
          </span>
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
