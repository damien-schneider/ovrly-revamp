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
  BoxModelInput,
  ColorSwatch,
  getSliderValue,
  MessageBorderRadiusInput,
  OptionalPropertySection,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface ChatSectionProps {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

interface StyleProps {
  style: ChatStyle | undefined;
  onUpdateStyle: (updates: Partial<ChatStyle>) => void;
}

function ColorsSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <PanelSection title="Colors">
      <div className="space-y-2">
        <PropertyRow label="Background">
          <ColorSwatch
            color={style?.backgroundColor ?? defaultChatStyle.backgroundColor}
            onChange={(color) => onUpdateStyle({ backgroundColor: color })}
          />
        </PropertyRow>
        <PropertyRow label="Text">
          <ColorSwatch
            color={style?.textColor ?? defaultChatStyle.textColor}
            onChange={(color) => onUpdateStyle({ textColor: color })}
          />
        </PropertyRow>
        <PropertyRow label="Username">
          <ColorSwatch
            color={style?.usernameColor ?? defaultChatStyle.usernameColor}
            onChange={(color) => onUpdateStyle({ usernameColor: color })}
          />
        </PropertyRow>
        <PropertyRow label="Message BG">
          <ColorSwatch
            color={style?.messageBgColor ?? defaultChatStyle.messageBgColor}
            onChange={(color) => onUpdateStyle({ messageBgColor: color })}
          />
        </PropertyRow>
      </div>
    </PanelSection>
  );
}

function TextSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <PanelSection title="Text">
      <div className="space-y-2">
        <PropertyRow label="Font">
          <div className="flex-1">
            <FontPicker
              autoLoad
              defaultValue={style?.fontFamily ?? defaultChatStyle.fontFamily}
              value={(fontFamily) => onUpdateStyle({ fontFamily })}
            />
          </div>
        </PropertyRow>
        <PropertyRow label="Font Size">
          <div className="flex-1">
            <Slider
              max={32}
              min={10}
              onValueChange={(v) =>
                onUpdateStyle({ fontSize: getSliderValue(v) })
              }
              value={[style?.fontSize ?? 14]}
            />
          </div>
        </PropertyRow>
        <PropertyRow label="Container Radius">
          <div className="flex-1">
            <Slider
              max={32}
              min={0}
              onValueChange={(v) =>
                onUpdateStyle({ borderRadius: getSliderValue(v) })
              }
              value={[style?.borderRadius ?? 12]}
            />
          </div>
        </PropertyRow>
      </div>
    </PanelSection>
  );
}

function LayoutSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <PanelSection title="Message Layout">
      <BoxModelInput
        borderRadius={
          style?.messageBorderRadius ?? defaultChatStyle.messageBorderRadius
        }
        onPaddingChange={(v) => onUpdateStyle({ messagePadding: v })}
        onSpacingChange={(v) => onUpdateStyle({ messageSpacing: v })}
        padding={style?.messagePadding ?? defaultChatStyle.messagePadding}
        spacing={style?.messageSpacing ?? defaultChatStyle.messageSpacing}
      />
    </PanelSection>
  );
}

function BorderRadiusSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <PanelSection title="Message Border Radius">
      <MessageBorderRadiusInput
        corners={{
          tl:
            style?.messageBorderRadiusTL ??
            style?.messageBorderRadius ??
            defaultChatStyle.messageBorderRadius,
          tr:
            style?.messageBorderRadiusTR ??
            style?.messageBorderRadius ??
            defaultChatStyle.messageBorderRadius,
          bl:
            style?.messageBorderRadiusBL ??
            style?.messageBorderRadius ??
            defaultChatStyle.messageBorderRadius,
          br:
            style?.messageBorderRadiusBR ??
            style?.messageBorderRadius ??
            defaultChatStyle.messageBorderRadius,
        }}
        linked={style?.messageBorderRadiusLinked ?? true}
        onCornerChange={(corner, value) => {
          const cornerKey = {
            tl: "messageBorderRadiusTL",
            tr: "messageBorderRadiusTR",
            bl: "messageBorderRadiusBL",
            br: "messageBorderRadiusBR",
          }[corner] as keyof ChatStyle;
          onUpdateStyle({ [cornerKey]: value });
        }}
        onLinkedChange={(linked) =>
          onUpdateStyle({ messageBorderRadiusLinked: linked })
        }
      />
    </PanelSection>
  );
}

function OptionsSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <PanelSection title="Options">
      <div className="space-y-2">
        <PropertyRow label="Animation">
          <Select
            onValueChange={(v) =>
              onUpdateStyle({ animation: v as "fade" | "slide" | "none" })
            }
            value={style?.animation ?? "slide"}
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
            checked={style?.showBadges ?? true}
            onCheckedChange={(checked) =>
              onUpdateStyle({ showBadges: checked })
            }
          />
        </PropertyRow>
        <PropertyRow label="Direction">
          <Select
            onValueChange={(v) =>
              onUpdateStyle({
                messageDirection: v as "bottom-up" | "top-down",
              })
            }
            value={style?.messageDirection ?? "bottom-up"}
          >
            <SelectTrigger className="h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-up">New at bottom</SelectItem>
              <SelectItem value="top-down">New at top</SelectItem>
            </SelectContent>
          </Select>
        </PropertyRow>
        <PropertyRow className="justify-between" label="Fade Mask">
          <Switch
            checked={style?.maskEnabled ?? false}
            onCheckedChange={(checked) =>
              onUpdateStyle({ maskEnabled: checked })
            }
          />
        </PropertyRow>
        {style?.maskEnabled && (
          <PropertyRow label="Mask Size">
            <div className="flex-1">
              <Slider
                max={100}
                min={10}
                onValueChange={(v) =>
                  onUpdateStyle({ maskSize: getSliderValue(v) })
                }
                value={[style?.maskSize ?? 40]}
              />
            </div>
          </PropertyRow>
        )}
      </div>
    </PanelSection>
  );
}

function BorderSection({ style, onUpdateStyle }: StyleProps) {
  return (
    <OptionalPropertySection
      isSet={(style?.borderWidth ?? 0) > 0}
      onAdd={() => onUpdateStyle({ borderWidth: 2, borderColor: "#3b82f6" })}
      onRemove={() =>
        onUpdateStyle({ borderWidth: 0, borderColor: "transparent" })
      }
      title="Border"
    >
      <div className="space-y-2">
        <PropertyRow label="Color">
          <ColorSwatch
            color={style?.borderColor ?? "#3b82f6"}
            onChange={(color) => onUpdateStyle({ borderColor: color })}
          />
        </PropertyRow>
        <PropertyRow label="Width">
          <ScrubInput
            max={8}
            min={1}
            onChange={(v) => onUpdateStyle({ borderWidth: v })}
            suffix="px"
            value={style?.borderWidth ?? 2}
          />
        </PropertyRow>
      </div>
    </OptionalPropertySection>
  );
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

      <ColorsSection onUpdateStyle={updateChatStyle} style={element.style} />
      <TextSection onUpdateStyle={updateChatStyle} style={element.style} />
      <LayoutSection onUpdateStyle={updateChatStyle} style={element.style} />
      <BorderRadiusSection
        onUpdateStyle={updateChatStyle}
        style={element.style}
      />
      <OptionsSection onUpdateStyle={updateChatStyle} style={element.style} />
      <BorderSection onUpdateStyle={updateChatStyle} style={element.style} />
    </>
  );
}
