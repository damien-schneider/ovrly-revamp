import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type {
  EmoteWallElement,
  EmoteWallStyle,
  OverlayElement,
} from "@/features/canvas/types";
import { getSliderValue, PanelSection, PropertyRow } from "../primitives";

interface EmoteWallSectionProps {
  element: EmoteWallElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function EmoteWallSection({ element, onUpdate }: EmoteWallSectionProps) {
  const updateEmoteStyle = (updates: Partial<EmoteWallStyle>) => {
    onUpdate(element.id, {
      style: { ...element.style, ...updates },
    } as Partial<EmoteWallElement>);
  };

  return (
    <>
      <PanelSection title="Emote Wall">
        <div className="space-y-2">
          <PropertyRow label="Preview">
            <Switch
              checked={element.previewEnabled ?? false}
              onCheckedChange={(checked) =>
                onUpdate(element.id, {
                  previewEnabled: checked,
                } as Partial<EmoteWallElement>)
              }
            />
          </PropertyRow>
          <PropertyRow label="Density">
            <div className="flex-1">
              <Slider
                max={10}
                min={1}
                onValueChange={(v) =>
                  onUpdate(element.id, { density: getSliderValue(v) })
                }
                value={[element.density]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Speed">
            <div className="flex-1">
              <Slider
                max={5}
                min={0.5}
                onValueChange={(v) =>
                  onUpdate(element.id, { speed: getSliderValue(v) })
                }
                step={0.1}
                value={[element.speed]}
              />
            </div>
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection defaultOpen={false} title="Physics">
        <div className="space-y-2">
          <PropertyRow label="Gravity">
            <Select
              onValueChange={(v) =>
                updateEmoteStyle({ gravity: v as EmoteWallStyle["gravity"] })
              }
              value={element.style?.gravity ?? "up"}
            >
              <SelectTrigger className="h-6 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="none">None (Float)</SelectItem>
              </SelectContent>
            </Select>
          </PropertyRow>
          <PropertyRow label="Spawn">
            <Select
              onValueChange={(v) =>
                updateEmoteStyle({
                  spawnMode: v as EmoteWallStyle["spawnMode"],
                })
              }
              value={element.style?.spawnMode ?? "bottom"}
            >
              <SelectTrigger className="h-6 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="sides">Sides</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </PropertyRow>
          <PropertyRow label="Bounce">
            <Switch
              checked={element.style?.bounceEnabled ?? false}
              onCheckedChange={(checked) =>
                updateEmoteStyle({ bounceEnabled: checked })
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection defaultOpen={false} title="Appearance">
        <div className="space-y-2">
          <PropertyRow label="Size">
            <div className="flex-1">
              <Slider
                max={96}
                min={16}
                onValueChange={(v) =>
                  updateEmoteStyle({ emoteSize: getSliderValue(v) })
                }
                value={[element.style?.emoteSize ?? 48]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Variation">
            <div className="flex-1">
              <Slider
                max={32}
                min={0}
                onValueChange={(v) =>
                  updateEmoteStyle({ emoteSizeVariation: getSliderValue(v) })
                }
                value={[element.style?.emoteSizeVariation ?? 16]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Rotation">
            <Switch
              checked={element.style?.rotationEnabled ?? true}
              onCheckedChange={(checked) =>
                updateEmoteStyle({ rotationEnabled: checked })
              }
            />
          </PropertyRow>
          <PropertyRow label="Fade Out">
            <Switch
              checked={element.style?.fadeOut ?? true}
              onCheckedChange={(checked) =>
                updateEmoteStyle({ fadeOut: checked })
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>
    </>
  );
}
