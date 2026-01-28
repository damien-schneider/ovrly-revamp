import { RotateCw } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { OverlayElement, WebcamElement } from "@/features/canvas/types";
import {
  CompactInput,
  getSliderValue,
  PanelSection,
  PropertyRow,
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

          <PropertyRow label="Border">
            <div className="flex items-center gap-2">
              <ColorPicker
                onChange={(color) =>
                  onUpdate(element.id, { borderColor: color })
                }
                size="compact"
                value={element.borderColor}
              />
              <CompactInput
                className="w-16"
                onChange={(v) =>
                  onUpdate(element.id, {
                    borderWidth: Number.parseInt(v, 10) || 0,
                  })
                }
                value={element.borderWidth}
              />
            </div>
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

      <PanelSection title="Shadow">
        <div className="space-y-3">
          <PropertyRow label="Color">
            <ColorPicker
              onChange={(color) => onUpdate(element.id, { shadowColor: color })}
              size="compact"
              value={element.shadowColor}
            />
          </PropertyRow>
          <PropertyRow label="Size">
            <Slider
              className="w-full"
              max={50}
              min={0}
              onValueChange={(v) =>
                onUpdate(element.id, {
                  shadowBlur: getSliderValue(v),
                })
              }
              value={[element.shadowBlur]}
            />
          </PropertyRow>
        </div>
      </PanelSection>
    </>
  );
}
