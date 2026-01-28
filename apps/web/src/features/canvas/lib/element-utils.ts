import { ElementType, type OverlayElement } from "@/features/canvas/types";

// Helper functions for element update operations

export function getDescendantIds(
  elements: OverlayElement[],
  parentId: string
): string[] {
  const children = elements.filter((e) => e.parentId === parentId);
  const result: string[] = [];
  for (const child of children) {
    result.push(child.id);
    result.push(...getDescendantIds(elements, child.id));
  }
  return result;
}

export function findNewParent(
  elements: OverlayElement[],
  cx: number,
  cy: number,
  excludeId: string
): string | null {
  const parent = elements
    .filter((e) => e.type === ElementType.OVERLAY && e.id !== excludeId)
    .sort((a, b) => b.zIndex - a.zIndex)
    .find(
      (p) =>
        cx >= p.x && cx <= p.x + p.width && cy >= p.y && cy <= p.y + p.height
    );
  return parent ? parent.id : null;
}

export function moveDescendants(
  elements: OverlayElement[],
  parentId: string,
  dx: number,
  dy: number
): OverlayElement[] {
  const descendants = getDescendantIds(elements, parentId);
  if (descendants.length === 0) {
    return elements;
  }
  return elements.map((el) => {
    if (descendants.includes(el.id)) {
      return { ...el, x: el.x + dx, y: el.y + dy };
    }
    return el;
  });
}

export function getIndependentUpdateIds(
  elements: OverlayElement[],
  idsToUpdate: string[]
): string[] {
  return idsToUpdate.filter((targetId) => {
    const target = elements.find((e) => e.id === targetId);
    return !(target?.parentId && idsToUpdate.includes(target.parentId));
  });
}

export interface UpdateContext {
  id: string;
  dx: number;
  dy: number;
  isPrimary: boolean;
  updates: Partial<OverlayElement>;
}

export function applyElementUpdate(
  elements: OverlayElement[],
  targetId: string,
  el: OverlayElement,
  ctx: UpdateContext
): OverlayElement[] {
  const newProperties: Partial<OverlayElement> = ctx.isPrimary
    ? { ...ctx.updates }
    : { x: el.x + ctx.dx, y: el.y + ctx.dy };

  // Reparenting check
  const shouldCheckReparent =
    ctx.isPrimary &&
    (newProperties.x !== undefined || newProperties.y !== undefined) &&
    el.type !== ElementType.OVERLAY;

  if (shouldCheckReparent) {
    const cx =
      (newProperties.x ?? el.x) + (newProperties.width ?? el.width) / 2;
    const cy =
      (newProperties.y ?? el.y) + (newProperties.height ?? el.height) / 2;
    newProperties.parentId = findNewParent(elements, cx, cy, targetId);
  }

  let result = elements.map((e) =>
    e.id === targetId ? ({ ...e, ...newProperties } as OverlayElement) : e
  );

  // Move descendants
  const hasPositionChange =
    newProperties.x !== undefined || newProperties.y !== undefined;
  if (hasPositionChange) {
    const moveDx = (newProperties.x ?? el.x) - el.x;
    const moveDy = (newProperties.y ?? el.y) - el.y;
    if (moveDx !== 0 || moveDy !== 0) {
      result = moveDescendants(result, targetId, moveDx, moveDy);
    }
  }

  return result;
}
