import type { OverlayElement } from "@/features/canvas/types";

/**
 * Get all siblings of an element (elements with the same parentId)
 */
export function getSiblings(
  elementId: string,
  elements: OverlayElement[]
): OverlayElement[] {
  const element = elements.find((el) => el.id === elementId);
  if (!element) {
    return [];
  }
  return elements.filter(
    (el) => el.parentId === element.parentId && el.id !== elementId
  );
}

/**
 * Get all elements with a specific parentId, sorted by z-index
 */
export function getChildrenSorted(
  parentId: string | null,
  elements: OverlayElement[]
): OverlayElement[] {
  return elements
    .filter((el) => el.parentId === parentId)
    .sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Renumber all siblings with compact sequential z-indexes (0, 1, 2, 3...)
 * Preserves relative ordering
 */
export function renumberSiblings(
  parentId: string | null,
  elements: OverlayElement[]
): OverlayElement[] {
  const siblings = getChildrenSorted(parentId, elements);
  const siblingIds = new Set(siblings.map((s) => s.id));

  return elements.map((el) => {
    if (!siblingIds.has(el.id)) {
      return el;
    }
    const newIndex = siblings.findIndex((s) => s.id === el.id);
    return { ...el, zIndex: newIndex };
  });
}

/**
 * Check if moving elements would create a circular reference
 * (i.e., trying to drop a parent into its own descendant)
 */
export function wouldCreateCircularReference(
  movingIds: string[],
  targetParentId: string | null,
  elements: OverlayElement[]
): boolean {
  if (targetParentId === null) {
    return false;
  }

  const movingSet = new Set(movingIds);

  const isDescendant = (
    elementId: string,
    ancestorIds: Set<string>
  ): boolean => {
    const element = elements.find((el) => el.id === elementId);
    if (!element) {
      return false;
    }
    if (ancestorIds.has(element.id)) {
      return true;
    }
    if (element.parentId === null) {
      return false;
    }
    return isDescendant(element.parentId, ancestorIds);
  };

  return isDescendant(targetParentId, movingSet);
}

/**
 * Bring selected elements to front (highest z-index among siblings)
 * Preserves relative order of selected elements
 */
export function bringToFront(
  elementIds: string[],
  elements: OverlayElement[]
): OverlayElement[] {
  if (elementIds.length === 0) {
    return elements;
  }

  // Group elements by parent
  const elementsByParent = new Map<string | null, string[]>();
  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (el) {
      const key = el.parentId;
      if (!elementsByParent.has(key)) {
        elementsByParent.set(key, []);
      }
      elementsByParent.get(key)?.push(id);
    }
  }

  let result = [...elements];

  for (const [parentId, ids] of elementsByParent) {
    const siblings = getChildrenSorted(parentId, result);
    const selected = siblings.filter((s) => ids.includes(s.id));
    const unselected = siblings.filter((s) => !ids.includes(s.id));

    // Reorder: unselected first, then selected (at the top)
    const newOrder = [...unselected, ...selected];

    // Reassign z-indexes
    result = result.map((el) => {
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      if (newIndex === -1) {
        return el;
      }
      return { ...el, zIndex: newIndex };
    });
  }

  return result;
}

/**
 * Bring selected elements forward by one position
 */
export function bringForward(
  elementIds: string[],
  elements: OverlayElement[]
): OverlayElement[] {
  if (elementIds.length === 0) {
    return elements;
  }

  // Group elements by parent
  const elementsByParent = new Map<string | null, string[]>();
  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (el) {
      const key = el.parentId;
      if (!elementsByParent.has(key)) {
        elementsByParent.set(key, []);
      }
      elementsByParent.get(key)?.push(id);
    }
  }

  let result = [...elements];

  for (const [parentId, ids] of elementsByParent) {
    const siblings = getChildrenSorted(parentId, result);
    const idSet = new Set(ids);

    // Find the highest z-index among selected elements
    const selectedIndices = siblings
      .map((s, i) => (idSet.has(s.id) ? i : -1))
      .filter((i) => i !== -1);

    if (selectedIndices.length === 0) {
      continue;
    }

    const highestSelectedIndex = Math.max(...selectedIndices);

    // If already at top, nothing to do for this parent
    if (highestSelectedIndex >= siblings.length - 1) {
      continue;
    }

    // Swap the element just above the highest selected with the highest selected
    const newOrder = [...siblings];
    const nextIndex = highestSelectedIndex + 1;

    // Move the element above the selection to below all selected elements
    const elementAbove = newOrder[nextIndex];
    const lowestSelectedIndex = Math.min(...selectedIndices);

    // Remove element above and insert it below the lowest selected
    newOrder.splice(nextIndex, 1);
    newOrder.splice(lowestSelectedIndex, 0, elementAbove);

    // Reassign z-indexes
    result = result.map((el) => {
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      if (newIndex === -1) {
        return el;
      }
      return { ...el, zIndex: newIndex };
    });
  }

  return result;
}

/**
 * Send selected elements backward by one position
 */
export function sendBackward(
  elementIds: string[],
  elements: OverlayElement[]
): OverlayElement[] {
  if (elementIds.length === 0) {
    return elements;
  }

  // Group elements by parent
  const elementsByParent = new Map<string | null, string[]>();
  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (el) {
      const key = el.parentId;
      if (!elementsByParent.has(key)) {
        elementsByParent.set(key, []);
      }
      elementsByParent.get(key)?.push(id);
    }
  }

  let result = [...elements];

  for (const [parentId, ids] of elementsByParent) {
    const siblings = getChildrenSorted(parentId, result);
    const idSet = new Set(ids);

    // Find the lowest z-index among selected elements
    const selectedIndices = siblings
      .map((s, i) => (idSet.has(s.id) ? i : -1))
      .filter((i) => i !== -1);

    if (selectedIndices.length === 0) {
      continue;
    }

    const lowestSelectedIndex = Math.min(...selectedIndices);

    // If already at bottom, nothing to do for this parent
    if (lowestSelectedIndex <= 0) {
      continue;
    }

    // Move the element below the selection to above all selected elements
    const newOrder = [...siblings];
    const prevIndex = lowestSelectedIndex - 1;
    const highestSelectedIndex = Math.max(...selectedIndices);

    // Remove element below and insert it above the highest selected
    const elementBelow = newOrder[prevIndex];
    newOrder.splice(prevIndex, 1);
    newOrder.splice(highestSelectedIndex, 0, elementBelow);

    // Reassign z-indexes
    result = result.map((el) => {
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      if (newIndex === -1) {
        return el;
      }
      return { ...el, zIndex: newIndex };
    });
  }

  return result;
}

/**
 * Send selected elements to back (lowest z-index among siblings)
 * Preserves relative order of selected elements
 */
export function sendToBack(
  elementIds: string[],
  elements: OverlayElement[]
): OverlayElement[] {
  if (elementIds.length === 0) {
    return elements;
  }

  // Group elements by parent
  const elementsByParent = new Map<string | null, string[]>();
  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (el) {
      const key = el.parentId;
      if (!elementsByParent.has(key)) {
        elementsByParent.set(key, []);
      }
      elementsByParent.get(key)?.push(id);
    }
  }

  let result = [...elements];

  for (const [parentId, ids] of elementsByParent) {
    const siblings = getChildrenSorted(parentId, result);
    const selected = siblings.filter((s) => ids.includes(s.id));
    const unselected = siblings.filter((s) => !ids.includes(s.id));

    // Reorder: selected first (at the bottom), then unselected
    const newOrder = [...selected, ...unselected];

    // Reassign z-indexes
    result = result.map((el) => {
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      if (newIndex === -1) {
        return el;
      }
      return { ...el, zIndex: newIndex };
    });
  }

  return result;
}

/**
 * Move elements to a new position, optionally changing parent
 * Used for drag-and-drop reordering in the layers panel
 */
export function moveToPosition(
  elementIds: string[],
  targetIndex: number,
  newParentId: string | null,
  elements: OverlayElement[]
): OverlayElement[] {
  if (elementIds.length === 0) {
    return elements;
  }

  // Check for circular reference
  if (wouldCreateCircularReference(elementIds, newParentId, elements)) {
    return elements;
  }

  const movingSet = new Set(elementIds);

  // Get the moving elements, preserving their relative z-index order
  const movingElements = elements
    .filter((el) => movingSet.has(el.id))
    .sort((a, b) => a.zIndex - b.zIndex);

  // Get siblings at the target parent (excluding moving elements)
  const targetSiblings = getChildrenSorted(newParentId, elements).filter(
    (el) => !movingSet.has(el.id)
  );

  // Insert moving elements at target index
  const clampedIndex = Math.max(
    0,
    Math.min(targetIndex, targetSiblings.length)
  );
  const newOrder = [
    ...targetSiblings.slice(0, clampedIndex),
    ...movingElements,
    ...targetSiblings.slice(clampedIndex),
  ];

  // Update elements
  let result = elements.map((el) => {
    if (movingSet.has(el.id)) {
      // Update parent and z-index for moving elements
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      return { ...el, parentId: newParentId, zIndex: newIndex };
    }

    // Update z-index for other siblings at the target parent
    if (el.parentId === newParentId) {
      const newIndex = newOrder.findIndex((s) => s.id === el.id);
      if (newIndex !== -1) {
        return { ...el, zIndex: newIndex };
      }
    }

    return el;
  });

  // Renumber the original parent's siblings if elements moved to a different parent
  const originalParents = new Set(
    movingElements.map((el) => el.parentId).filter((p) => p !== newParentId)
  );

  for (const parentId of originalParents) {
    result = renumberSiblings(parentId, result);
  }

  return result;
}

/**
 * Check if elements can be brought forward (not already at top)
 */
export function canBringForward(
  elementIds: string[],
  elements: OverlayElement[]
): boolean {
  if (elementIds.length === 0) {
    return false;
  }

  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (!el) {
      continue;
    }
    const siblings = getChildrenSorted(el.parentId, elements);
    const maxZIndex = Math.max(...siblings.map((s) => s.zIndex));
    if (el.zIndex < maxZIndex) {
      return true;
    }
  }
  return false;
}

/**
 * Check if elements can be sent backward (not already at bottom)
 */
export function canSendBackward(
  elementIds: string[],
  elements: OverlayElement[]
): boolean {
  if (elementIds.length === 0) {
    return false;
  }

  for (const id of elementIds) {
    const el = elements.find((e) => e.id === id);
    if (!el) {
      continue;
    }
    const siblings = getChildrenSorted(el.parentId, elements);
    const minZIndex = Math.min(...siblings.map((s) => s.zIndex));
    if (el.zIndex > minZIndex) {
      return true;
    }
  }
  return false;
}
