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
  ChatElement,
  ChatStyle,
  OverlayElement,
} from "@/features/canvas/types";
import { defaultChatStyle } from "@/features/canvas/types";
import {
  ColorSwatch,
  getSliderValue,
  PanelSection,
  PropertyRow,
} from "../primitives";

interface ChatSectionProps {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function ChatSection({ element, onUpdate }: ChatSectionProps) {
  const updateChatStyle = (updates: Partial<ChatStyle>) => {
    onUpdate(element.id, {
      style: { ...element.style, ...updates },
    } as Partial<ChatElement>);
  };

  return (
    <>
      <PanelSection title="Chat">
        <div className="space-y-2">
          <PropertyRow label="Preview">
            <Switch
              checked={element.previewEnabled ?? false}
              onCheckedChange={(checked) =>
                onUpdate(element.id, {
                  previewEnabled: checked,
                } as Partial<ChatElement>)
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection title="Colors">
        <div className="space-y-2">
          <PropertyRow label="Background">
            <ColorSwatch
              color={
                element.style?.backgroundColor ??
                defaultChatStyle.backgroundColor
              }
              onChange={(color) => updateChatStyle({ backgroundColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Text">
            <ColorSwatch
              color={element.style?.textColor ?? defaultChatStyle.textColor}
              onChange={(color) => updateChatStyle({ textColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Username">
            <ColorSwatch
              color={
                element.style?.usernameColor ?? defaultChatStyle.usernameColor
              }
              onChange={(color) => updateChatStyle({ usernameColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Message BG">
            <ColorSwatch
              color={
                element.style?.messageBgColor ?? defaultChatStyle.messageBgColor
              }
              onChange={(color) => updateChatStyle({ messageBgColor: color })}
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection title="Styling">
        <div className="space-y-2">
          <PropertyRow label="Font Size">
            <div className="flex-1">
              <Slider
                max={32}
                min={10}
                onValueChange={(v) =>
                  updateChatStyle({ fontSize: getSliderValue(v) })
                }
                value={[element.style?.fontSize ?? 14]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Radius">
            <div className="flex-1">
              <Slider
                max={32}
                min={0}
                onValueChange={(v) =>
                  updateChatStyle({ borderRadius: getSliderValue(v) })
                }
                value={[element.style?.borderRadius ?? 12]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Padding">
            <div className="flex-1">
              <Slider
                max={24}
                min={0}
                onValueChange={(v) =>
                  updateChatStyle({ messagePadding: getSliderValue(v) })
                }
                value={[element.style?.messagePadding ?? 8]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Spacing">
            <div className="flex-1">
              <Slider
                max={24}
                min={0}
                onValueChange={(v) =>
                  updateChatStyle({ messageSpacing: getSliderValue(v) })
                }
                value={[element.style?.messageSpacing ?? 8]}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Animation">
            <Select
              onValueChange={(v) =>
                updateChatStyle({ animation: v as "fade" | "slide" | "none" })
              }
              value={element.style?.animation ?? "slide"}
            >
              <SelectTrigger className="h-6 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </PropertyRow>
          <PropertyRow label="Show Badges">
            <Switch
              checked={element.style?.showBadges ?? true}
              onCheckedChange={(checked) =>
                updateChatStyle({ showBadges: checked })
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection title="Border">
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={element.style?.borderColor ?? "transparent"}
              onChange={(color) => updateChatStyle({ borderColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Width">
            <div className="flex-1">
              <Slider
                max={8}
                min={0}
                onValueChange={(v) =>
                  updateChatStyle({ borderWidth: getSliderValue(v) })
                }
                value={[element.style?.borderWidth ?? 0]}
              />
            </div>
          </PropertyRow>
        </div>
      </PanelSection>
    </>
  );
}
