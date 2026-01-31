import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FontPicker } from "@/components/ui/font-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  OptionalPropertySection,
  PanelSection,
  PropertyRow,
  ScrubInput,
} from "../primitives";

interface ChatSectionProps {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}

interface StyleSectionProps {
  style: ChatStyle | undefined;
  onUpdateStyle: (updates: Partial<ChatStyle>) => void;
}

// Helper to check if a color is set (not transparent/none)
function isColorSet(color: string | undefined): boolean {
  if (!color) {
    return false;
  }
  const normalized = color.toLowerCase().trim();
  return (
    normalized !== "transparent" && normalized !== "none" && normalized !== ""
  );
}

function ChannelSection({
  element,
  onUpdate,
}: {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}) {
  const { twitchUsername, isLoading: isLoadingAuth } = useProviderData();

  const handleAutoFillChannel = () => {
    if (twitchUsername) {
      onUpdate(element.id, {
        channel: twitchUsername,
      } as Partial<ChatElement>);
    }
  };

  return (
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
  );
}

function DisplaySection({
  element,
  onUpdate,
}: {
  element: ChatElement;
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
}) {
  return (
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
  );
}

function ContainerStyleSection({ style, onUpdateStyle }: StyleSectionProps) {
  const hasContainerFill = isColorSet(style?.backgroundColor);
  const hasContainerBorder = (style?.borderWidth ?? 0) > 0;

  return (
    <>
      <PanelSection title="Container">
        <div className="space-y-2">
          <PropertyRow label="Border Radius">
            <ScrubInput
              max={48}
              min={0}
              onChange={(v) => onUpdateStyle({ borderRadius: v })}
              suffix="px"
              value={style?.borderRadius ?? defaultChatStyle.borderRadius}
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <OptionalPropertySection
        isSet={hasContainerFill}
        onAdd={() => onUpdateStyle({ backgroundColor: "rgba(0, 0, 0, 0.7)" })}
        onRemove={() => onUpdateStyle({ backgroundColor: "transparent" })}
        title="Container Fill"
      >
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={style?.backgroundColor ?? "rgba(0, 0, 0, 0.7)"}
              onChange={(color) => onUpdateStyle({ backgroundColor: color })}
            />
          </PropertyRow>
        </div>
      </OptionalPropertySection>

      <OptionalPropertySection
        isSet={hasContainerBorder}
        onAdd={() => onUpdateStyle({ borderWidth: 2, borderColor: "#3b82f6" })}
        onRemove={() =>
          onUpdateStyle({ borderWidth: 0, borderColor: "transparent" })
        }
        title="Container Border"
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
    </>
  );
}

function MessageStyleSection({ style, onUpdateStyle }: StyleSectionProps) {
  const hasMessageFill = isColorSet(style?.messageBgColor);

  return (
    <>
      <PanelSection title="Message Text">
        <div className="space-y-2">
          <PropertyRow label="Text Color">
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
          <PropertyRow label="Font">
            <div className="flex-1">
              <FontPicker
                onChange={(fontFamily) => onUpdateStyle({ fontFamily })}
                value={style?.fontFamily ?? defaultChatStyle.fontFamily}
              />
            </div>
          </PropertyRow>
          <PropertyRow label="Size">
            <ScrubInput
              max={48}
              min={8}
              onChange={(v) => onUpdateStyle({ fontSize: v })}
              suffix="px"
              value={style?.fontSize ?? defaultChatStyle.fontSize}
            />
          </PropertyRow>
        </div>
      </PanelSection>

      <PanelSection title="Message Layout">
        <BoxModelInput
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
          onCornersChange={(corner, value) => {
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
          onPaddingChange={(v) => onUpdateStyle({ messagePadding: v })}
          onSpacingChange={(v) => onUpdateStyle({ messageSpacing: v })}
          padding={style?.messagePadding ?? defaultChatStyle.messagePadding}
          spacing={style?.messageSpacing ?? defaultChatStyle.messageSpacing}
        />
      </PanelSection>

      <OptionalPropertySection
        isSet={hasMessageFill}
        onAdd={() =>
          onUpdateStyle({ messageBgColor: "rgba(255, 255, 255, 0.1)" })
        }
        onRemove={() => onUpdateStyle({ messageBgColor: "transparent" })}
        title="Message Fill"
      >
        <div className="space-y-2">
          <PropertyRow label="Color">
            <ColorSwatch
              color={style?.messageBgColor ?? "rgba(255, 255, 255, 0.1)"}
              onChange={(color) => onUpdateStyle({ messageBgColor: color })}
            />
          </PropertyRow>
        </div>
      </OptionalPropertySection>

      <PanelSection title="Message Options">
        <div className="space-y-2">
          <PropertyRow label="Animation">
            <Select
              onValueChange={(v) =>
                onUpdateStyle({ animation: v as "fade" | "slide" | "none" })
              }
              value={style?.animation ?? defaultChatStyle.animation}
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
              checked={style?.showBadges ?? defaultChatStyle.showBadges}
              onCheckedChange={(checked) =>
                onUpdateStyle({ showBadges: checked })
              }
            />
          </PropertyRow>
          <PropertyRow className="justify-between" label="Show Avatar">
            <Switch
              checked={style?.showAvatar ?? defaultChatStyle.showAvatar}
              onCheckedChange={(checked) =>
                onUpdateStyle({ showAvatar: checked })
              }
            />
          </PropertyRow>
        </div>
      </PanelSection>
    </>
  );
}

export function ChatSection({ element, onUpdate }: ChatSectionProps) {
  const updateChatStyle = (updates: Partial<ChatStyle>) => {
    onUpdate(element.id, {
      style: { ...element.style, ...updates },
    } as Partial<ChatElement>);
  };

  return (
    <>
      <ChannelSection element={element} onUpdate={onUpdate} />
      <DisplaySection element={element} onUpdate={onUpdate} />
      <ContainerStyleSection
        onUpdateStyle={updateChatStyle}
        style={element.style}
      />
      <MessageStyleSection
        onUpdateStyle={updateChatStyle}
        style={element.style}
      />
    </>
  );
}
