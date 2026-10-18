import type { Icon } from "@phosphor-icons/react";
import {
  Camera,
  ChatCircle,
  Columns,
  Monitor,
  PictureInPicture,
} from "@phosphor-icons/react";

// ============================================================================
// Types
// ============================================================================

export interface SourceLayout {
  /** X position as fraction of canvas width (0-1) */
  x: number;
  /** Y position as fraction of canvas height (0-1) */
  y: number;
  /** Width as fraction of canvas width (0-1) */
  w: number;
  /** Height as fraction of canvas height (0-1) */
  h: number;
  /** Whether this source is visible in this layout */
  visible: boolean;
}

export interface SceneLayout {
  id: string;
  name: string;
  icon: Icon;
  camera: SourceLayout;
  screen: SourceLayout;
  chat: SourceLayout;
}

// ============================================================================
// Preset Scenes
// ============================================================================

const PIP_W = 0.2;
const PIP_H = 0.25;
const PIP_MARGIN = 0.02;
const CHAT_FOCUS_CAM_W = 0.3;
const CHAT_FOCUS_CAM_H = 0.3;
const CHAT_FOCUS_W = 0.65;

export const SCENE_LAYOUTS: SceneLayout[] = [
  {
    id: "camera-full",
    name: "Camera",
    icon: Camera,
    camera: { x: 0, y: 0, w: 1, h: 1, visible: true },
    screen: { x: 0, y: 0, w: 0, h: 0, visible: false },
    chat: { x: 0, y: 0, w: 0, h: 0, visible: false },
  },
  {
    id: "screen-camera-pip",
    name: "Screen + PiP",
    icon: PictureInPicture,
    camera: {
      x: 1 - PIP_W - PIP_MARGIN,
      y: 1 - PIP_H - PIP_MARGIN,
      w: PIP_W,
      h: PIP_H,
      visible: true,
    },
    screen: { x: 0, y: 0, w: 1, h: 1, visible: true },
    chat: { x: 0, y: 0, w: 0, h: 0, visible: false },
  },
  {
    id: "screen-only",
    name: "Screen",
    icon: Monitor,
    camera: { x: 0, y: 0, w: 0, h: 0, visible: false },
    screen: { x: 0, y: 0, w: 1, h: 1, visible: true },
    chat: { x: 0, y: 0, w: 0, h: 0, visible: false },
  },
  {
    id: "split",
    name: "Split",
    icon: Columns,
    camera: { x: 0, y: 0, w: 0.5, h: 1, visible: true },
    screen: { x: 0.5, y: 0, w: 0.5, h: 1, visible: true },
    chat: { x: 0, y: 0, w: 0, h: 0, visible: false },
  },
  {
    id: "chat-focus",
    name: "Chat",
    icon: ChatCircle,
    camera: {
      x: CHAT_FOCUS_W + 0.025,
      y: 0.02,
      w: CHAT_FOCUS_CAM_W,
      h: CHAT_FOCUS_CAM_H,
      visible: true,
    },
    screen: { x: 0, y: 0, w: 0, h: 0, visible: false },
    chat: { x: 0.02, y: 0.02, w: CHAT_FOCUS_W, h: 0.96, visible: true },
  },
];

export const DEFAULT_SCENE_ID = "camera-full";

export function getSceneById(id: string): SceneLayout {
  return SCENE_LAYOUTS.find((s) => s.id === id) ?? SCENE_LAYOUTS[0];
}
