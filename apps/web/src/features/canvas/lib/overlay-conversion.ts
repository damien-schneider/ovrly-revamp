import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import type { OverlayElement } from "../types";

/**
 * Database overlay row structure (matches Convex schema)
 */
export interface OverlayRow {
  _id: Id<"overlays">;
  _creationTime: number;
  userId: Id<"profiles">;
  type: string;
  name: string;
  parentId: Id<"overlays"> | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  properties: unknown;
  createdAt: number;
  updatedAt: number;
}

/**
 * Convert backend overlay row to frontend OverlayElement
 */
export function overlayRowToElement(row: OverlayRow): OverlayElement {
  const base = {
    id: row._id,
    name: row.name,
    parentId: row.parentId,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    opacity: row.opacity,
    zIndex: row.zIndex,
    locked: row.locked,
    visible: row.visible,
  };

  // Merge type and properties based on element type
  return {
    ...base,
    type: row.type,
    ...(row.properties as object),
  } as unknown as OverlayElement;
}

/**
 * Convert frontend OverlayElement to backend overlay creation args
 */
export function elementToOverlayCreate(element: OverlayElement): {
  type:
    | "OVERLAY"
    | "TEXT"
    | "BOX"
    | "IMAGE"
    | "CHAT"
    | "EMOTE_WALL"
    | "WEBCAM"
    | "TIMER"
    | "PROGRESS";
  name: string;
  parentId: Id<"overlays"> | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  properties: unknown;
} {
  // Extract base fields
  const {
    id,
    type,
    name,
    parentId,
    x,
    y,
    width,
    height,
    rotation,
    opacity,
    zIndex,
    locked,
    visible,
    ...properties
  } = element;

  return {
    type: type as
      | "OVERLAY"
      | "TEXT"
      | "BOX"
      | "IMAGE"
      | "CHAT"
      | "EMOTE_WALL"
      | "WEBCAM"
      | "TIMER"
      | "PROGRESS",
    name,
    parentId: parentId as Id<"overlays"> | null,
    x,
    y,
    width,
    height,
    rotation,
    opacity,
    zIndex,
    locked,
    visible,
    properties,
  };
}

/**
 * Convert frontend OverlayElement to backend overlay update args
 */
export function elementToOverlayUpdate(
  element: OverlayElement,
  changedFields?: Partial<OverlayElement>
): {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  properties?: unknown;
} {
  if (!changedFields) {
    return { id: element.id };
  }

  const {
    id,
    type,
    name,
    parentId,
    x,
    y,
    width,
    height,
    rotation,
    opacity,
    zIndex,
    locked,
    visible,
    ...properties
  } = changedFields;

  return {
    id: element.id,
    x,
    y,
    width,
    height,
    rotation,
    opacity,
    zIndex,
    locked,
    visible,
    ...(Object.keys(properties).length > 0 ? { properties } : {}),
  };
}
