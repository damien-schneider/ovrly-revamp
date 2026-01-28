import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type {
  OverlayElement,
  ProgressBarElement,
} from "@/features/canvas/types";
import {
  ColorSwatch,
  getSliderValue,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface ProgressBarSectionProps {
  element: ProgressBarElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function ProgressBarSection({
  element,
  onUpdate,
}: ProgressBarSectionProps) {
  return (
    <PanelSection title="Progress Bar">
      <div className="space-y-2">
        <PropertyRow label="Progress">
          <div className="flex-1">
            <Slider
              max={100}
              min={0}
              onValueChange={(v) =>
                onUpdate(element.id, {
                  progress: getSliderValue(v),
                } as Partial<ProgressBarElement>)
              }
              value={[element.progress]}
            />
          </div>
          <span className="w-8 text-right text-[10px] text-muted-foreground">
            {Math.round(element.progress)}%
          </span>
        </PropertyRow>
        <PropertyRow label="Bar Color">
          <ColorSwatch
            color={element.barColor}
            onChange={(color) =>
              onUpdate(element.id, {
                barColor: color,
              } as Partial<ProgressBarElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Background">
          <ColorSwatch
            color={element.backgroundColor}
            onChange={(color) =>
              onUpdate(element.id, {
                backgroundColor: color,
              } as Partial<ProgressBarElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Radius">
          <div className="flex-1">
            <Slider
              max={32}
              min={0}
              onValueChange={(v) =>
                onUpdate(element.id, {
                  borderRadius: getSliderValue(v),
                } as Partial<ProgressBarElement>)
              }
              value={[element.borderRadius]}
            />
          </div>
        </PropertyRow>
        <PropertyRow label="Show Label">
          <Switch
            checked={element.showLabel ?? false}
            onCheckedChange={(checked) =>
              onUpdate(element.id, {
                showLabel: checked,
              } as Partial<ProgressBarElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Animated">
          <Switch
            checked={element.animated ?? false}
            onCheckedChange={(checked) =>
              onUpdate(element.id, {
                animated: checked,
              } as Partial<ProgressBarElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Stripes">
          <Switch
            checked={element.stripes ?? false}
            onCheckedChange={(checked) =>
              onUpdate(element.id, {
                stripes: checked,
              } as Partial<ProgressBarElement>)
            }
          />
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
