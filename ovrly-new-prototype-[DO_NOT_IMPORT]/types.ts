export enum ElementType {
  OVERLAY = "OVERLAY",
  TEXT = "TEXT",
  BOX = "BOX",
  IMAGE = "IMAGE",
  CHAT = "CHAT",
  EMOTE_WALL = "EMOTE_WALL",
  WEBCAM = "WEBCAM",
  TIMER = "TIMER",
  PROGRESS = "PROGRESS",
}

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  parentId: string | null;
}

export interface OverlayContainerElement extends BaseElement {
  type: ElementType.OVERLAY;
  backgroundColor: string;
}

export interface TextElement extends BaseElement {
  type: ElementType.TEXT;
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
}

export interface BoxElement extends BaseElement {
  type: ElementType.BOX;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

export interface ImageElement extends BaseElement {
  type: ElementType.IMAGE;
  src: string;
  objectFit: "cover" | "contain" | "fill";
}

export interface ChatStyle {
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  borderRadius: number;
  messageSpacing: number;
  showAvatars: boolean;
  usernameColor: string;
  animation: "fade" | "slide" | "none";
}

export interface ChatElement extends BaseElement {
  type: ElementType.CHAT;
  style: ChatStyle;
  mockMessages: { user: string; text: string; color: string }[];
}

export interface EmoteWallElement extends BaseElement {
  type: ElementType.EMOTE_WALL;
  density: number;
  speed: number;
  direction: "up" | "down" | "random";
}

export interface WebcamElement extends BaseElement {
  type: ElementType.WEBCAM;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shape: "rectangle" | "circle";
  shadowColor: string;
  shadowBlur: number;
}

export interface TimerElement extends BaseElement {
  type: ElementType.TIMER;
  targetDate: string; // ISO string for countdown or null for count up
  mode: "countdown" | "countup";
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface ProgressBarElement extends BaseElement {
  type: ElementType.PROGRESS;
  progress: number; // 0-100
  barColor: string;
  backgroundColor: string;
  height: number;
  borderRadius: number;
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
