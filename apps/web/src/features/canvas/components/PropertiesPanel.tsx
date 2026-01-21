import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useAtom, useAtomValue } from "jotai";
import {
  Copy,
  Download,
  ExternalLink,
  Eye,
  Link2,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Square,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  elementsAtom,
  isPropertiesPanelCollapsedAtom,
  selectedIdsAtom,
} from "@/atoms/canvas-atoms";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateChatTheme } from "@/features/canvas/services/gemini-service";
import {
  type BoxElement,
  type ChatElement,
  type ChatStyle,
  defaultChatStyle,
  ElementType,
  type EmoteWallElement,
  type EmoteWallStyle,
  type ImageElement,
  type OverlayContainerElement,
  type OverlayElement,
  type ProgressBarElement,
  type TextElement,
  type TimerElement,
  type TimerStyle,
} from "@/features/canvas/types";

interface PropertiesPanelProps {
  onUpdate: (id: string, updates: Partial<OverlayElement>) => void;
  onDelete: (id: string) => void;
  onExport: (id?: string) => void;
  onPreview: (id: string) => void;
  onCopyLink: (id: string) => void;
  projectId?: string;
}

function PropertySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="shrink-0 text-xs">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Utility to safely extract first value from slider change
const getSliderValue = (value: number | readonly number[]): number =>
  typeof value === "number" ? value : value[0];

export function PropertiesPanel({
  onUpdate,
  onDelete,
  onExport,
  onPreview,
  onCopyLink,
  projectId,
}: PropertiesPanelProps) {
  const elements = useAtomValue(elementsAtom);
  const selectedIds = useAtomValue(selectedIdsAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(isPropertiesPanelCollapsedAtom);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = useQuery(
    api.projects.getById,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  const updateProject = useMutation(api.projects.update);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const element = selectedElements[0];

  const liveViewUrl = projectId
    ? `${window.location.origin}/preview/overlay/${projectId}`
    : null;

  const handleCopyLiveUrl = () => {
    if (liveViewUrl) {
      navigator.clipboard.writeText(liveViewUrl);
      toast.success("Live URL copied to clipboard");
    }
  };

  const handleOpenLiveUrl = () => {
    if (liveViewUrl) {
      window.open(liveViewUrl, "_blank");
    }
  };

  const handleChannelUpdate = async (channel: string) => {
    if (!projectId) {
      return;
    }
    try {
      await updateProject({
        id: projectId as Id<"projects">,
        channel: channel.trim().toLowerCase(),
      });
    } catch {
      toast.error("Failed to update channel");
    }
  };

  const handleAiTheme = () => {
    if (!(aiPrompt && element) || element.type !== ElementType.CHAT) {
      return;
    }
    setIsGenerating(true);
    const theme = generateChatTheme(aiPrompt);
    if (theme) {
      const chatEl = element as ChatElement;
      onUpdate(element.id, {
        style: { ...chatEl.style, ...theme },
      } as Partial<ChatElement>);
      toast.success("Theme applied!");
    }
    setIsGenerating(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!(file && element) || element.type !== ElementType.IMAGE) {
      return;
    }

    setIsUploading(true);
    try {
      // For now, use a data URL since Convex file upload requires additional setup
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onUpdate(element.id, { src: dataUrl } as Partial<ImageElement>);
        toast.success("Image uploaded!");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to upload image");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  const updateChatStyle = (updates: Partial<ChatStyle>) => {
    if (element?.type !== ElementType.CHAT) {
      return;
    }
    const chatEl = element as ChatElement;
    onUpdate(element.id, {
      style: { ...chatEl.style, ...updates },
    } as Partial<ChatElement>);
  };

  const updateEmoteStyle = (updates: Partial<EmoteWallStyle>) => {
    if (element?.type !== ElementType.EMOTE_WALL) {
      return;
    }
    const emoteEl = element as EmoteWallElement;
    onUpdate(element.id, {
      style: { ...emoteEl.style, ...updates },
    } as Partial<EmoteWallElement>);
  };

  const updateTimerStyle = (updates: Partial<TimerStyle>) => {
    if (element?.type !== ElementType.TIMER) {
      return;
    }
    const timerEl = element as TimerElement;
    onUpdate(element.id, {
      style: { ...timerEl.style, ...updates },
    } as Partial<TimerElement>);
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-6 right-6 z-100">
        <Button
          onClick={() => setIsCollapsed(false)}
          size="icon"
          variant="outline"
        >
          <PanelRightOpen size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-6 right-6 bottom-6 z-90 flex w-80 flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
      {element ? (
        <>
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Input
              className="h-8 w-40 border-0 bg-transparent font-semibold text-sm focus-visible:ring-0"
              onChange={(e) => onUpdate(element.id, { name: e.target.value })}
              value={element.name}
            />
            <div className="flex items-center gap-1">
              <Button
                onClick={() => onDelete(element.id)}
                size="icon-xs"
                variant="ghost"
              >
                <Trash2 className="text-destructive" size={16} />
              </Button>
              <Button
                onClick={() => setIsCollapsed(true)}
                size="icon-xs"
                variant="ghost"
              >
                <PanelRightClose size={16} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {/* OBS Integration */}
              {liveViewUrl && (
                <PropertySection title="OBS Browser Source">
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full gap-2"
                      onClick={handleCopyLiveUrl}
                      size="sm"
                    >
                      <Link2 size={14} /> Copy Live URL
                    </Button>
                    <Button
                      className="w-full gap-2"
                      onClick={handleOpenLiveUrl}
                      size="sm"
                      variant="outline"
                    >
                      <ExternalLink size={14} /> Open in Browser
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Use this URL in OBS for real-time synced overlays.
                  </p>
                </PropertySection>
              )}

              {/* Export Options */}
              <PropertySection title="Export">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1"
                    onClick={() => onPreview(element.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye size={14} /> Preview
                  </Button>
                  <Button
                    className="flex-1 gap-1"
                    onClick={() => onCopyLink(element.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Copy size={14} /> Data URI
                  </Button>
                </div>
              </PropertySection>

              {/* Position & Size */}
              <PropertySection title="Transform">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">X</Label>
                    <Input
                      onChange={(e) =>
                        onUpdate(element.id, { x: Number(e.target.value) })
                      }
                      type="number"
                      value={Math.round(element.x)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Y</Label>
                    <Input
                      onChange={(e) =>
                        onUpdate(element.id, { y: Number(e.target.value) })
                      }
                      type="number"
                      value={Math.round(element.y)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Width</Label>
                    <Input
                      onChange={(e) =>
                        onUpdate(element.id, { width: Number(e.target.value) })
                      }
                      type="number"
                      value={Math.round(element.width)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Height</Label>
                    <Input
                      onChange={(e) =>
                        onUpdate(element.id, { height: Number(e.target.value) })
                      }
                      type="number"
                      value={Math.round(element.height)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <PropertyRow label="Opacity">
                    <Slider
                      max={1}
                      min={0}
                      onValueChange={(v) =>
                        onUpdate(element.id, { opacity: getSliderValue(v) })
                      }
                      step={0.01}
                      value={[element.opacity]}
                    />
                  </PropertyRow>
                </div>
              </PropertySection>

              {/* Element-specific settings */}
              {element.type === ElementType.OVERLAY && (
                <PropertySection title="Overlay">
                  <PropertyRow label="Background">
                    <ColorPicker
                      onChange={(color) =>
                        onUpdate(element.id, {
                          backgroundColor: color,
                        } as Partial<OverlayContainerElement>)
                      }
                      value={
                        (element as OverlayContainerElement).backgroundColor
                      }
                    />
                  </PropertyRow>
                </PropertySection>
              )}

              {element.type === ElementType.TEXT && (
                <PropertySection title="Text">
                  <Textarea
                    className="min-h-20"
                    onChange={(e) =>
                      onUpdate(element.id, {
                        content: e.target.value,
                      } as Partial<TextElement>)
                    }
                    placeholder="Enter text..."
                    value={(element as TextElement).content}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Color</Label>
                      <ColorPicker
                        onChange={(color) =>
                          onUpdate(element.id, {
                            color,
                          } as Partial<TextElement>)
                        }
                        value={(element as TextElement).color}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Font Size</Label>
                      <Input
                        onChange={(e) =>
                          onUpdate(element.id, {
                            fontSize: Number(e.target.value),
                          } as Partial<TextElement>)
                        }
                        type="number"
                        value={(element as TextElement).fontSize}
                      />
                    </div>
                  </div>
                  <PropertyRow label="Alignment">
                    <Select
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          textAlign: v as "left" | "center" | "right",
                        } as Partial<TextElement>)
                      }
                      value={(element as TextElement).textAlign}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyRow>
                  <PropertyRow label="Font Weight">
                    <Select
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          fontWeight: v,
                        } as Partial<TextElement>)
                      }
                      value={(element as TextElement).fontWeight}
                    >
                      <SelectTrigger className="w-full">
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
                </PropertySection>
              )}

              {element.type === ElementType.BOX && (
                <PropertySection title="Box">
                  <PropertyRow label="Background">
                    <ColorPicker
                      onChange={(color) =>
                        onUpdate(element.id, {
                          backgroundColor: color,
                        } as Partial<BoxElement>)
                      }
                      value={(element as BoxElement).backgroundColor}
                    />
                  </PropertyRow>
                  <PropertyRow label="Border Color">
                    <ColorPicker
                      onChange={(color) =>
                        onUpdate(element.id, {
                          borderColor: color,
                        } as Partial<BoxElement>)
                      }
                      value={(element as BoxElement).borderColor}
                    />
                  </PropertyRow>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Border Width</Label>
                      <Input
                        onChange={(e) =>
                          onUpdate(element.id, {
                            borderWidth: Number(e.target.value),
                          } as Partial<BoxElement>)
                        }
                        type="number"
                        value={(element as BoxElement).borderWidth}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Border Radius</Label>
                      <Input
                        onChange={(e) =>
                          onUpdate(element.id, {
                            borderRadius: Number(e.target.value),
                          } as Partial<BoxElement>)
                        }
                        type="number"
                        value={(element as BoxElement).borderRadius}
                      />
                    </div>
                  </div>
                </PropertySection>
              )}

              {element.type === ElementType.IMAGE && (
                <PropertySection title="Image">
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    type="file"
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <Upload size={14} />
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Image URL</Label>
                    <Input
                      onChange={(e) =>
                        onUpdate(element.id, {
                          src: e.target.value,
                        } as Partial<ImageElement>)
                      }
                      placeholder="https://..."
                      value={(element as ImageElement).src}
                    />
                  </div>
                  <PropertyRow label="Fit">
                    <Select
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          objectFit: v as "cover" | "contain" | "fill",
                        } as Partial<ImageElement>)
                      }
                      value={(element as ImageElement).objectFit}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="contain">Contain</SelectItem>
                        <SelectItem value="fill">Fill</SelectItem>
                      </SelectContent>
                    </Select>
                  </PropertyRow>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Border Radius</Label>
                    <Slider
                      max={100}
                      min={0}
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          borderRadius: getSliderValue(v),
                        } as Partial<ImageElement>)
                      }
                      value={[(element as ImageElement).borderRadius ?? 0]}
                    />
                  </div>
                </PropertySection>
              )}

              {element.type === ElementType.CHAT && (
                <>
                  <PropertySection title="Chat Preview">
                    <PropertyRow label="Preview Mode">
                      <Switch
                        checked={
                          (element as ChatElement).previewEnabled ?? false
                        }
                        onCheckedChange={(checked) =>
                          onUpdate(element.id, {
                            previewEnabled: checked,
                          } as Partial<ChatElement>)
                        }
                      />
                    </PropertyRow>
                  </PropertySection>

                  <Accordion>
                    <AccordionItem value="colors">
                      <AccordionTrigger>Colors</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <PropertyRow label="Background">
                            <ColorPicker
                              onChange={(color) =>
                                updateChatStyle({ backgroundColor: color })
                              }
                              value={
                                (element as ChatElement).style
                                  ?.backgroundColor ??
                                defaultChatStyle.backgroundColor
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Text Color">
                            <ColorPicker
                              onChange={(color) =>
                                updateChatStyle({ textColor: color })
                              }
                              value={
                                (element as ChatElement).style?.textColor ??
                                defaultChatStyle.textColor
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Username">
                            <ColorPicker
                              onChange={(color) =>
                                updateChatStyle({ usernameColor: color })
                              }
                              value={
                                (element as ChatElement).style?.usernameColor ??
                                defaultChatStyle.usernameColor
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Message BG">
                            <ColorPicker
                              onChange={(color) =>
                                updateChatStyle({ messageBgColor: color })
                              }
                              value={
                                (element as ChatElement).style
                                  ?.messageBgColor ??
                                defaultChatStyle.messageBgColor
                              }
                            />
                          </PropertyRow>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="styling">
                      <AccordionTrigger>Styling</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Font Size</Label>
                            <Slider
                              max={32}
                              min={10}
                              onValueChange={(v) =>
                                updateChatStyle({ fontSize: getSliderValue(v) })
                              }
                              value={[
                                (element as ChatElement).style?.fontSize ?? 14,
                              ]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Border Radius</Label>
                            <Slider
                              max={32}
                              min={0}
                              onValueChange={(v) =>
                                updateChatStyle({
                                  borderRadius: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as ChatElement).style?.borderRadius ??
                                  12,
                              ]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              Message Padding
                            </Label>
                            <Slider
                              max={24}
                              min={0}
                              onValueChange={(v) =>
                                updateChatStyle({
                                  messagePadding: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as ChatElement).style
                                  ?.messagePadding ?? 8,
                              ]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              Message Spacing
                            </Label>
                            <Slider
                              max={24}
                              min={0}
                              onValueChange={(v) =>
                                updateChatStyle({
                                  messageSpacing: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as ChatElement).style
                                  ?.messageSpacing ?? 8,
                              ]}
                            />
                          </div>
                          <PropertyRow label="Animation">
                            <Select
                              onValueChange={(v) =>
                                updateChatStyle({
                                  animation: v as "fade" | "slide" | "none",
                                })
                              }
                              value={
                                (element as ChatElement).style?.animation ??
                                "slide"
                              }
                            >
                              <SelectTrigger className="w-full">
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
                              checked={
                                (element as ChatElement).style?.showBadges ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                updateChatStyle({ showBadges: checked })
                              }
                            />
                          </PropertyRow>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="border">
                      <AccordionTrigger>Border</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <PropertyRow label="Color">
                            <ColorPicker
                              onChange={(color) =>
                                updateChatStyle({ borderColor: color })
                              }
                              value={
                                (element as ChatElement).style?.borderColor ??
                                "transparent"
                              }
                            />
                          </PropertyRow>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Width</Label>
                            <Slider
                              max={8}
                              min={0}
                              onValueChange={(v) =>
                                updateChatStyle({
                                  borderWidth: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as ChatElement).style?.borderWidth ??
                                  0,
                              ]}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* AI Designer */}
                  <PropertySection title="AI Designer">
                    <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950">
                      <Textarea
                        className="min-h-16 bg-background"
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. 'Soft glassmorphism with blue neon text'"
                        value={aiPrompt}
                      />
                      <Button
                        className="w-full gap-2"
                        disabled={isGenerating || !aiPrompt}
                        onClick={handleAiTheme}
                        size="sm"
                      >
                        <Wand2 size={14} />
                        {isGenerating ? "Designing..." : "Magic Generate"}
                      </Button>
                    </div>
                  </PropertySection>
                </>
              )}

              {element.type === ElementType.EMOTE_WALL && (
                <>
                  <PropertySection title="Emote Wall">
                    <PropertyRow label="Preview Mode">
                      <Switch
                        checked={
                          (element as EmoteWallElement).previewEnabled ?? false
                        }
                        onCheckedChange={(checked) =>
                          onUpdate(element.id, {
                            previewEnabled: checked,
                          } as Partial<EmoteWallElement>)
                        }
                      />
                    </PropertyRow>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Density</Label>
                      <Slider
                        max={10}
                        min={1}
                        onValueChange={(v) =>
                          onUpdate(element.id, { density: getSliderValue(v) })
                        }
                        value={[(element as EmoteWallElement).density]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Speed</Label>
                      <Slider
                        max={5}
                        min={0.5}
                        onValueChange={(v) =>
                          onUpdate(element.id, { speed: getSliderValue(v) })
                        }
                        step={0.1}
                        value={[(element as EmoteWallElement).speed]}
                      />
                    </div>
                  </PropertySection>

                  <Accordion>
                    <AccordionItem value="physics">
                      <AccordionTrigger>Physics</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <PropertyRow label="Gravity">
                            <Select
                              onValueChange={(v) =>
                                updateEmoteStyle({
                                  gravity: v as EmoteWallStyle["gravity"],
                                })
                              }
                              value={
                                (element as EmoteWallElement).style?.gravity ??
                                "up"
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="up">Up</SelectItem>
                                <SelectItem value="down">Down</SelectItem>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                                <SelectItem value="none">
                                  None (Float)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </PropertyRow>
                          <PropertyRow label="Spawn Mode">
                            <Select
                              onValueChange={(v) =>
                                updateEmoteStyle({
                                  spawnMode: v as EmoteWallStyle["spawnMode"],
                                })
                              }
                              value={
                                (element as EmoteWallElement).style
                                  ?.spawnMode ?? "bottom"
                              }
                            >
                              <SelectTrigger className="w-full">
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
                              checked={
                                (element as EmoteWallElement).style
                                  ?.bounceEnabled ?? false
                              }
                              onCheckedChange={(checked) =>
                                updateEmoteStyle({ bounceEnabled: checked })
                              }
                            />
                          </PropertyRow>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="appearance">
                      <AccordionTrigger>Appearance</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Emote Size</Label>
                            <Slider
                              max={96}
                              min={16}
                              onValueChange={(v) =>
                                updateEmoteStyle({
                                  emoteSize: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as EmoteWallElement).style
                                  ?.emoteSize ?? 48,
                              ]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">
                              Size Variation
                            </Label>
                            <Slider
                              max={32}
                              min={0}
                              onValueChange={(v) =>
                                updateEmoteStyle({
                                  emoteSizeVariation: getSliderValue(v),
                                })
                              }
                              value={[
                                (element as EmoteWallElement).style
                                  ?.emoteSizeVariation ?? 16,
                              ]}
                            />
                          </div>
                          <PropertyRow label="Rotation">
                            <Switch
                              checked={
                                (element as EmoteWallElement).style
                                  ?.rotationEnabled ?? true
                              }
                              onCheckedChange={(checked) =>
                                updateEmoteStyle({ rotationEnabled: checked })
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Fade Out">
                            <Switch
                              checked={
                                (element as EmoteWallElement).style?.fadeOut ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                updateEmoteStyle({ fadeOut: checked })
                              }
                            />
                          </PropertyRow>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {element.type === ElementType.TIMER && (
                <>
                  <PropertySection title="Timer">
                    <PropertyRow label="Mode">
                      <Select
                        onValueChange={(v) =>
                          onUpdate(element.id, {
                            mode: v,
                          } as Partial<TimerElement>)
                        }
                        value={(element as TimerElement).mode}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="countdown">Countdown</SelectItem>
                          <SelectItem value="countup">Count Up</SelectItem>
                          <SelectItem value="stopwatch">Stopwatch</SelectItem>
                        </SelectContent>
                      </Select>
                    </PropertyRow>
                    {(element as TimerElement).mode !== "stopwatch" && (
                      <div className="space-y-1">
                        <Label className="text-[10px]">Target Date/Time</Label>
                        <Input
                          onChange={(e) =>
                            onUpdate(element.id, {
                              targetDate: new Date(
                                e.target.value
                              ).toISOString(),
                            } as Partial<TimerElement>)
                          }
                          type="datetime-local"
                          value={new Date((element as TimerElement).targetDate)
                            .toISOString()
                            .slice(0, 16)}
                        />
                      </div>
                    )}
                    {(element as TimerElement).mode === "stopwatch" && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-1"
                          onClick={() =>
                            onUpdate(element.id, {
                              isRunning: !(element as TimerElement).isRunning,
                            } as Partial<TimerElement>)
                          }
                          size="sm"
                          variant="outline"
                        >
                          {(element as TimerElement).isRunning ? (
                            <>
                              <Square size={14} /> Stop
                            </>
                          ) : (
                            <>
                              <Play size={14} /> Start
                            </>
                          )}
                        </Button>
                        <Button
                          className="gap-1"
                          onClick={() =>
                            onUpdate(element.id, {
                              elapsedMs: 0,
                              isRunning: false,
                            } as Partial<TimerElement>)
                          }
                          size="sm"
                          variant="outline"
                        >
                          Reset
                        </Button>
                      </div>
                    )}
                  </PropertySection>

                  <PropertySection title="Display">
                    <PropertyRow label="Color">
                      <ColorPicker
                        onChange={(color) =>
                          onUpdate(element.id, {
                            color,
                          } as Partial<TimerElement>)
                        }
                        value={(element as TimerElement).color}
                      />
                    </PropertyRow>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Font Size</Label>
                      <Slider
                        max={128}
                        min={16}
                        onValueChange={(v) =>
                          onUpdate(element.id, {
                            fontSize: getSliderValue(v),
                          } as Partial<TimerElement>)
                        }
                        value={[(element as TimerElement).fontSize]}
                      />
                    </div>
                  </PropertySection>

                  <Accordion>
                    <AccordionItem value="format">
                      <AccordionTrigger>Format</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <PropertyRow label="Show Days">
                            <Switch
                              checked={
                                (element as TimerElement).style?.showDays ??
                                false
                              }
                              onCheckedChange={(checked) =>
                                updateTimerStyle({ showDays: checked })
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Show Hours">
                            <Switch
                              checked={
                                (element as TimerElement).style?.showHours ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                updateTimerStyle({ showHours: checked })
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Show Minutes">
                            <Switch
                              checked={
                                (element as TimerElement).style?.showMinutes ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                updateTimerStyle({ showMinutes: checked })
                              }
                            />
                          </PropertyRow>
                          <PropertyRow label="Show Seconds">
                            <Switch
                              checked={
                                (element as TimerElement).style?.showSeconds ??
                                true
                              }
                              onCheckedChange={(checked) =>
                                updateTimerStyle({ showSeconds: checked })
                              }
                            />
                          </PropertyRow>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Separator</Label>
                            <Input
                              onChange={(e) =>
                                updateTimerStyle({ separator: e.target.value })
                              }
                              value={
                                (element as TimerElement).style?.separator ??
                                ":"
                              }
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {element.type === ElementType.PROGRESS && (
                <PropertySection title="Progress Bar">
                  <div className="space-y-1">
                    <Label className="text-[10px]">
                      Progress (
                      {Math.round((element as ProgressBarElement).progress)}%)
                    </Label>
                    <Slider
                      max={100}
                      min={0}
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          progress: getSliderValue(v),
                        } as Partial<ProgressBarElement>)
                      }
                      value={[(element as ProgressBarElement).progress]}
                    />
                  </div>
                  <PropertyRow label="Bar Color">
                    <ColorPicker
                      onChange={(color) =>
                        onUpdate(element.id, {
                          barColor: color,
                        } as Partial<ProgressBarElement>)
                      }
                      value={(element as ProgressBarElement).barColor}
                    />
                  </PropertyRow>
                  <PropertyRow label="Background">
                    <ColorPicker
                      onChange={(color) =>
                        onUpdate(element.id, {
                          backgroundColor: color,
                        } as Partial<ProgressBarElement>)
                      }
                      value={(element as ProgressBarElement).backgroundColor}
                    />
                  </PropertyRow>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Border Radius</Label>
                    <Slider
                      max={32}
                      min={0}
                      onValueChange={(v) =>
                        onUpdate(element.id, {
                          borderRadius: getSliderValue(v),
                        } as Partial<ProgressBarElement>)
                      }
                      value={[(element as ProgressBarElement).borderRadius]}
                    />
                  </div>
                  <PropertyRow label="Show Label">
                    <Switch
                      checked={
                        (element as ProgressBarElement).showLabel ?? false
                      }
                      onCheckedChange={(checked) =>
                        onUpdate(element.id, {
                          showLabel: checked,
                        } as Partial<ProgressBarElement>)
                      }
                    />
                  </PropertyRow>
                  <PropertyRow label="Animated">
                    <Switch
                      checked={
                        (element as ProgressBarElement).animated ?? false
                      }
                      onCheckedChange={(checked) =>
                        onUpdate(element.id, {
                          animated: checked,
                        } as Partial<ProgressBarElement>)
                      }
                    />
                  </PropertyRow>
                  <PropertyRow label="Stripes">
                    <Switch
                      checked={(element as ProgressBarElement).stripes ?? false}
                      onCheckedChange={(checked) =>
                        onUpdate(element.id, {
                          stripes: checked,
                        } as Partial<ProgressBarElement>)
                      }
                    />
                  </PropertyRow>
                </PropertySection>
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex h-full flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-black text-xl tracking-tight">Ovrly</h2>
            <Button
              onClick={() => setIsCollapsed(true)}
              size="icon-xs"
              variant="ghost"
            >
              <PanelRightClose size={16} />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              <PropertySection title="Project Settings">
                <div className="space-y-1">
                  <Label className="text-[10px]">Twitch Channel</Label>
                  <Input
                    defaultValue={project?.channel ?? ""}
                    onBlur={(e) => handleChannelUpdate(e.target.value)}
                    placeholder="e.g. xqc"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Connect widgets to this Twitch channel's chat.
                  </p>
                </div>
              </PropertySection>

              <p className="mb-6 text-muted-foreground text-sm">
                Design pixel-perfect stream overlays. Select a layer to
                customize or add one from the toolbar.
              </p>

              <div className="mb-6 rounded-lg bg-muted p-4">
                <h3 className="mb-3 font-semibold text-xs uppercase tracking-wider">
                  Quick Shortcuts
                </h3>
                <ul className="space-y-2 text-muted-foreground text-xs">
                  <li className="flex justify-between">
                    <span>Pan Canvas</span>
                    <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                      H
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Select Tool</span>
                    <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                      V
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">
                      ⌘Z
                    </kbd>
                  </li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          <div className="mt-auto space-y-3 pt-4">
            <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Export All
            </h3>
            <Button
              className="w-full gap-2"
              onClick={() => onExport()}
              variant="outline"
            >
              <Download size={16} /> Export Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
