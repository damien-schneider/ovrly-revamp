import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlendMode, OverlayElement } from "@/features/canvas/types";
import { PanelSection, PropertyRow } from "../primitives";

interface BlendModeSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

const blendModeOptions: { value: BlendMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
];

export function BlendModeSection({ element, onUpdate }: BlendModeSectionProps) {
  return (
    <PanelSection title="Blend">
      <PropertyRow label="Mode">
        <Select
          onValueChange={(value: BlendMode) =>
            onUpdate(element.id, { blendMode: value })
          }
          value={element.blendMode ?? "normal"}
        >
          <SelectTrigger className="h-7 flex-1 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {blendModeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>
    </PanelSection>
  );
}
