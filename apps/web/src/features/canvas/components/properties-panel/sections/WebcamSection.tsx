import { RotateCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OverlayElement, WebcamElement } from "@/features/canvas/types";
import {
  ColorSwatch,
  CompactInput,
  OptionalPropertySection,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface WebcamSectionProps {
  element: WebcamElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function WebcamSection({ element, onUpdate }: WebcamSectionProps) {
  return (
    <>
      <PanelSection title="Webcam Settings">
        <div className="space-y-3">
          <PropertyRow label="Shape">
            <Select
              onValueChange={(v) =>
                onUpdate(element.id, { shape: v } as Partial<WebcamElement>)
              }
              value={element.shape}
            >
              <SelectTrigger className="h-6 px-2 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
              </SelectContent>
            </Select>
          </PropertyRow>

          <PropertyRow label="Radius">
            <CompactInput
              className="w-full"
              icon={<RotateCw className="h-2.5 w-2.5" />}
              onChange={(v) =>
                onUpdate(element.id, {
                  borderRadius: Number.parseInt(v, 10) || 0,
                })
              }
              value={element.borderRadius}
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <OptionalPropertySection
        isSet={element.borderWidth > 0}
        onAdd={() =>
          onUpdate(element.id, { borderWidth: 4, borderColor: "#ffffff" })
        }
        onRemove={() =>
          onUpdate(element.id, { borderWidth: 0, borderColor: "transparent" })
        }
        title="Border"
      >
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={element.borderColor}
              onChange={(color) => onUpdate(element.id, { borderColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Width">
            <ScrubInput
              max={16}
              min={1}
              onChange={(v) => onUpdate(element.id, { borderWidth: v })}
              suffix="px"
              value={element.borderWidth}
            />
          </PropertyRow>
        </div>
      </OptionalPropertySection>

      <OptionalPropertySection
        isSet={element.shadowBlur > 0}
        onAdd={() =>
          onUpdate(element.id, {
            shadowBlur: 20,
            shadowColor: "rgba(0,0,0,0.5)",
          })
        }
        onRemove={() =>
          onUpdate(element.id, { shadowBlur: 0, shadowColor: "transparent" })
        }
        title="Shadow"
      >
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={element.shadowColor}
              onChange={(color) => onUpdate(element.id, { shadowColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Blur">
            <ScrubInput
              max={50}
              min={1}
              onChange={(v) => onUpdate(element.id, { shadowBlur: v })}
              suffix="px"
              value={element.shadowBlur}
            />
          </PropertyRow>
        </div>
      </OptionalPropertySection>
    </>
  );
}
