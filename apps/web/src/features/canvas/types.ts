export const ElementType = {
  OVERLAY: "OVERLAY",
  TEXT: "TEXT",
  BOX: "BOX",
  IMAGE: "IMAGE",
  CHAT: "CHAT",
  EMOTE_WALL: "EMOTE_WALL",
  WEBCAM: "WEBCAM",
  TIMER: "TIMER",
  PROGRESS: "PROGRESS",
} as const;

export type ElementType = (typeof ElementType)[keyof typeof ElementType];

export type SizeMode = "fixed" | "fill";

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // Sizing modes - "fixed" uses px value, "fill" takes 100% of parent/viewport
  widthMode: SizeMode;
  heightMode: SizeMode;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  parentId: string | null;
}

export interface OverlayContainerElement extends BaseElement {
  type: typeof ElementType.OVERLAY;
  backgroundColor: string;
}

export interface TextElement extends BaseElement {
  type: typeof ElementType.TEXT;
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
  textShadow?: string;
  letterSpacing?: number;
  lineHeight?: number;
}

export interface BoxElement extends BaseElement {
  type: typeof ElementType.BOX;
  // Fill - null means no fill
  backgroundColor: string | null;
  // Stroke - null means no stroke (different from 0px stroke)
  borderColor: string | null;
  borderWidth: number | null;
  // Individual corner radii
  borderRadiusTL: number;
  borderRadiusTR: number;
  borderRadiusBL: number;
  borderRadiusBR: number;
  // Whether corner radii are linked
  borderRadiusLinked: boolean;
  // Effects
  boxShadow?: string;
  gradient?: string;
}

export interface ImageElement extends BaseElement {
  type: typeof ElementType.IMAGE;
  src: string;
  objectFit: "cover" | "contain" | "fill";
  storageId?: string; // Convex storage ID for uploaded images
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

export interface ChatStyle {
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  messageSpacing: number;
  usernameColor: string;
  animation: "fade" | "slide" | "none";
  // Enhanced chat styling
  messageBgColor: string;
  messageBorderRadius: number;
  messagePadding: number;
  borderWidth: number;
  borderColor: string;
  showBadges: boolean;
  badgeSize: number;
  textShadow: string;
  maxMessages: number;
  messageDirection: "bottom-up" | "top-down";
}

export interface ChatMessage {
  user: string;
  text: string;
  color: string;
  badges?: string[];
  emotes?: string[];
}

export interface ChatElement extends BaseElement {
  type: typeof ElementType.CHAT;
  style: ChatStyle;
  mockMessages: ChatMessage[];
  previewEnabled: boolean;
}

export interface EmoteWallStyle {
  gravity: "up" | "down" | "left" | "right" | "none";
  spawnMode: "random" | "bottom" | "sides" | "center";
  fadeOut: boolean;
  fadeOutDuration: number;
  emoteSize: number;
  emoteSizeVariation: number;
  rotationEnabled: boolean;
  maxRotation: number;
  bounceEnabled: boolean;
}

export interface EmoteWallElement extends BaseElement {
  type: typeof ElementType.EMOTE_WALL;
  density: number;
  speed: number;
  direction: "up" | "down" | "random";
  style: EmoteWallStyle;
  previewEnabled: boolean;
}

export interface WebcamElement extends BaseElement {
  type: typeof ElementType.WEBCAM;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shape: "rectangle" | "circle";
  shadowColor: string;
  shadowBlur: number;
}

export interface TimerStyle {
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  separator: string;
  padNumbers: boolean;
  completedText: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
}

export interface TimerElement extends BaseElement {
  type: typeof ElementType.TIMER;
  targetDate: string;
  mode: "countdown" | "countup" | "stopwatch";
  fontFamily: string;
  fontSize: number;
  color: string;
  style: TimerStyle;
  isRunning: boolean;
  elapsedMs: number; // For stopwatch mode
}

export interface ProgressBarElement extends BaseElement {
  type: typeof ElementType.PROGRESS;
  progress: number;
  barColor: string;
  backgroundColor: string;
  height: number;
  borderRadius: number;
  showLabel: boolean;
  labelColor: string;
  labelPosition: "inside" | "outside" | "above";
  animated: boolean;
  stripes: boolean;
}

export type OverlayElement =
  | OverlayContainerElement
  | TextElement
  | BoxElement
  | ImageElement
  | ChatElement
  | EmoteWallElement
  | WebcamElement
  | TimerElement
  | ProgressBarElement;

// Default styles for new elements
export const defaultChatStyle: ChatStyle = {
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  textColor: "#ffffff",
  fontFamily: "Inter",
  fontSize: 14,
  borderRadius: 12,
  messageSpacing: 8,
  usernameColor: "#a855f7",
  animation: "slide",
  messageBgColor: "rgba(255, 255, 255, 0.1)",
  messageBorderRadius: 8,
  messagePadding: 8,
  borderWidth: 0,
  borderColor: "transparent",
  showBadges: true,
  badgeSize: 18,
  textShadow: "none",
  maxMessages: 10,
  messageDirection: "bottom-up",
};

export const defaultEmoteWallStyle: EmoteWallStyle = {
  gravity: "up",
  spawnMode: "bottom",
  fadeOut: true,
  fadeOutDuration: 1000,
  emoteSize: 48,
  emoteSizeVariation: 16,
  rotationEnabled: true,
  maxRotation: 30,
  bounceEnabled: false,
};

export const defaultTimerStyle: TimerStyle = {
  showDays: false,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  separator: ":",
  padNumbers: true,
  completedText: "00:00",
  backgroundColor: "transparent",
  borderRadius: 0,
  padding: 0,
};
