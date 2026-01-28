import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { OverlayElement, TextElement } from "@/features/canvas/types";
import {
  ColorSwatch,
  CompactInput,
  PanelSection,
  PropertyRow,
  ToggleButton,
} from "../primitives";

interface TextSectionProps {
  element: TextElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function TextSection({ element, onUpdate }: TextSectionProps) {
  return (
    <PanelSection title="Text">
      <div className="space-y-2">
        <Textarea
          className="min-h-16 resize-none text-[11px]"
          onChange={(e) =>
            onUpdate(element.id, {
              content: e.target.value,
            } as Partial<TextElement>)
          }
          placeholder="Enter text..."
          value={element.content}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Color</Label>
            <ColorSwatch
              color={element.color}
              onChange={(color) =>
                onUpdate(element.id, { color } as Partial<TextElement>)
              }
            />
          </div>
          <CompactInput
            label="Size"
            onChange={(v) =>
              onUpdate(element.id, {
                fontSize: Number(v),
              } as Partial<TextElement>)
            }
            value={element.fontSize}
          />
        </div>
        <PropertyRow label="Align">
          <div className="flex rounded bg-muted/50 p-0.5">
            <ToggleButton
              checked={element.textAlign === "left"}
              icon={<AlignLeft className="h-3 w-3" />}
              onChange={() =>
                onUpdate(element.id, {
                  textAlign: "left",
                } as Partial<TextElement>)
              }
              tooltip="Align Left"
            />
            <ToggleButton
              checked={element.textAlign === "center"}
              icon={<AlignCenter className="h-3 w-3" />}
              onChange={() =>
                onUpdate(element.id, {
                  textAlign: "center",
                } as Partial<TextElement>)
              }
              tooltip="Align Center"
            />
            <ToggleButton
              checked={element.textAlign === "right"}
              icon={<AlignRight className="h-3 w-3" />}
              onChange={() =>
                onUpdate(element.id, {
                  textAlign: "right",
                } as Partial<TextElement>)
              }
              tooltip="Align Right"
            />
          </div>
        </PropertyRow>
        <PropertyRow label="Weight">
          <Select
            onValueChange={(v) =>
              onUpdate(element.id, {
                fontWeight: v,
              } as Partial<TextElement>)
            }
            value={element.fontWeight}
          >
            <SelectTrigger className="h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="100">Thin</SelectItem>
              <SelectItem value="300">Light</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
              <SelectItem value="900">Black</SelectItem>
            </SelectContent>
          </Select>
        </PropertyRow>
      </div>
    </PanelSection>
  );
}
