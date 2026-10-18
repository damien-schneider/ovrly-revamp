import { atom } from "jotai";

// ============================================================================
// Scene State
// ============================================================================

export const activeSceneAtom = atom("camera-full");

// ============================================================================
// Media Source Streams
// ============================================================================

export const cameraStreamAtom = atom<MediaStream | null>(null);
export const screenStreamAtom = atom<MediaStream | null>(null);

// ============================================================================
// Source Toggles
// ============================================================================

export const cameraEnabledAtom = atom(false);
export const screenEnabledAtom = atom(false);
export const micEnabledAtom = atom(true);
export const systemAudioEnabledAtom = atom(true);

// ============================================================================
// Audio Levels
// ============================================================================

/** Mic volume 0-1 */
export const micVolumeAtom = atom(1);
/** System audio volume 0-1 */
export const systemAudioVolumeAtom = atom(1);
/** Mic VU meter level 0-1 (read-only from hook) */
export const micLevelAtom = atom(0);
/** System audio VU meter level 0-1 (read-only from hook) */
export const systemLevelAtom = atom(0);

// ============================================================================
// Stream State
// ============================================================================

export type StreamStatus = "idle" | "connecting" | "live" | "error";

export const streamStatusAtom = atom<StreamStatus>("idle");
/** Elapsed stream time in seconds */
export const streamDurationAtom = atom(0);

export interface StreamHealth {
  fps: number;
  bitrate: number;
  droppedFrames: number;
}

export const streamHealthAtom = atom<StreamHealth>({
  fps: 0,
  bitrate: 0,
  droppedFrames: 0,
});

// ============================================================================
// UI State
// ============================================================================

export const chatPanelCollapsedAtom = atom(false);
export const scenePanelCollapsedAtom = atom(false);

// ============================================================================
// Settings Dialog
// ============================================================================

export const settingsDialogOpenAtom = atom(false);
