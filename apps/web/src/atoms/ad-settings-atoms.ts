import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { atom } from "jotai";

export type AdLayoutMode = "static" | "slider";
export type AdItemType = "image" | "logo" | "link";

export type AdItem = {
  id: string;
  type: AdItemType;
  url: string; // Image/logo URL or link destination
  imageUrl?: string; // For links, optional image to display
  label?: string; // Optional label/text
  width?: number; // Optional custom width
  height?: number; // Optional custom height
};

export type AdSettingsData = {
  // Layout settings
  layoutMode?: AdLayoutMode;

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

  // Slider settings (when layoutMode is "slider")
  sliderSpeed?: number;
  sliderDirection?: "horizontal" | "vertical";
  sliderReverse?: boolean;
  sliderPauseOnHover?: boolean;

  // Item settings
  itemSize?: number;
  itemBorderRadius?: number;
  itemSpacing?: number;

  // Ad items (images, logos, links)
  items?: AdItem[];
};

// Map to store atoms per overlayId
const adSettingsAtomMap = new Map<
  Id<"overlays">,
  ReturnType<typeof atom<AdSettingsData>>
>();

// Flag to track if atom has been initialized from Convex
const initializationMap = new Map<Id<"overlays">, boolean>();

/**
 * Get or create an ad settings atom for a specific overlay
 */
export function getAdSettingsAtom(overlayId: Id<"overlays">) {
  if (!adSettingsAtomMap.has(overlayId)) {
    adSettingsAtomMap.set(overlayId, atom<AdSettingsData>({}));
    initializationMap.set(overlayId, false);
  }
  const atomValue = adSettingsAtomMap.get(overlayId);
  if (!atomValue) {
    throw new Error(`Failed to get ad settings atom for ${overlayId}`);
  }
  return atomValue;
}

/**
 * Check if the atom for an overlay has been initialized
 */
export function isAdSettingsInitialized(overlayId: Id<"overlays">): boolean {
  return initializationMap.get(overlayId) ?? false;
}

/**
 * Mark the atom for an overlay as initialized
 */
export function setAdSettingsInitialized(
  overlayId: Id<"overlays">,
  initialized: boolean
): void {
  initializationMap.set(overlayId, initialized);
}

/**
 * Clear atom and initialization state for an overlay (useful for cleanup)
 */
export function clearAdSettingsAtom(overlayId: Id<"overlays">): void {
  adSettingsAtomMap.delete(overlayId);
  initializationMap.delete(overlayId);
}
