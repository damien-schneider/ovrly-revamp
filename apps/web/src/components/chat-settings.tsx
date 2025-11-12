import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import {
  ChatCircle,
  Eye,
  EyeSlash,
  Layout,
  Palette,
  Square,
  TextT,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SpacingControl } from "@/components/spacing-control";

type ChatSettingsProps = {
  overlayId: Id<"overlays">;
};

type ChatSettingsData = {
  // Container settings
  containerBackgroundColor?: string;
  containerBackgroundTransparent?: boolean;
  containerBorderColor?: string;
  containerBorderTransparent?: boolean;
  containerBorderWidth?: number;
  containerBorderRadius?: number;
  containerPaddingX?: number;
  containerPaddingY?: number;
  containerGap?: number;
  containerGradientMaskEnabled?: boolean;
  containerGradientMaskHeight?: number;

  // Message settings
  messageBackgroundColor?: string;
  messageBackgroundTransparent?: boolean;
  messageBorderColor?: string;
  messageBorderTransparent?: boolean;
  messageBorderWidth?: number;
  messageBorderRadius?: number;
  messagePaddingX?: number;
  messagePaddingY?: number;
  messageFontSize?: number;
  messageColor?: string;
};

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_GRADIENT_MASK_HEIGHT = 100;

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-tight">
          {icon}
          <span>{title}</span>
        </div>
        <Separator className="-mx-4" />
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ChatSettings({ overlayId }: ChatSettingsProps) {
  const overlay = useQuery(api.overlays.getById, { id: overlayId });
  const updateOverlay = useMutation(api.overlays.update);

  const [settings, setSettings] = useState<ChatSettingsData>({});

  // Load settings from overlay
  useEffect(() => {
    if (overlay?.settings) {
      const loadedSettings = overlay.settings as ChatSettingsData;
      setSettings(loadedSettings);
    }
  }, [overlay]);

  // Local state for sliders to prevent focus loss during dragging
  const [localContainerBorderWidth, setLocalContainerBorderWidth] = useState(
    settings.containerBorderWidth ?? 0
  );
  const [localContainerBorderRadius, setLocalContainerBorderRadius] = useState(
    settings.containerBorderRadius ?? 0
  );
  const [localContainerGap, setLocalContainerGap] = useState(
    settings.containerGap ?? 4
  );
  const [localContainerGradientMaskHeight, setLocalContainerGradientMaskHeight] =
    useState(settings.containerGradientMaskHeight ?? DEFAULT_GRADIENT_MASK_HEIGHT);
  const [localMessageBorderWidth, setLocalMessageBorderWidth] = useState(
    settings.messageBorderWidth ?? 0
  );
  const [localMessageBorderRadius, setLocalMessageBorderRadius] = useState(
    settings.messageBorderRadius ?? 8
  );
  const [localMessageFontSize, setLocalMessageFontSize] = useState(
    settings.messageFontSize ?? DEFAULT_FONT_SIZE
  );

  // Local state for padding controls
  const [localContainerPadding, setLocalContainerPadding] = useState({
    top: settings.containerPaddingY ?? 0,
    right: settings.containerPaddingX ?? 0,
    bottom: settings.containerPaddingY ?? 0,
    left: settings.containerPaddingX ?? 0,
  });
  const [localMessagePadding, setLocalMessagePadding] = useState({
    top: settings.messagePaddingY ?? 4,
    right: settings.messagePaddingX ?? 8,
    bottom: settings.messagePaddingY ?? 4,
    left: settings.messagePaddingX ?? 8,
  });

  // Sync local state with settings when they change externally
  useEffect(() => {
    setLocalContainerBorderWidth(settings.containerBorderWidth ?? 0);
  }, [settings.containerBorderWidth]);

  useEffect(() => {
    setLocalContainerBorderRadius(settings.containerBorderRadius ?? 0);
  }, [settings.containerBorderRadius]);

  useEffect(() => {
    setLocalContainerGap(settings.containerGap ?? 4);
  }, [settings.containerGap]);

  useEffect(() => {
    setLocalContainerGradientMaskHeight(
      settings.containerGradientMaskHeight ?? DEFAULT_GRADIENT_MASK_HEIGHT
    );
  }, [settings.containerGradientMaskHeight]);

  useEffect(() => {
    setLocalMessageBorderWidth(settings.messageBorderWidth ?? 0);
  }, [settings.messageBorderWidth]);

  useEffect(() => {
    setLocalMessageBorderRadius(settings.messageBorderRadius ?? 8);
  }, [settings.messageBorderRadius]);

  useEffect(() => {
    setLocalMessageFontSize(settings.messageFontSize ?? DEFAULT_FONT_SIZE);
  }, [settings.messageFontSize]);

  useEffect(() => {
    setLocalContainerPadding({
      top: settings.containerPaddingY ?? 0,
      right: settings.containerPaddingX ?? 0,
      bottom: settings.containerPaddingY ?? 0,
      left: settings.containerPaddingX ?? 0,
    });
  }, [settings.containerPaddingX, settings.containerPaddingY]);

  useEffect(() => {
    setLocalMessagePadding({
      top: settings.messagePaddingY ?? 4,
      right: settings.messagePaddingX ?? 8,
      bottom: settings.messagePaddingY ?? 4,
      left: settings.messagePaddingX ?? 8,
    });
  }, [settings.messagePaddingX, settings.messagePaddingY]);

  const updateSetting = async (updates: Partial<ChatSettingsData>) => {
    if (!overlay) return;

    const currentSettings = (overlay.settings || {}) as Record<string, unknown>;
    const newSettings = { ...currentSettings, ...settings, ...updates };
    setSettings(newSettings as ChatSettingsData);

    try {
      await updateOverlay({
        id: overlayId,
        settings: newSettings,
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      // Revert on error - reload from overlay
      if (overlay?.settings) {
        setSettings(overlay.settings as ChatSettingsData);
      }
    }
  };

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Tabs className="flex h-full flex-col" defaultValue="container">
        <TabsList className="mx-auto mt-4 grid grid-cols-2">
          <TabsTrigger value="container">
            <Layout className="mr-2 h-4 w-4" weight="regular" />
            Container
          </TabsTrigger>
          <TabsTrigger value="message">
            <ChatCircle className="mr-2 h-4 w-4" weight="regular" />
            Message
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <ScrollBar orientation="vertical" />
          <div className="p-4">
            <TabsContent className="mt-0 space-y-6" value="container">
              {/* Container Appearance */}
              <Section icon={<Palette className="h-4 w-4" weight="regular" />} title="Appearance">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="containerBackgroundColor">
                      Background Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        disabled={settings.containerBackgroundTransparent}
                        onChange={(color) =>
                          updateSetting({ containerBackgroundColor: color })
                        }
                        value={settings.containerBackgroundColor ?? "#000000"}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <button
                              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                              onClick={() =>
                                updateSetting({
                                  containerBackgroundTransparent:
                                    !settings.containerBackgroundTransparent,
                                })
                              }
                              type="button"
                            >
                              {settings.containerBackgroundTransparent ? (
                                <EyeSlash className="h-4 w-4 text-muted-foreground" weight="regular" />
                              ) : (
                                <Eye className="h-4 w-4" weight="regular" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {settings.containerBackgroundTransparent
                              ? "Show Background"
                              : "Hide Background"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Container Border */}
              <Section icon={<Square className="h-4 w-4" weight="regular" />} title="Border">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="containerBorderColor">Border Color</Label>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        disabled={settings.containerBorderTransparent}
                        onChange={(color) =>
                          updateSetting({ containerBorderColor: color })
                        }
                        value={settings.containerBorderColor ?? "#000000"}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <button
                              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                              onClick={() =>
                                updateSetting({
                                  containerBorderTransparent:
                                    !settings.containerBorderTransparent,
                                })
                              }
                              type="button"
                            >
                              {settings.containerBorderTransparent ? (
                                <EyeSlash className="h-4 w-4 text-muted-foreground" weight="regular" />
                              ) : (
                                <Eye className="h-4 w-4" weight="regular" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {settings.containerBorderTransparent
                              ? "Show Border"
                              : "Hide Border"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="containerBorderWidth">Border Width</Label>
                      <span className="text-muted-foreground text-sm">
                        {localContainerBorderWidth}px
                      </span>
                    </div>
                    <Slider
                      id="containerBorderWidth"
                      max={10}
                      min={0}
                      onValueChange={(value) =>
                        setLocalContainerBorderWidth(value[0] ?? 0)
                      }
                      onValueCommit={(value) =>
                        updateSetting({ containerBorderWidth: value[0] ?? 0 })
                      }
                      step={1}
                      value={[localContainerBorderWidth]}
                      variant="horizontal-thumb"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="containerBorderRadius">Border Radius</Label>
                      <span className="text-muted-foreground text-sm">
                        {localContainerBorderRadius}px
                      </span>
                    </div>
                    <Slider
                      id="containerBorderRadius"
                      max={30}
                      min={0}
                      onValueChange={(value) =>
                        setLocalContainerBorderRadius(value[0] ?? 0)
                      }
                      onValueCommit={(value) =>
                        updateSetting({ containerBorderRadius: value[0] ?? 0 })
                      }
                      step={1}
                      value={[localContainerBorderRadius]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </Section>

              {/* Container Size */}
              <Section
                icon={<Layout className="h-4 w-4" weight="regular" />}
                title="Size & Spacing"
              >
                <div className="space-y-4">
                  <SpacingControl
                    label="Padding"
                    max={50}
                    onChange={(values) => {
                      setLocalContainerPadding(values);
                      // Determine which value changed
                      const rightChanged =
                        values.right !== localContainerPadding.right;
                      const leftChanged =
                        values.left !== localContainerPadding.left;
                      const topChanged =
                        values.top !== localContainerPadding.top;
                      const bottomChanged =
                        values.bottom !== localContainerPadding.bottom;

                      if (leftChanged) {
                        updateSetting({ containerPaddingX: values.left ?? 0 });
                      } else if (rightChanged) {
                        updateSetting({ containerPaddingX: values.right ?? 0 });
                      }

                      if (bottomChanged) {
                        updateSetting({ containerPaddingY: values.bottom ?? 0 });
                      } else if (topChanged) {
                        updateSetting({ containerPaddingY: values.top ?? 0 });
                      }
                    }}
                    values={localContainerPadding}
                  />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="containerGap">Gap Between Messages</Label>
                      <span className="text-muted-foreground text-sm">
                        {localContainerGap}px
                      </span>
                    </div>
                    <Slider
                      id="containerGap"
                      max={20}
                      min={0}
                      onValueChange={(value) =>
                        setLocalContainerGap(value[0] ?? 0)
                      }
                      onValueCommit={(value) =>
                        updateSetting({ containerGap: value[0] ?? 0 })
                      }
                      step={1}
                      value={[localContainerGap]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </Section>

              {/* Gradient Mask */}
              <Section
                icon={<Palette className="h-4 w-4" weight="regular" />}
                title="Gradient Mask"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="containerGradientMaskEnabled">
                      Gradient Mask
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild={true}>
                          <button
                            className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                            onClick={() =>
                              updateSetting({
                                containerGradientMaskEnabled:
                                  !settings.containerGradientMaskEnabled,
                              })
                            }
                            type="button"
                          >
                            {settings.containerGradientMaskEnabled ? (
                              <Eye className="h-4 w-4" weight="regular" />
                            ) : (
                              <EyeSlash className="h-4 w-4 text-muted-foreground" weight="regular" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {settings.containerGradientMaskEnabled
                            ? "Hide Gradient Mask"
                            : "Show Gradient Mask"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {settings.containerGradientMaskEnabled && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="containerGradientMaskHeight">
                          Mask Height
                        </Label>
                        <span className="text-muted-foreground text-sm">
                          {localContainerGradientMaskHeight}px
                        </span>
                      </div>
                      <Slider
                        id="containerGradientMaskHeight"
                        max={300}
                        min={20}
                        onValueChange={(value) =>
                          setLocalContainerGradientMaskHeight(
                            value[0] ?? DEFAULT_GRADIENT_MASK_HEIGHT
                          )
                        }
                        onValueCommit={(value) =>
                          updateSetting({
                            containerGradientMaskHeight:
                              value[0] ?? DEFAULT_GRADIENT_MASK_HEIGHT,
                          })
                        }
                        step={10}
                        value={[localContainerGradientMaskHeight]}
                        variant="horizontal-thumb"
                      />
                    </div>
                  )}
                </div>
              </Section>
            </TabsContent>

            <TabsContent className="mt-0 space-y-6" value="message">
              {/* Message Appearance */}
              <Section icon={<Palette className="h-4 w-4" weight="regular" />} title="Appearance">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageBackgroundColor">
                      Background Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        disabled={settings.messageBackgroundTransparent}
                        onChange={(color) =>
                          updateSetting({ messageBackgroundColor: color })
                        }
                        value={settings.messageBackgroundColor ?? "#000000"}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <button
                              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                              onClick={() =>
                                updateSetting({
                                  messageBackgroundTransparent:
                                    !settings.messageBackgroundTransparent,
                                })
                              }
                              type="button"
                            >
                              {settings.messageBackgroundTransparent ? (
                                <EyeSlash className="h-4 w-4 text-muted-foreground" weight="regular" />
                              ) : (
                                <Eye className="h-4 w-4" weight="regular" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {settings.messageBackgroundTransparent
                              ? "Show Background"
                              : "Hide Background"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Message Border */}
              <Section icon={<Square className="h-4 w-4" weight="regular" />} title="Border">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="messageBorderColor">Border Color</Label>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        disabled={settings.messageBorderTransparent}
                        onChange={(color) =>
                          updateSetting({ messageBorderColor: color })
                        }
                        value={settings.messageBorderColor ?? "#000000"}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild={true}>
                            <button
                              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                              onClick={() =>
                                updateSetting({
                                  messageBorderTransparent:
                                    !settings.messageBorderTransparent,
                                })
                              }
                              type="button"
                            >
                              {settings.messageBorderTransparent ? (
                                <EyeSlash className="h-4 w-4 text-muted-foreground" weight="regular" />
                              ) : (
                                <Eye className="h-4 w-4" weight="regular" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {settings.messageBorderTransparent
                              ? "Show Border"
                              : "Hide Border"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="messageBorderWidth">Border Width</Label>
                      <span className="text-muted-foreground text-sm">
                        {localMessageBorderWidth}px
                      </span>
                    </div>
                    <Slider
                      id="messageBorderWidth"
                      max={10}
                      min={0}
                      onValueChange={(value) =>
                        setLocalMessageBorderWidth(value[0] ?? 0)
                      }
                      onValueCommit={(value) =>
                        updateSetting({ messageBorderWidth: value[0] ?? 0 })
                      }
                      step={1}
                      value={[localMessageBorderWidth]}
                      variant="horizontal-thumb"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="messageBorderRadius">Border Radius</Label>
                      <span className="text-muted-foreground text-sm">
                        {localMessageBorderRadius}px
                      </span>
                    </div>
                    <Slider
                      id="messageBorderRadius"
                      max={30}
                      min={0}
                      onValueChange={(value) =>
                        setLocalMessageBorderRadius(value[0] ?? 0)
                      }
                      onValueCommit={(value) =>
                        updateSetting({ messageBorderRadius: value[0] ?? 0 })
                      }
                      step={1}
                      value={[localMessageBorderRadius]}
                      variant="horizontal-thumb"
                    />
                  </div>
                </div>
              </Section>

              {/* Message Typography */}
              <Section icon={<TextT className="h-4 w-4" weight="regular" />} title="Typography">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="messageFontSize">Font Size</Label>
                      <span className="text-muted-foreground text-sm">
                        {localMessageFontSize}px
                      </span>
                    </div>
                    <Slider
                      id="messageFontSize"
                      max={32}
                      min={8}
                      onValueChange={(value) =>
                        setLocalMessageFontSize(value[0] ?? DEFAULT_FONT_SIZE)
                      }
                      onValueCommit={(value) =>
                        updateSetting({
                          messageFontSize: value[0] ?? DEFAULT_FONT_SIZE,
                        })
                      }
                      step={1}
                      value={[localMessageFontSize]}
                      variant="horizontal-thumb"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="messageColor">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <ColorPicker
                        onChange={(color) =>
                          updateSetting({ messageColor: color })
                        }
                        value={settings.messageColor ?? "#ffffff"}
                      />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Message Spacing */}
              <Section icon={<Layout className="h-4 w-4" weight="regular" />} title="Spacing">
                <div className="space-y-4">
                  <SpacingControl
                    label="Padding"
                    max={50}
                    onChange={(values) => {
                      setLocalMessagePadding(values);
                      // Determine which value changed
                      const rightChanged =
                        values.right !== localMessagePadding.right;
                      const leftChanged =
                        values.left !== localMessagePadding.left;
                      const topChanged =
                        values.top !== localMessagePadding.top;
                      const bottomChanged =
                        values.bottom !== localMessagePadding.bottom;

                      if (leftChanged) {
                        updateSetting({ messagePaddingX: values.left ?? 0 });
                      } else if (rightChanged) {
                        updateSetting({ messagePaddingX: values.right ?? 0 });
                      }

                      if (bottomChanged) {
                        updateSetting({ messagePaddingY: values.bottom ?? 0 });
                      } else if (topChanged) {
                        updateSetting({ messagePaddingY: values.top ?? 0 });
                      }
                    }}
                    values={localMessagePadding}
                  />
                </div>
              </Section>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

