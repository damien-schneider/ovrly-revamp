# Canvas Editor Specification

This document defines the architecture and implementation details for the Figma-like canvas editor that replaces the previous overlay-by-overlay settings UI.

## Overview

The canvas editor provides a unified interface for designing stream overlays with:
- **Infinite canvas** with pan/zoom viewport
- **Multi-element selection** with marquee selection
- **Hierarchical layer system** (elements can have parents)
- **Undo/redo history**
- **Real-time widget previews** (Chat, Emote Wall, Webcam, Timer, Progress)
- **OBS export** via HTML browser sources

---

## TypeScript Types

### Element Types Enum

```typescript
export enum ElementType {
  OVERLAY = 'OVERLAY',      // Container for grouping (1280x720 default)
  TEXT = 'TEXT',            // Text layers
  BOX = 'BOX',              // Rectangle shapes
  IMAGE = 'IMAGE',          // Image elements
  CHAT = 'CHAT',            // Twitch chat widget
  EMOTE_WALL = 'EMOTE_WALL', // Emote wall region
  WEBCAM = 'WEBCAM',        // Webcam frame placeholder
  TIMER = 'TIMER',          // Countdown/countup timer
  PROGRESS = 'PROGRESS',    // Progress bar
}
```

### Base Element Interface

```typescript
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
  parentId: string | null;  // Hierarchical parent reference
}
```

### Type-Specific Elements

```typescript
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
  textAlign: 'left' | 'center' | 'right';
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
  objectFit: 'cover' | 'contain' | 'fill';
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
  animation: 'fade' | 'slide' | 'none';
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
  direction: 'up' | 'down' | 'random';
}

export interface WebcamElement extends BaseElement {
  type: ElementType.WEBCAM;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shape: 'rectangle' | 'circle';
  shadowColor: string;
  shadowBlur: number;
}

export interface TimerElement extends BaseElement {
  type: ElementType.TIMER;
  targetDate: string; // ISO string
  mode: 'countdown' | 'countup';
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
```

---

## State Management (Jotai Atoms)

All canvas state is managed via Jotai atoms in `src/atoms/canvas-atoms.ts`.

### History State

```typescript
export interface HistoryState {
  past: OverlayElement[][];
  present: OverlayElement[];
  future: OverlayElement[][];
}

export const historyAtom = atom<HistoryState>({
  past: [],
  present: [],
  future: [],
});

// Derived atom for current elements
export const elementsAtom = atom(
  (get) => get(historyAtom).present,
  (get, set, newElements: OverlayElement[]) => {
    const history = get(historyAtom);
    if (JSON.stringify(history.present) === JSON.stringify(newElements)) return;
    set(historyAtom, {
      past: [...history.past, history.present],
      present: newElements,
      future: [],
    });
  }
);
```

### Selection State

```typescript
export const selectedIdsAtom = atom<string[]>([]);
```

### Viewport State

```typescript
export interface ViewportState {
  scale: number;      // 0.1 to 3
  position: { x: number; y: number };
}

export const viewportAtom = atom<ViewportState>({
  scale: 1,
  position: { x: 0, y: 0 },
});
```

### Tool State

```typescript
export type ToolMode = 'select' | 'hand';

export const toolModeAtom = atom<ToolMode>('select');
```

### Selection Box (Marquee)

```typescript
export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const selectionBoxAtom = atom<SelectionBox | null>(null);
```

### Panel Collapse State

```typescript
export const isLayersPanelCollapsedAtom = atom(false);
export const isPropertiesPanelCollapsedAtom = atom(true); // Auto-expands on selection
```

---

## Component Architecture

### File Structure

```
src/features/canvas/
├── index.tsx                    # Main canvas editor component
├── types.ts                     # TypeScript types
├── components/
│   ├── Canvas.tsx               # Infinite canvas with pan/zoom
│   ├── TransformBox.tsx         # Drag/resize handles wrapper
│   ├── SelectionMarquee.tsx     # Selection box overlay
│   ├── Toolbar.tsx              # Top toolbar with tools/element creation
│   ├── LayersPanel.tsx          # Left sidebar layers tree
│   └── PropertiesPanel.tsx      # Right sidebar element properties
├── widgets/
│   ├── ElementRenderer.tsx      # Switch component for element types
│   ├── BoxWidget.tsx
│   ├── TextWidget.tsx
│   ├── ImageWidget.tsx
│   ├── ChatWidget.tsx
│   ├── EmoteWallWidget.tsx
│   ├── WebcamWidget.tsx
│   ├── TimerWidget.tsx
│   └── ProgressWidget.tsx
├── utils/
│   ├── history.ts               # Undo/redo helpers
│   ├── geometry.ts              # AABB, hit testing
│   └── export-generator.ts      # OBS HTML generation
└── services/
    └── gemini-service.ts        # AI chat theming
```

### Component Responsibilities

#### Canvas.tsx
- Renders infinite canvas with dot grid background
- Handles pan (wheel/hand tool) and zoom (Ctrl+wheel)
- Manages pointer events for selection marquee
- Renders elements via TransformBox + ElementRenderer

#### TransformBox.tsx
- Wraps each element with drag/resize functionality
- 8 resize handles (nw, n, ne, e, se, s, sw, w)
- Zoom-aware delta calculations
- Selection ring UI (blue border when selected)

#### Toolbar.tsx
- Fixed top-center position
- Hand tool (H) / Select tool (V) toggle
- Element creation buttons for all types
- Tooltips on hover

#### LayersPanel.tsx
- Fixed left sidebar, collapsible
- Hierarchical tree view (children indented under parents)
- Visibility toggle per element
- Click to select, Shift+click for multi-select
- Sorted by zIndex (top layers first)

#### PropertiesPanel.tsx
- Fixed right sidebar, auto-expands when element selected
- Name input (inline edit)
- Position & Size inputs (X, Y, Width, Height)
- Type-specific property editors
- AI Designer for Chat widgets (Gemini integration)
- Export/Preview/Copy OBS URI buttons

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Activate hand tool (pan mode) |
| `V` | Activate select tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected elements |
| `Shift+Click` | Multi-select toggle |
| `Ctrl+Wheel` | Zoom in/out |
| `Wheel` | Pan canvas |

---

## Key Algorithms

### Render Order (getRenderSortedElements)

Elements are rendered in hierarchical order:
1. Group by parentId
2. Sort siblings by zIndex (ascending for painter's algorithm)
3. Traverse depth-first: render parent, then children (children appear on top)

### Hit Testing (getRotatedAABB)

For rotated elements, calculate axis-aligned bounding box:
1. Compute center point
2. Rotate each corner by element's rotation
3. Return min/max X/Y bounds

### Group Movement (handleUpdate)

When dragging a selected element:
1. Calculate delta from original position
2. If element is part of multi-selection, move all selected items
3. Filter out children whose parents are also selected (prevent double-move)
4. Propagate movement to all descendants

### Auto-Reparenting

When element center enters an OVERLAY container:
1. Check if element center is inside any OVERLAY bounds
2. Set parentId to the highest-zIndex matching OVERLAY
3. Clear parentId if not inside any OVERLAY

---

## OBS Export

### HTML Generation

The `generateOBSHtml()` function creates a self-contained HTML file:
- Inline CSS with animations
- Google Fonts loaded
- JavaScript renders elements at absolute positions
- Chat messages have slide-in animation
- Emotes have float-up animation

### Usage in OBS

1. Export element → downloads HTML file
2. Copy OBS Data URI → copies base64-encoded data URI
3. Use data URI in OBS browser source URL field

---

## AI Chat Theming (Gemini)

### Service: gemini-service.ts

Uses `@google/genai` SDK with `gemini-3-flash-preview` model.

Input: Natural language prompt (e.g., "Soft glassmorphism with blue neon text")

Output: Partial<ChatStyle> with:
- backgroundColor (rgba)
- textColor (hex)
- usernameColor (hex)
- fontFamily
- borderRadius

---

## Route Structure

```
/editor/:projectId    → Canvas editor (new)
/overlay/:overlayId   → Public OBS browser source (existing)
```

The editor route loads/saves elements to the overlay's `settings.elements` array in Convex.

---

## Migration Notes

### From Current App

- Keep existing `/chat/:id`, `/wall-emote/:id` routes working (backwards compatibility)
- Reuse `useTwitchChat` hook for live chat in ChatWidget
- Reuse Motion library for animations
- Reuse Radix UI components for PropertiesPanel inputs

### From Prototype

- Copy all component logic (do not import)
- Convert useState to Jotai atoms
- Add Convex integration for persistence
- Use existing UI component library
