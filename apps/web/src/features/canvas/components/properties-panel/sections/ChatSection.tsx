import { User } from "lucide-react";
import FontPicker from "react-fontpicker-ts-lite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useProviderData } from "@/features/auth/hooks/use-provider-token";
import type {
  ChatElement,
  ChatStyle,
  OverlayElement,
} from "@/features/canvas/types";
import { defaultChatStyle } from "@/features/canvas/types";
import {
  ColorSwatch,
  getSliderValue,
  OptionalPropertySection,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface ChatSectionProps {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

export function ChatSection({ element, onUpdate }: ChatSectionProps) {
  const { twitchUsername, isLoading: isLoadingAuth } = useProviderData();

  const updateChatStyle = (updates: Partial<ChatStyle>) => {
    onUpdate(element.id, {
      style: { ...element.style, ...updates },
    } as Partial<ChatElement>);
  };

  const handleAutoFillChannel = () => {
    if (twitchUsername) {
      onUpdate(element.id, {
        channel: twitchUsername,
      } as Partial<ChatElement>);
    }
  };

  return (
    <>
      <PanelSection title="Channel">
        <div className="space-y-2">
          <PropertyRow label="Username">
            <div className="flex flex-1 gap-1">
              <Input
                className="h-6 flex-1 text-[11px]"
                onChange={(e) =>
                  onUpdate(element.id, {
                    channel: e.target.value.toLowerCase().trim(),
                  } as Partial<ChatElement>)
                }
                placeholder="twitch_username"
                value={element.channel ?? ""}
              />
              <Button
                className="h-6 w-6 shrink-0 p-0"
                disabled={!twitchUsername || isLoadingAuth}
                onClick={handleAutoFillChannel}
                size="icon"
                title={
                  twitchUsername
                    ? `Use your channel: ${twitchUsername}`
                    : "Connect Twitch to auto-fill"
                }
                variant="outline"
              >
                <User className="h-3 w-3" />
              </Button>
            </div>
          </PropertyRow>
          {!element.channel && (
            <p className="text-[10px] text-muted-foreground">
              Enter a Twitch username to display live chat
            </p>
          )}
          {element.channel && (
            <p className="text-[10px] text-green-500">
              Connected to #{element.channel}
            </p>
          )}
        </div>
      </PanelSection>

      <PanelSection title="Display">
        <div className="space-y-2">
          <PropertyRow className="justify-between" label="Preview">
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
          <PropertyRow label="Font">
            <div className="flex-1">
              <FontPicker
                autoLoad
                defaultValue={
                  element.style?.fontFamily ?? defaultChatStyle.fontFamily
                }
                value={(fontFamily) => updateChatStyle({ fontFamily })}
              />
            </div>
          </PropertyRow>
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
          <PropertyRow className="justify-between" label="Show Badges">
            <Switch
              checked={element.style?.showBadges ?? true}
              onCheckedChange={(checked) =>
                updateChatStyle({ showBadges: checked })
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <OptionalPropertySection
        isSet={(element.style?.borderWidth ?? 0) > 0}
        onAdd={() =>
          updateChatStyle({ borderWidth: 2, borderColor: "#3b82f6" })
        }
        onRemove={() =>
          updateChatStyle({ borderWidth: 0, borderColor: "transparent" })
        }
        title="Border"
      >
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={element.style?.borderColor ?? "#3b82f6"}
              onChange={(color) => updateChatStyle({ borderColor: color })}
            />
          </PropertyRow>
          <PropertyRow label="Width">
            <ScrubInput
              max={8}
              min={1}
              onChange={(v) => updateChatStyle({ borderWidth: v })}
              suffix="px"
              value={element.style?.borderWidth ?? 2}
            />
          </PropertyRow>
        </div>
      </OptionalPropertySection>
    </>
  );
}
