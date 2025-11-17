import { atom } from "jotai";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";

export type OverlaySettingsData = {
  testMessagesEnabled?: boolean;
};

// Map to store atoms per overlayId
const overlaySettingsAtomMap = new Map<Id<"overlays">, ReturnType<typeof atom<OverlaySettingsData>>>();

// Flag to track if atom has been initialized from Convex
const initializationMap = new Map<Id<"overlays">, boolean>();

/**
 * Get or create an overlay settings atom for a specific overlay
 */
export function getOverlaySettingsAtom(overlayId: Id<"overlays">) {
  if (!overlaySettingsAtomMap.has(overlayId)) {
    overlaySettingsAtomMap.set(overlayId, atom<OverlaySettingsData>({}));
    initializationMap.set(overlayId, false);
  }
  const atomValue = overlaySettingsAtomMap.get(overlayId);
  if (!atomValue) {
    throw new Error(`Failed to get overlay settings atom for ${overlayId}`);
  }
  return atomValue;
}

/**
 * Check if the atom for an overlay has been initialized
 */
export function isOverlaySettingsInitialized(overlayId: Id<"overlays">): boolean {
  return initializationMap.get(overlayId) ?? false;
}

/**
 * Mark the atom for an overlay as initialized
 */
export function setOverlaySettingsInitialized(overlayId: Id<"overlays">, initialized: boolean): void {
  initializationMap.set(overlayId, initialized);
}

/**
 * Clear atom and initialization state for an overlay (useful for cleanup)
 */
export function clearOverlaySettingsAtom(overlayId: Id<"overlays">): void {
  overlaySettingsAtomMap.delete(overlayId);
  initializationMap.delete(overlayId);
}

