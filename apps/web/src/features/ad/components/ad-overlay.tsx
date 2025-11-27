import { convexQuery } from "@convex-dev/react-query";
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import {
  type AdItem,
  type AdSettingsData,
  getAdSettingsAtom,
  isAdSettingsInitialized,
  setAdSettingsInitialized,
} from "@/atoms/ad-settings-atoms";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

type AdOverlayProps = {
  overlayId: Id<"overlays">;
  useEditMode?: boolean;
};

type CSSVars = CSSProperties & Record<string, string>;

const DEFAULT_ITEM_SIZE = 80;
const DEFAULT_ITEM_SPACING = 16;
const DEFAULT_SLIDER_SPEED = 50;
const DEFAULT_ITEM_BORDER_RADIUS = 8;

function px(value: number | undefined, fallback: number): string {
  return `${value ?? fallback}px`;
}

function transparentOr(
  isTransparent?: boolean,
  color?: string,
  fallback = "transparent"
): string {
  return isTransparent ? "transparent" : (color ?? fallback);
}

function buildStyleVars(config: AdSettingsData | null): CSSVars {
  if (!config) {
    return {} as CSSVars;
  }

  return {
    "--gap-ad-container": px(config.containerGap, DEFAULT_ITEM_SPACING),
    "--padding-x-ad-container": px(config.containerPaddingX, 0),
    "--padding-y-ad-container": px(config.containerPaddingY, 0),
    "--border-width-ad-container": px(config.containerBorderWidth, 0),
    "--border-radius-ad-container": px(config.containerBorderRadius, 0),
    "--background-color-ad-container": transparentOr(
      config.containerBackgroundTransparent,
      config.containerBackgroundColor,
      "transparent"
    ),
    "--border-color-ad-container": transparentOr(
      config.containerBorderTransparent,
      config.containerBorderColor,
      "transparent"
    ),
    "--item-size-ad": px(config.itemSize, DEFAULT_ITEM_SIZE),
    "--item-border-radius-ad": px(
      config.itemBorderRadius,
      DEFAULT_ITEM_BORDER_RADIUS
    ),
    "--item-spacing-ad": px(config.itemSpacing, DEFAULT_ITEM_SPACING),
  } as CSSVars;
}

function AdItemDisplay({ item, size }: { item: AdItem; size: number }) {
  const imageUrl = item.imageUrl || item.url;
  const isLink = item.type === "link" && item.url;
  const itemWidth = item.width ?? size;
  const itemHeight = item.height ?? size;

  const content = (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: itemWidth,
        height: itemHeight,
        borderRadius: "var(--item-border-radius-ad)",
      }}
    >
      {imageUrl && (
        <img
          alt={item.label || "Ad item"}
          className="h-full w-full object-contain"
          height={itemHeight}
          src={imageUrl}
          width={itemWidth}
        />
      )}
      {item.label && !imageUrl && (
        <span className="text-center font-medium text-foreground text-sm">
          {item.label}
        </span>
      )}
    </div>
  );

  if (isLink) {
    return (
      <a
        className="transition-opacity hover:opacity-80"
        href={item.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return content;
}

function StaticLayout({
  items,
  itemSize,
}: {
  items: AdItem[];
  itemSize: number;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center"
      style={{ gap: "var(--item-spacing-ad)" }}
    >
      {items.map((item) => (
        <AdItemDisplay item={item} key={item.id} size={itemSize} />
      ))}
    </div>
  );
}

function SliderLayout({
  items,
  itemSize,
  speed,
  direction,
  reverse,
  gap,
}: {
  items: AdItem[];
  itemSize: number;
  speed: number;
  direction: "horizontal" | "vertical";
  reverse: boolean;
  gap: number;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <InfiniteSlider
      className="h-full w-full"
      direction={direction}
      gap={gap}
      reverse={reverse}
      speed={speed}
    >
      {items.map((item) => (
        <AdItemDisplay item={item} key={item.id} size={itemSize} />
      ))}
    </InfiniteSlider>
  );
}

// Sample items for preview when no items are configured
const SAMPLE_ITEMS: AdItem[] = [
  {
    id: "sample-1",
    type: "logo",
    url: "https://placehold.co/120x80/2563eb/ffffff?text=Logo+1",
    label: "Sample Logo 1",
  },
  {
    id: "sample-2",
    type: "logo",
    url: "https://placehold.co/120x80/16a34a/ffffff?text=Logo+2",
    label: "Sample Logo 2",
  },
  {
    id: "sample-3",
    type: "logo",
    url: "https://placehold.co/120x80/dc2626/ffffff?text=Logo+3",
    label: "Sample Logo 3",
  },
  {
    id: "sample-4",
    type: "logo",
    url: "https://placehold.co/120x80/9333ea/ffffff?text=Logo+4",
    label: "Sample Logo 4",
  },
];

export default function AdOverlay({
  overlayId,
  useEditMode = false,
}: AdOverlayProps) {
  const overlayQuery = useQuery(
    convexQuery(api.overlays.getById, { id: overlayId })
  );
  const overlay = overlayQuery.data;

  const settingsAtom = getAdSettingsAtom(overlayId);
  const atomSettings = useAtomValue(settingsAtom);
  const setAtomSettings = useSetAtom(settingsAtom);

  // Initialize atom from Convex data on first load (only in edit mode)
  useEffect(() => {
    if (
      useEditMode &&
      overlay?.settings &&
      !isAdSettingsInitialized(overlayId)
    ) {
      const loadedSettings = overlay.settings as AdSettingsData;
      setAtomSettings(loadedSettings);
      setAdSettingsInitialized(overlayId, true);
    }
  }, [useEditMode, overlay, overlayId, setAtomSettings]);

  // Use atom settings in edit mode, otherwise use Convex query settings directly
  const settings = useEditMode
    ? atomSettings
    : ((overlay?.settings as AdSettingsData | undefined) ??
      ({} as AdSettingsData));

  if (overlayQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Overlay not found</p>
      </div>
    );
  }

  if (overlay.type !== "ad") {
    return (
      <div className="flex h-full items-center justify-center">
        <p>This overlay is not an ad overlay</p>
      </div>
    );
  }

  const styleVars = buildStyleVars(settings);
  const layoutMode = settings.layoutMode ?? "static";
  const itemSize = settings.itemSize ?? DEFAULT_ITEM_SIZE;
  const items =
    settings.items && settings.items.length > 0 ? settings.items : SAMPLE_ITEMS;
  const sliderSpeed = settings.sliderSpeed ?? DEFAULT_SLIDER_SPEED;
  const sliderDirection = settings.sliderDirection ?? "horizontal";
  const sliderReverse = settings.sliderReverse ?? false;
  const itemSpacing = settings.itemSpacing ?? DEFAULT_ITEM_SPACING;

  return (
    <div
      className="flex size-full items-center justify-center overflow-hidden"
      style={{
        ...styleVars,
        backgroundColor: "var(--background-color-ad-container)",
        padding: "var(--padding-y-ad-container) var(--padding-x-ad-container)",
        borderWidth: "var(--border-width-ad-container)",
        borderStyle: "solid",
        borderColor: "var(--border-color-ad-container)",
        borderRadius: "var(--border-radius-ad-container)",
      }}
    >
      {layoutMode === "static" ? (
        <StaticLayout itemSize={itemSize} items={items} />
      ) : (
        <SliderLayout
          direction={sliderDirection}
          gap={itemSpacing}
          itemSize={itemSize}
          items={items}
          reverse={sliderReverse}
          speed={sliderSpeed}
        />
      )}
    </div>
  );
}
