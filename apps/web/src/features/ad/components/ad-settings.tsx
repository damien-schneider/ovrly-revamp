import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import {
  ArrowsClockwise,
  Eye,
  EyeSlash,
  Image,
  Layout,
  Link,
  Palette,
  Plus,
  Square,
  Trash,
} from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  type AdItem,
  type AdSettingsData,
  getAdSettingsAtom,
  isAdSettingsInitialized,
  setAdSettingsInitialized,
} from "@/atoms/ad-settings-atoms";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedConvexUpdate } from "@/hooks/use-debounced-convex-update";

type AdSettingsProps = {
  overlayId: Id<"overlays">;
};

const DEFAULT_ITEM_SIZE = 80;
const DEFAULT_SLIDER_SPEED = 50;
const DEFAULT_ITEM_SPACING = 16;
const DEFAULT_ITEM_BORDER_RADIUS = 8;
const ID_RANDOM_BASE = 36;
const ID_SLICE_START = 2;
const ID_SLICE_END = 9;
const DEFAULT_ZERO = 0;

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

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(ID_RANDOM_BASE).slice(ID_SLICE_START, ID_SLICE_END)}`;
}

function useSyncedLocalState<T>(
  settingValue: T | undefined,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [localValue, setLocalValue] = useState<T>(settingValue ?? defaultValue);

  useEffect(() => {
    setLocalValue(settingValue ?? defaultValue);
  }, [settingValue, defaultValue]);

  return [localValue, setLocalValue];
}

function ColorPickerWithToggle({
  label,
  value,
  onChange,
  transparent,
  onToggleTransparent,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  transparent?: boolean;
  onToggleTransparent: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <ColorPicker disabled={transparent} onChange={onChange} value={value} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild={true}>
              <button
                className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-muted"
                onClick={onToggleTransparent}
                type="button"
              >
                {transparent ? (
                  <EyeSlash
                    className="h-4 w-4 text-muted-foreground"
                    weight="regular"
                  />
                ) : (
                  <Eye className="h-4 w-4" weight="regular" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{transparent ? "Show" : "Hide"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-sm">{value}px</span>
      </div>
      <Slider
        max={max}
        min={min}
        onValueChange={(values) => onChange(values[0] ?? value)}
        onValueCommit={(values) => onCommit(values[0] ?? value)}
        step={step}
        value={[value]}
        variant="horizontal-thumb"
      />
    </div>
  );
}

function ItemEditor({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: AdItem;
  index: number;
  onUpdate: (updates: Partial<AdItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Item {index + 1}</span>
        <Button
          className="h-7 w-7"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <Trash className="h-4 w-4" weight="regular" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          onValueChange={(value) =>
            onUpdate({ type: value as "image" | "logo" | "link" })
          }
          value={item.type}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" weight="regular" />
                Image
              </div>
            </SelectItem>
            <SelectItem value="logo">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4" weight="regular" />
                Logo
              </div>
            </SelectItem>
            <SelectItem value="link">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4" weight="regular" />
                Link
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{item.type === "link" ? "Link URL" : "Image URL"}</Label>
        <Input
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder={
            item.type === "link"
              ? "https://example.com"
              : "https://example.com/image.png"
          }
          value={item.url}
        />
      </div>

      {item.type === "link" && (
        <div className="space-y-2">
          <Label>Display Image URL (optional)</Label>
          <Input
            onChange={(e) => onUpdate({ imageUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
            value={item.imageUrl ?? ""}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Label (optional)</Label>
        <Input
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="My Sponsor"
          value={item.label ?? ""}
        />
      </div>
    </div>
  );
}

export function AdSettings({ overlayId }: AdSettingsProps) {
  const overlay = useQuery(api.overlays.getById, { id: overlayId });
  const settingsAtom = getAdSettingsAtom(overlayId);
  const [settings, setSettings] = useAtom(settingsAtom);

  useEffect(() => {
    if (overlay?.settings && !isAdSettingsInitialized(overlayId)) {
      const loadedSettings = overlay.settings as AdSettingsData;
      setSettings(loadedSettings);
      setAdSettingsInitialized(overlayId, true);
    }
  }, [overlay, overlayId, setSettings]);

  useDebouncedConvexUpdate({
    overlayId,
    settingsAtom,
    delay: 1000,
    enabled: Boolean(overlay),
  });

  const [localContainerBorderWidth, setLocalContainerBorderWidth] =
    useSyncedLocalState(settings.containerBorderWidth, DEFAULT_ZERO);
  const [localContainerBorderRadius, setLocalContainerBorderRadius] =
    useSyncedLocalState(settings.containerBorderRadius, DEFAULT_ZERO);
  const [localContainerPaddingX, setLocalContainerPaddingX] =
    useSyncedLocalState(settings.containerPaddingX, DEFAULT_ZERO);
  const [localContainerPaddingY, setLocalContainerPaddingY] =
    useSyncedLocalState(settings.containerPaddingY, DEFAULT_ZERO);
  const [localItemSize, setLocalItemSize] = useSyncedLocalState(
    settings.itemSize,
    DEFAULT_ITEM_SIZE
  );
  const [localItemBorderRadius, setLocalItemBorderRadius] = useSyncedLocalState(
    settings.itemBorderRadius,
    DEFAULT_ITEM_BORDER_RADIUS
  );
  const [localItemSpacing, setLocalItemSpacing] = useSyncedLocalState(
    settings.itemSpacing,
    DEFAULT_ITEM_SPACING
  );
  const [localSliderSpeed, setLocalSliderSpeed] = useSyncedLocalState(
    settings.sliderSpeed,
    DEFAULT_SLIDER_SPEED
  );

  const updateSetting = useCallback(
    (updates: Partial<AdSettingsData>) => {
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [setSettings]
  );

  const addItem = useCallback(() => {
    const newItem: AdItem = {
      id: generateItemId(),
      type: "image",
      url: "",
    };
    updateSetting({
      items: [...(settings.items ?? []), newItem],
    });
  }, [settings.items, updateSetting]);

  const updateItem = useCallback(
    (itemId: string, updates: Partial<AdItem>) => {
      const items = settings.items ?? [];
      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      updateSetting({ items: updatedItems });
    },
    [settings.items, updateSetting]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      const items = settings.items ?? [];
      updateSetting({ items: items.filter((item) => item.id !== itemId) });
    },
    [settings.items, updateSetting]
  );

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const layoutMode = settings.layoutMode ?? "static";
  const items = settings.items ?? [];

  return (
    <Tabs className="flex h-full flex-col" defaultValue="layout">
      <TabsList className="mx-auto mt-4 grid grid-cols-3">
        <TabsTrigger value="layout">
          <Layout className="mr-2 h-4 w-4" weight="regular" />
          Layout
        </TabsTrigger>
        <TabsTrigger value="style">
          <Palette className="mr-2 h-4 w-4" weight="regular" />
          Style
        </TabsTrigger>
        <TabsTrigger value="items">
          <Image className="mr-2 h-4 w-4" weight="regular" />
          Items
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        <ScrollBar orientation="vertical" />
        <div className="p-4">
          <TabsContent className="mt-0 space-y-6" value="layout">
            <Section
              icon={<Layout className="h-4 w-4" weight="regular" />}
              title="Display Mode"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Layout Mode</Label>
                  <Select
                    onValueChange={(value) =>
                      updateSetting({
                        layoutMode: value as "static" | "slider",
                      })
                    }
                    value={layoutMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static Grid</SelectItem>
                      <SelectItem value="slider">Infinite Slider</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    {layoutMode === "static"
                      ? "Items displayed in a fixed grid layout"
                      : "Items scroll continuously in a loop"}
                  </p>
                </div>
              </div>
            </Section>

            {layoutMode === "slider" && (
              <Section
                icon={<ArrowsClockwise className="h-4 w-4" weight="regular" />}
                title="Slider Settings"
              >
                <div className="space-y-4">
                  <SliderControl
                    label="Speed"
                    max={200}
                    min={10}
                    onChange={setLocalSliderSpeed}
                    onCommit={(v) => updateSetting({ sliderSpeed: v })}
                    step={10}
                    value={localSliderSpeed}
                  />
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      onValueChange={(value) =>
                        updateSetting({
                          sliderDirection: value as "horizontal" | "vertical",
                        })
                      }
                      value={settings.sliderDirection ?? "horizontal"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Reverse Direction</Label>
                    <Switch
                      checked={settings.sliderReverse ?? false}
                      onCheckedChange={(checked) =>
                        updateSetting({ sliderReverse: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Pause on Hover</Label>
                    <Switch
                      checked={settings.sliderPauseOnHover ?? false}
                      onCheckedChange={(checked) =>
                        updateSetting({ sliderPauseOnHover: checked })
                      }
                    />
                  </div>
                </div>
              </Section>
            )}

            <Section
              icon={<Square className="h-4 w-4" weight="regular" />}
              title="Item Size"
            >
              <div className="space-y-4">
                <SliderControl
                  label="Size"
                  max={200}
                  min={40}
                  onChange={setLocalItemSize}
                  onCommit={(v) => updateSetting({ itemSize: v })}
                  step={4}
                  value={localItemSize}
                />
                <SliderControl
                  label="Border Radius"
                  max={50}
                  min={0}
                  onChange={setLocalItemBorderRadius}
                  onCommit={(v) => updateSetting({ itemBorderRadius: v })}
                  step={1}
                  value={localItemBorderRadius}
                />
                <SliderControl
                  label="Spacing"
                  max={60}
                  min={0}
                  onChange={setLocalItemSpacing}
                  onCommit={(v) => updateSetting({ itemSpacing: v })}
                  step={4}
                  value={localItemSpacing}
                />
              </div>
            </Section>
          </TabsContent>

          <TabsContent className="mt-0 space-y-6" value="style">
            <Section
              icon={<Palette className="h-4 w-4" weight="regular" />}
              title="Background"
            >
              <div className="space-y-4">
                <ColorPickerWithToggle
                  label="Background Color"
                  onChange={(color) =>
                    updateSetting({ containerBackgroundColor: color })
                  }
                  onToggleTransparent={() =>
                    updateSetting({
                      containerBackgroundTransparent:
                        !settings.containerBackgroundTransparent,
                    })
                  }
                  transparent={settings.containerBackgroundTransparent}
                  value={settings.containerBackgroundColor ?? "#000000"}
                />
              </div>
            </Section>

            <Section
              icon={<Square className="h-4 w-4" weight="regular" />}
              title="Border"
            >
              <div className="space-y-4">
                <ColorPickerWithToggle
                  label="Border Color"
                  onChange={(color) =>
                    updateSetting({ containerBorderColor: color })
                  }
                  onToggleTransparent={() =>
                    updateSetting({
                      containerBorderTransparent:
                        !settings.containerBorderTransparent,
                    })
                  }
                  transparent={settings.containerBorderTransparent}
                  value={settings.containerBorderColor ?? "#000000"}
                />
                <SliderControl
                  label="Border Width"
                  max={10}
                  min={0}
                  onChange={setLocalContainerBorderWidth}
                  onCommit={(v) => updateSetting({ containerBorderWidth: v })}
                  step={1}
                  value={localContainerBorderWidth}
                />
                <SliderControl
                  label="Border Radius"
                  max={30}
                  min={0}
                  onChange={setLocalContainerBorderRadius}
                  onCommit={(v) => updateSetting({ containerBorderRadius: v })}
                  step={1}
                  value={localContainerBorderRadius}
                />
              </div>
            </Section>

            <Section
              icon={<Layout className="h-4 w-4" weight="regular" />}
              title="Padding"
            >
              <div className="space-y-4">
                <SliderControl
                  label="Horizontal Padding"
                  max={50}
                  min={0}
                  onChange={setLocalContainerPaddingX}
                  onCommit={(v) => updateSetting({ containerPaddingX: v })}
                  step={1}
                  value={localContainerPaddingX}
                />
                <SliderControl
                  label="Vertical Padding"
                  max={50}
                  min={0}
                  onChange={setLocalContainerPaddingY}
                  onCommit={(v) => updateSetting({ containerPaddingY: v })}
                  step={1}
                  value={localContainerPaddingY}
                />
              </div>
            </Section>
          </TabsContent>

          <TabsContent className="mt-0 space-y-4" value="items">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                {items.length} item{items.length !== 1 ? "s" : ""} configured
              </p>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" weight="regular" />
                Add Item
              </Button>
            </div>

            {items.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">
                  No items configured
                </p>
                <p className="text-muted-foreground text-xs">
                  Add images, logos, or links to display
                </p>
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <ItemEditor
                  index={index}
                  item={item}
                  key={item.id}
                  onRemove={() => removeItem(item.id)}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                />
              ))}
            </div>
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
}
