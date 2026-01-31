import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OverflowMode, OverlayElement } from "@/features/canvas/types";
import { PanelSection, PropertyRow } from "../primitives";

interface ClipSectionProps {
  element: OverlayElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

const overflowOptions: { value: OverflowMode; label: string }[] = [
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "clip", label: "Clip" },
];

export function ClipSection({ element, onUpdate }: ClipSectionProps) {
  return (
    <PanelSection title="Clip">
      <PropertyRow label="Overflow">
        <Select
          onValueChange={(value: OverflowMode) =>
            onUpdate(element.id, { overflow: value })
          }
          value={element.overflow ?? "visible"}
        >
          <SelectTrigger className="h-7 flex-1 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {overflowOptions.map((option) => (
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
