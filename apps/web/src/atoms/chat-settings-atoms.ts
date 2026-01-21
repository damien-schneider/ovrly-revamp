import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { atom } from "jotai";

export interface ChatSettingsData {
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
}

// Map to store atoms per overlayId
const chatSettingsAtomMap = new Map<
  Id<"overlays">,
  ReturnType<typeof atom<ChatSettingsData>>
>();

// Flag to track if atom has been initialized from Convex
const initializationMap = new Map<Id<"overlays">, boolean>();

/**
 * Get or create a chat settings atom for a specific overlay
 */
export function getChatSettingsAtom(overlayId: Id<"overlays">) {
  if (!chatSettingsAtomMap.has(overlayId)) {
    chatSettingsAtomMap.set(overlayId, atom<ChatSettingsData>({}));
    initializationMap.set(overlayId, false);
  }
  const atomValue = chatSettingsAtomMap.get(overlayId);
  if (!atomValue) {
    throw new Error(`Failed to get chat settings atom for ${overlayId}`);
  }
  return atomValue;
}

/**
 * Check if the atom for an overlay has been initialized
 */
export function isChatSettingsInitialized(overlayId: Id<"overlays">): boolean {
  return initializationMap.get(overlayId) ?? false;
}

/**
 * Mark the atom for an overlay as initialized
 */
export function setChatSettingsInitialized(
  overlayId: Id<"overlays">,
  initialized: boolean
): void {
  initializationMap.set(overlayId, initialized);
}

/**
 * Clear atom and initialization state for an overlay (useful for cleanup)
 */
export function clearChatSettingsAtom(overlayId: Id<"overlays">): void {
  chatSettingsAtomMap.delete(overlayId);
  initializationMap.delete(overlayId);
}
