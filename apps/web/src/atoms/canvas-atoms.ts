import { atom } from "jotai";
import type { OverlayElement } from "@/features/canvas/types";

// ============================================================================
// History State
// ============================================================================

export interface HistoryState {
  past: OverlayElement[][];
  present: OverlayElement[];
  future: OverlayElement[][];
}

const initialHistory: HistoryState = {
  past: [],
  present: [],
  future: [],
};

export const historyAtom = atom<HistoryState>(initialHistory);

// Derived read-only atom for current elements
export const elementsAtom = atom((get) => get(historyAtom).present);

// Action atom to update elements with history tracking
export const updateElementsAtom = atom(
  null,
  (get, set, newElements: OverlayElement[]) => {
    const history = get(historyAtom);
    // Skip if no change
    if (JSON.stringify(history.present) === JSON.stringify(newElements)) {
      return;
    }
    set(historyAtom, {
      past: [...history.past, history.present],
      present: newElements,
      future: [],
    });
  }
);

// Action atom for undo
export const undoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.past.length === 0) {
    return;
  }

  const previous = history.past.at(-1);
  if (!previous) {
    return;
  }
  const newPast = history.past.slice(0, -1);

  set(historyAtom, {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  });
});

// Action atom for redo
export const redoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.future.length === 0) {
    return;
  }

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  set(historyAtom, {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  });
});

// Action atom to reset history (e.g., when loading from server)
export const resetHistoryAtom = atom(
  null,
  (_get, set, initialElements: OverlayElement[]) => {
    set(historyAtom, {
      past: [],
      present: initialElements,
      future: [],
    });
  }
);

// Derived atoms for undo/redo availability
export const canUndoAtom = atom((get) => get(historyAtom).past.length > 0);
export const canRedoAtom = atom((get) => get(historyAtom).future.length > 0);

// ============================================================================
// Selection State
// ============================================================================

export const selectedIdsAtom = atom<string[]>([]);

// ============================================================================
// Viewport State
// ============================================================================

export interface ViewportState {
  scale: number;
  position: { x: number; y: number };
}

export const viewportAtom = atom<ViewportState>({
  scale: 1,
  position: { x: 0, y: 0 },
});

// ============================================================================
// Tool State
// ============================================================================

export type ToolMode = "select" | "hand";

export const toolModeAtom = atom<ToolMode>("select");

// ============================================================================
// Selection Box (Marquee)
// ============================================================================

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const selectionBoxAtom = atom<SelectionBox | null>(null);

// ============================================================================
// Panel Collapse State
// ============================================================================

export const isLayersPanelCollapsedAtom = atom(false);
export const isPropertiesPanelCollapsedAtom = atom(true);

// ============================================================================
// Canvas Interaction State
// ============================================================================

export const isPanningAtom = atom(false);
