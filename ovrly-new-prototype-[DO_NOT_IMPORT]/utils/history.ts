import type { OverlayElement } from "../types";

export interface HistoryState {
  past: OverlayElement[][];
  present: OverlayElement[];
  future: OverlayElement[][];
}

export const initialHistory: HistoryState = {
  past: [],
  present: [],
  future: [],
};

export const pushToHistory = (
  state: HistoryState,
  newPresent: OverlayElement[]
): HistoryState => {
  // If the new state is identical to present, don't push
  if (JSON.stringify(state.present) === JSON.stringify(newPresent)) {
    return state;
  }

  return {
    past: [...state.past, state.present],
    present: newPresent,
    future: [],
  };
};

export const undo = (state: HistoryState): HistoryState => {
  if (state.past.length === 0) {
    return state;
  }

  const previous = state.past.at(-1);
  const newPast = state.past.slice(0, state.past.length - 1);

  return {
    past: newPast,
    present: previous,
    future: [state.present, ...state.future],
  };
};

export const redo = (state: HistoryState): HistoryState => {
  if (state.future.length === 0) {
    return state;
  }

  const next = state.future[0];
  const newFuture = state.future.slice(1);

  return {
    past: [...state.past, state.present],
    present: next,
    future: newFuture,
  };
};
