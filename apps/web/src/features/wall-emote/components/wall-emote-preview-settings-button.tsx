import { Moon, Smiley, Sun } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

type WallEmotePreviewSettingsButtonProps = {
  overlayId: Id<"overlays">;
};

export function WallEmotePreviewSettingsButton({
  overlayId,
}: WallEmotePreviewSettingsButtonProps) {
  const overlay = useQuery(api.overlays.getById, { id: overlayId });
  const updateOverlay = useMutation(api.overlays.update);

  const [previewBackgroundDark, setPreviewBackgroundDark] = useState(false);
  const [previewEmojisEnabled, setPreviewEmojisEnabled] = useState(false);

  // Load settings from overlay
  useEffect(() => {
    if (overlay?.settings) {
      const settings = overlay.settings as {
        previewBackgroundDark?: boolean;
        previewEmojisEnabled?: boolean;
      };
      setPreviewBackgroundDark(settings.previewBackgroundDark ?? false);
      setPreviewEmojisEnabled(settings.previewEmojisEnabled ?? false);
    }
  }, [overlay]);

  const updateSetting = async (updates: {
    previewBackgroundDark?: boolean;
    previewEmojisEnabled?: boolean;
  }) => {
    if (!overlay) return;

    const currentSettings = (overlay.settings || {}) as Record<string, unknown>;
    const newSettings = { ...currentSettings, ...updates };

    try {
      await updateOverlay({
        id: overlayId,
        settings: newSettings,
      });
    } catch (error) {
      console.error("Failed to update preview settings:", error);
    }
  };

  const handlePreviewBackgroundChange = (value: boolean) => {
    setPreviewBackgroundDark(value);
    updateSetting({ previewBackgroundDark: value });
  };

  const handlePreviewEmojisChange = (value: boolean) => {
    setPreviewEmojisEnabled(value);
    updateSetting({ previewEmojisEnabled: value });
  };

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <PopoverTrigger asChild>
              <Button aria-label="Preview settings" size="sm" variant="secondary">
                <Smiley className="h-4 w-4" weight="regular" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Preview settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm leading-none">
              Preview Settings
            </h4>
            <p className="text-muted-foreground text-sm">
              Customize how the preview appears
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label
              className="flex items-center gap-2"
              htmlFor="preview-dark-mode"
            >
              {previewBackgroundDark ? (
                <Moon className="h-4 w-4" weight="regular" />
              ) : (
                <Sun className="h-4 w-4" weight="regular" />
              )}
              Dark Background
            </Label>
            <Switch
              checked={previewBackgroundDark}
              id="preview-dark-mode"
              onCheckedChange={handlePreviewBackgroundChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label
              className="flex items-center gap-2"
              htmlFor="preview-emojis-mode"
            >
              <Smiley className="h-4 w-4" weight="regular" />
              Show test emojis
            </Label>
            <Switch
              checked={previewEmojisEnabled}
              id="preview-emojis-mode"
              onCheckedChange={handlePreviewEmojisChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}



