import type { OverlayElement } from "@/features/canvas/types";

/**
 * Sort elements for rendering based on parent-child relationships and z-index
 */
export function getRenderSortedElements(elements: OverlayElement[]) {
  const childrenMap = new Map<string, OverlayElement[]>();

  for (const el of elements) {
    const pid = el.parentId || "root";
    if (!childrenMap.has(pid)) {
      childrenMap.set(pid, []);
    }
    childrenMap.get(pid)?.push(el);
  }

  const result: OverlayElement[] = [];

  const traverse = (parentId: string) => {
    const siblings = childrenMap.get(parentId) || [];
    siblings.sort((a, b) => a.zIndex - b.zIndex);

    for (const el of siblings) {
      result.push(el);
      traverse(el.id);
    }
  };

  traverse("root");
  return result;
}

/**
 * Get the axis-aligned bounding box (AABB) for a rotated element
 */
export function getRotatedAABB(el: OverlayElement) {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = el.width / 2;
  const hh = el.height / 2;

  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  const rx = corners.map((p) => cx + (p.x * cos - p.y * sin));
  const ry = corners.map((p) => cy + (p.x * sin + p.y * cos));

  return {
    minX: Math.min(...rx),
    maxX: Math.max(...rx),
    minY: Math.min(...ry),
    maxY: Math.max(...ry),
  };
}
