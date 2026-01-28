# Single Canvas Overlay Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor from multi-project canvas system to single canvas per user with hierarchical overlay elements stored as individual database rows.

**Architecture:** Remove projects table, rewrite overlays table with parentId hierarchy (like Figma). Each overlay element is a row with type-specific properties. Canvas editor loads all user overlays and reconstructs tree structure in memory.

**Tech Stack:** Convex (backend), TanStack Router (routing), Jotai (state), React, TypeScript

---

## Task 1: Update Database Schema

**Files:**
- Modify: `packages/backend/convex/schema.ts`

**Step 1: Replace overlays and remove projects tables**

Update the schema to remove the old overlays and projects tables, and create the new hierarchical overlays table:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    authId: v.string(),
    email: v.union(v.string(), v.null()),
    name: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
    emailVerified: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),

  // Hierarchical overlay elements - each element is a row
  overlays: defineTable({
    userId: v.id("profiles"),
    type: v.union(
      v.literal("OVERLAY"),
      v.literal("TEXT"),
      v.literal("BOX"),
      v.literal("IMAGE"),
      v.literal("CHAT"),
      v.literal("EMOTE_WALL"),
      v.literal("WEBCAM"),
      v.literal("TIMER"),
      v.literal("PROGRESS")
    ),
    name: v.string(),
    parentId: v.union(v.id("overlays"), v.null()),

    // Transform properties
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    rotation: v.number(),
    opacity: v.number(),
    zIndex: v.number(),
    locked: v.boolean(),
    visible: v.boolean(),

    // Type-specific properties (JSON)
    properties: v.any(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_parentId", ["userId", "parentId"]),

  commands: defineTable({
    userId: v.id("profiles"),
    trigger: v.string(),
    response: v.string(),
    enabled: v.boolean(),
    cooldown: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_trigger", ["userId", "trigger"]),
});
```

**Step 2: Run Convex schema sync**

```bash
cd packages/backend
npx convex dev
```

Expected: Convex will detect schema changes and prompt to clear data (since we have no users). Confirm to proceed.

**Step 3: Commit schema changes**

```bash
git add packages/backend/convex/schema.ts
git commit -m "feat: replace overlays/projects with hierarchical overlays table"
```

---

## Task 2: Rewrite Backend Overlays API

**Files:**
- Modify: `packages/backend/convex/overlays.ts`

**Step 1: Rewrite overlays API**

Replace the entire file with the new hierarchical overlay API:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

/**
 * List all overlays for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getProfile(ctx);
    return await ctx.db
      .query("overlays")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Get a single overlay by ID
 */
export const getById = query({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Get child overlays of a parent
 */
export const getChildren = query({
  args: { parentId: v.id("overlays") },
  handler: async (ctx, { parentId }) => {
    const user = await getProfile(ctx);
    return await ctx.db
      .query("overlays")
      .withIndex("by_userId_parentId", (q) =>
        q.eq("userId", user._id).eq("parentId", parentId)
      )
      .collect();
  },
});

/**
 * Create a new overlay element
 */
export const create = mutation({
  args: {
    type: v.union(
      v.literal("OVERLAY"),
      v.literal("TEXT"),
      v.literal("BOX"),
      v.literal("IMAGE"),
      v.literal("CHAT"),
      v.literal("EMOTE_WALL"),
      v.literal("WEBCAM"),
      v.literal("TIMER"),
      v.literal("PROGRESS")
    ),
    name: v.string(),
    parentId: v.optional(v.union(v.id("overlays"), v.null())),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    rotation: v.optional(v.number()),
    opacity: v.optional(v.number()),
    zIndex: v.number(),
    locked: v.optional(v.boolean()),
    visible: v.optional(v.boolean()),
    properties: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await getProfile(ctx);
    const now = Date.now();

    return await ctx.db.insert("overlays", {
      userId: user._id,
      type: args.type,
      name: args.name,
      parentId: args.parentId ?? null,
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
      rotation: args.rotation ?? 0,
      opacity: args.opacity ?? 1,
      zIndex: args.zIndex,
      locked: args.locked ?? false,
      visible: args.visible ?? true,
      properties: args.properties,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing overlay element
 */
export const update = mutation({
  args: {
    id: v.id("overlays"),
    name: v.optional(v.string()),
    parentId: v.optional(v.union(v.id("overlays"), v.null())),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    rotation: v.optional(v.number()),
    opacity: v.optional(v.number()),
    zIndex: v.optional(v.number()),
    locked: v.optional(v.boolean()),
    visible: v.optional(v.boolean()),
    properties: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const user = await getProfile(ctx);
    const overlay = await ctx.db.get(id);

    if (!overlay) {
      throw new Error("Overlay not found");
    }

    if (overlay.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Batch update multiple overlay elements
 */
export const batchUpdate = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("overlays"),
        x: v.optional(v.number()),
        y: v.optional(v.number()),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        rotation: v.optional(v.number()),
        opacity: v.optional(v.number()),
        zIndex: v.optional(v.number()),
        locked: v.optional(v.boolean()),
        visible: v.optional(v.boolean()),
        properties: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, { updates }) => {
    const user = await getProfile(ctx);
    const now = Date.now();

    for (const update of updates) {
      const { id, ...fields } = update;
      const overlay = await ctx.db.get(id);

      if (!overlay || overlay.userId !== user._id) {
        continue;
      }

      await ctx.db.patch(id, {
        ...fields,
        updatedAt: now,
      });
    }
  },
});

/**
 * Delete an overlay element (cascades to children)
 */
export const remove = mutation({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    const user = await getProfile(ctx);
    const overlay = await ctx.db.get(id);

    if (!overlay) {
      throw new Error("Overlay not found");
    }

    if (overlay.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Delete children first
    const children = await ctx.db
      .query("overlays")
      .withIndex("by_userId_parentId", (q) =>
        q.eq("userId", user._id).eq("parentId", id)
      )
      .collect();

    for (const child of children) {
      await ctx.db.delete(child._id);
    }

    // Delete the overlay itself
    await ctx.db.delete(id);
  },
});

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a URL for a stored file
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
```

**Step 2: Verify Convex accepts the changes**

```bash
cd packages/backend
npx convex dev
```

Expected: Convex should compile without errors and show updated API endpoints.

**Step 3: Commit backend API**

```bash
git add packages/backend/convex/overlays.ts
git commit -m "feat: rewrite overlays API with hierarchical structure"
```

---

## Task 3: Remove Old Projects Backend

**Files:**
- Delete: `packages/backend/convex/projects.ts`

**Step 1: Delete projects file**

```bash
rm packages/backend/convex/projects.ts
```

**Step 2: Verify Convex regenerates types**

```bash
cd packages/backend
npx convex dev
```

Expected: Convex should regenerate types without `api.projects` exports.

**Step 3: Commit deletion**

```bash
git add packages/backend/convex/projects.ts
git commit -m "chore: remove projects API (replaced by hierarchical overlays)"
```

---

## Task 4: Create Overlay Type Conversion Utilities

**Files:**
- Create: `apps/web/src/features/canvas/lib/overlay-conversion.ts`

**Step 1: Create conversion utilities**

This file converts between frontend OverlayElement types and backend overlay rows:

```typescript
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import type { OverlayElement } from "../types";
import { ElementType } from "../types";

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
  } as OverlayElement;
}

/**
 * Convert frontend OverlayElement to backend overlay creation args
 */
export function elementToOverlayCreate(element: OverlayElement): {
  type: string;
  name: string;
  parentId: string | null;
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
```

**Step 2: Commit conversion utilities**

```bash
git add apps/web/src/features/canvas/lib/overlay-conversion.ts
git commit -m "feat: add overlay row to element conversion utilities"
```

---

## Task 5: Create New Canvas Editor Route

**Files:**
- Create: `apps/web/src/routes/overlays.tsx`

**Step 1: Create single canvas route**

This replaces the old multi-project editor:

```typescript
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { useSetAtom } from "jotai";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resetHistoryAtom, elementsAtom } from "@/atoms/canvas-atoms";
import { CanvasEditor } from "@/features/canvas";
import type { OverlayElement } from "@/features/canvas/types";
import {
  overlayRowToElement,
  type OverlayRow,
} from "@/features/canvas/lib/overlay-conversion";
import { useAtomValue } from "jotai";

export const Route = createFileRoute("/overlays")({
  component: OverlaysPage,
});

function OverlaysPage() {
  return (
    <>
      <Authenticated>
        <CanvasEditorPage />
      </Authenticated>
      <Unauthenticated>
        <Navigate search={{ redirect: "/overlays" }} to="/login" />
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-svh items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}

function CanvasEditorPage() {
  const overlayRows = useQuery(api.overlays.list);
  const batchUpdate = useMutation(api.overlays.batchUpdate);

  const resetHistory = useSetAtom(resetHistoryAtom);
  const elements = useAtomValue(elementsAtom);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  // Initialize canvas with overlay data
  useEffect(() => {
    if (overlayRows && !isInitialized.current) {
      const elements = overlayRows.map((row) =>
        overlayRowToElement(row as OverlayRow)
      );
      resetHistory(elements);
      lastSavedRef.current = JSON.stringify(elements);
      isInitialized.current = true;
    }
  }, [overlayRows, resetHistory]);

  // Auto-save with debounce
  useEffect(() => {
    if (!isInitialized.current || !overlayRows) {
      return;
    }

    const currentJson = JSON.stringify(elements);
    if (currentJson === lastSavedRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Build updates for changed elements
        const updates = elements.map((el) => ({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          rotation: el.rotation,
          opacity: el.opacity,
          zIndex: el.zIndex,
          locked: el.locked,
          visible: el.visible,
          properties: (() => {
            const { id, type, name, parentId, x, y, width, height, rotation, opacity, zIndex, locked, visible, ...props } = el;
            return props;
          })(),
        }));

        await batchUpdate({ updates });
        lastSavedRef.current = currentJson;
        setHasUnsavedChanges(false);
      } catch (error) {
        toast.error("Failed to save changes");
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, overlayRows, batchUpdate]);

  // Warn about unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (overlayRows === undefined) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="text-gray-500">Loading canvas...</div>
      </div>
    );
  }

  const renderSaveStatus = () => {
    if (isSaving) {
      return (
        <span className="flex items-center gap-1 font-medium text-[10px] text-muted-foreground">
          <Save className="h-2.5 w-2.5 animate-pulse" />
          Saving...
        </span>
      );
    }
    if (hasUnsavedChanges) {
      return (
        <span className="font-medium text-[10px] text-amber-500">Unsaved</span>
      );
    }
    return (
      <span className="font-medium text-[10px] text-emerald-500 uppercase tracking-wider opacity-80">
        Saved
      </span>
    );
  };

  return (
    <div className="relative h-svh w-full">
      <CanvasEditor
        projectName="My Canvas"
        saveStatus={renderSaveStatus()}
      />
    </div>
  );
}
```

**Step 2: Test route loads**

```bash
npm run dev
```

Navigate to `http://localhost:3001/overlays` and verify:
- Route loads without errors
- Canvas editor renders
- No console errors

**Step 3: Commit canvas route**

```bash
git add apps/web/src/routes/overlays.tsx
git commit -m "feat: create single canvas editor route at /overlays"
```

---

## Task 6: Create Full Canvas View Route

**Files:**
- Create: `apps/web/src/routes/overlays.view.tsx`

**Step 1: Create full canvas OBS view**

This renders the entire canvas for OBS:

```typescript
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import type { OverlayElement } from "@/features/canvas/types";
import { ElementType } from "@/features/canvas/types";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";
import {
  overlayRowToElement,
  type OverlayRow,
} from "@/features/canvas/lib/overlay-conversion";

export const Route = createFileRoute("/overlays/view")({
  component: OverlaysViewPage,
});

function OverlaysViewPage() {
  const overlayRows = useQuery(api.overlays.list);

  if (overlayRows === undefined) {
    return null; // Loading - show nothing in OBS
  }

  const elements = overlayRows.map((row) =>
    overlayRowToElement(row as OverlayRow)
  );

  // Find the main overlay container (if any) to use as root dimensions
  const overlayContainer = elements.find(
    (el) => el.type === ElementType.OVERLAY && el.parentId === null
  );

  // Sort elements by zIndex for proper layering
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: overlayContainer?.width ?? "100vw",
        height: overlayContainer?.height ?? "100vh",
        backgroundColor: overlayContainer
          ? (overlayContainer as { backgroundColor?: string }).backgroundColor
          : "transparent",
      }}
    >
      {sortedElements.map((el) => {
        if (!el.visible) {
          return null;
        }

        // Skip the root overlay container itself (it's the background)
        if (
          el.type === ElementType.OVERLAY &&
          el.parentId === null &&
          overlayContainer &&
          el.id === overlayContainer.id
        ) {
          return null;
        }

        return (
          <div
            className="absolute"
            key={el.id}
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity,
              zIndex: el.zIndex,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            <ElementRenderer element={el} isLiveView />
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Test full canvas view**

Navigate to `http://localhost:3001/overlays/view` and verify:
- View renders all canvas elements
- Elements respect positioning and z-index
- No authentication required

**Step 3: Commit full canvas view**

```bash
git add apps/web/src/routes/overlays.view.tsx
git commit -m "feat: add full canvas OBS view at /overlays/view"
```

---

## Task 7: Create Individual Element View Route

**Files:**
- Create: `apps/web/src/routes/overlays.view.$elementId.tsx`

**Step 1: Create element view route**

This renders a single element full-screen:

```typescript
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ElementRenderer } from "@/features/canvas/widgets/ElementRenderer";
import {
  overlayRowToElement,
  type OverlayRow,
} from "@/features/canvas/lib/overlay-conversion";

export const Route = createFileRoute("/overlays/view/$elementId")({
  component: ElementViewPage,
});

function ElementViewPage() {
  const { elementId } = Route.useParams();
  const element = useQuery(api.overlays.getById, {
    id: elementId as Id<"overlays">,
  });

  if (element === undefined) {
    return null; // Loading
  }

  if (element === null) {
    return null; // Not found - show nothing in OBS
  }

  const overlayElement = overlayRowToElement(element as OverlayRow);

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          width: overlayElement.width,
          height: overlayElement.height,
          opacity: overlayElement.opacity,
          transform: `rotate(${overlayElement.rotation}deg)`,
        }}
      >
        <ElementRenderer element={overlayElement} isLiveView />
      </div>
    </div>
  );
}
```

**Step 2: Test element view**

Create an element in the canvas, note its ID, then navigate to:
`http://localhost:3001/overlays/view/{elementId}`

Verify:
- Element renders full-screen
- Element is centered
- No authentication required

**Step 3: Commit element view**

```bash
git add apps/web/src/routes/overlays.view.$elementId.tsx
git commit -m "feat: add individual element OBS view at /overlays/view/{id}"
```

---

## Task 8: Delete Old Route Files

**Files:**
- Delete: `apps/web/src/routes/(with_navbar)/overlays.tsx`
- Delete: `apps/web/src/routes/overlays.index.tsx`
- Delete: `apps/web/src/routes/overlays.$projectId.tsx`
- Delete: `apps/web/src/routes/overlays.$projectId.view.tsx`
- Delete: `apps/web/src/routes/preview.overlay.$overlayId.tsx`

**Step 1: Delete old project routes**

```bash
rm apps/web/src/routes/\(with_navbar\)/overlays.tsx
rm apps/web/src/routes/overlays.index.tsx
rm apps/web/src/routes/overlays.\$projectId.tsx
rm apps/web/src/routes/overlays.\$projectId.view.tsx
rm apps/web/src/routes/preview.overlay.\$overlayId.tsx
```

**Step 2: Verify app still runs**

```bash
npm run dev
```

Expected: App builds successfully, no TypeScript errors

**Step 3: Commit deletions**

```bash
git add -A
git commit -m "chore: remove old project-based routes"
```

---

## Task 9: Update Canvas Element Creation

**Files:**
- Modify: `apps/web/src/features/canvas/hooks/use-create-element.ts`

**Step 1: Update element creation to save to backend**

The current hook only adds to local state. Update it to also persist to backend:

```typescript
import { api } from "@ovrly-revamp/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { OverlayElement } from "../types";
import { ElementType } from "../types";
import {
  defaultChatStyle,
  defaultEmoteWallStyle,
  defaultTimerStyle,
} from "../types";
import { elementToOverlayCreate } from "../lib/overlay-conversion";

export function useCreateElement(
  updateElements: (fn: (prev: OverlayElement[]) => OverlayElement[]) => void,
  setSelectedIds: (ids: string[]) => void,
  setToolMode: (mode: "select" | "hand") => void
) {
  const createOverlay = useMutation(api.overlays.create);

  const addElement = async (type: ElementType) => {
    const baseX = 100;
    const baseY = 100;

    let newElement: OverlayElement;

    switch (type) {
      case ElementType.OVERLAY:
        newElement = {
          id: nanoid(),
          type: ElementType.OVERLAY,
          name: "Frame",
          x: baseX,
          y: baseY,
          width: 800,
          height: 600,
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          locked: false,
          visible: true,
          parentId: null,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        };
        break;

      case ElementType.TEXT:
        newElement = {
          id: nanoid(),
          type: ElementType.TEXT,
          name: "Text",
          x: baseX,
          y: baseY,
          width: 200,
          height: 50,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          content: "Edit this text",
          fontFamily: "Inter",
          fontSize: 24,
          color: "#ffffff",
          fontWeight: "normal",
          textAlign: "left",
        };
        break;

      case ElementType.BOX:
        newElement = {
          id: nanoid(),
          type: ElementType.BOX,
          name: "Box",
          x: baseX,
          y: baseY,
          width: 200,
          height: 200,
          rotation: 0,
          opacity: 1,
          zIndex: 0,
          locked: false,
          visible: true,
          parentId: null,
          backgroundColor: "#3b82f6",
          borderColor: "transparent",
          borderWidth: 0,
          borderRadius: 8,
        };
        break;

      case ElementType.IMAGE:
        newElement = {
          id: nanoid(),
          type: ElementType.IMAGE,
          name: "Image",
          x: baseX,
          y: baseY,
          width: 300,
          height: 300,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          src: "",
          objectFit: "cover",
        };
        break;

      case ElementType.CHAT:
        newElement = {
          id: nanoid(),
          type: ElementType.CHAT,
          name: "Chat",
          x: baseX,
          y: baseY,
          width: 400,
          height: 600,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          style: defaultChatStyle,
          mockMessages: [],
          previewEnabled: false,
        };
        break;

      case ElementType.EMOTE_WALL:
        newElement = {
          id: nanoid(),
          type: ElementType.EMOTE_WALL,
          name: "Emote Wall",
          x: baseX,
          y: baseY,
          width: 600,
          height: 400,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          density: 5,
          speed: 2,
          direction: "up",
          style: defaultEmoteWallStyle,
          previewEnabled: false,
        };
        break;

      case ElementType.WEBCAM:
        newElement = {
          id: nanoid(),
          type: ElementType.WEBCAM,
          name: "Webcam",
          x: baseX,
          y: baseY,
          width: 320,
          height: 240,
          rotation: 0,
          opacity: 1,
          zIndex: 2,
          locked: false,
          visible: true,
          parentId: null,
          borderColor: "#ffffff",
          borderWidth: 4,
          borderRadius: 12,
          shape: "rectangle",
          shadowColor: "rgba(0, 0, 0, 0.5)",
          shadowBlur: 20,
        };
        break;

      case ElementType.TIMER:
        newElement = {
          id: nanoid(),
          type: ElementType.TIMER,
          name: "Timer",
          x: baseX,
          y: baseY,
          width: 300,
          height: 80,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          targetDate: new Date(Date.now() + 3600000).toISOString(),
          mode: "countdown",
          fontFamily: "Inter",
          fontSize: 48,
          color: "#ffffff",
          style: defaultTimerStyle,
          isRunning: false,
          elapsedMs: 0,
        };
        break;

      case ElementType.PROGRESS:
        newElement = {
          id: nanoid(),
          type: ElementType.PROGRESS,
          name: "Progress Bar",
          x: baseX,
          y: baseY,
          width: 400,
          height: 40,
          rotation: 0,
          opacity: 1,
          zIndex: 1,
          locked: false,
          visible: true,
          parentId: null,
          progress: 50,
          barColor: "#3b82f6",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          height: 40,
          borderRadius: 8,
          showLabel: true,
          labelColor: "#ffffff",
          labelPosition: "inside",
          animated: true,
          stripes: false,
        };
        break;

      default:
        toast.error("Unknown element type");
        return;
    }

    try {
      // Save to backend first
      const createArgs = elementToOverlayCreate(newElement);
      const overlayId = await createOverlay(createArgs);

      // Update element ID with backend ID
      newElement.id = overlayId;

      // Add to local state
      updateElements((prev) => [...prev, newElement]);
      setSelectedIds([newElement.id]);
      setToolMode("select");
    } catch (error) {
      toast.error("Failed to create element");
      console.error(error);
    }
  };

  return addElement;
}
```

**Step 2: Test creating elements**

In the canvas editor:
1. Click toolbar to add different element types
2. Verify elements are created
3. Refresh page - elements should persist

**Step 3: Commit element creation**

```bash
git add apps/web/src/features/canvas/hooks/use-create-element.ts
git commit -m "feat: persist element creation to backend"
```

---

## Task 10: Update Canvas Element Deletion

**Files:**
- Modify: `apps/web/src/features/canvas/index.tsx`

**Step 1: Update handleDelete to remove from backend**

Find the `handleDelete` function in CanvasEditor and update it:

```typescript
import { useMutation } from "convex/react";

// Add near other mutations
const removeOverlay = useMutation(api.overlays.remove);

// Update handleDelete function
const handleDelete = async (id: string) => {
  try {
    // Remove from backend (cascades to children)
    await removeOverlay({ id: id as Id<"overlays"> });

    // Remove from local state
    const newElements = elements.filter(
      (el) => el.id !== id && el.parentId !== id
    );
    updateElements(newElements);
    setSelectedIds([]);
  } catch (error) {
    toast.error("Failed to delete element");
    console.error(error);
  }
};
```

**Step 2: Add import for Id type**

At the top of the file:

```typescript
import type { Id } from "@ovrly-revamp/backend/convex/_generated/dataModel";
```

**Step 3: Test element deletion**

1. Create an element
2. Select it and press Delete key
3. Verify it's deleted
4. Refresh page - element should stay deleted

**Step 4: Commit deletion**

```bash
git add apps/web/src/features/canvas/index.tsx
git commit -m "feat: persist element deletion to backend"
```

---

## Task 11: Remove projectId Props

**Files:**
- Modify: `apps/web/src/features/canvas/index.tsx`
- Modify: `apps/web/src/features/canvas/widgets/ElementRenderer.tsx`

**Step 1: Remove projectId from CanvasEditor**

Remove `projectId` and `projectName` props since there's no more projects:

```typescript
interface CanvasEditorProps {
  saveStatus?: React.ReactNode;
}

export function CanvasEditor({ saveStatus }: CanvasEditorProps) {
  // ... rest stays the same

  return (
    <div className="flex h-screen w-full select-none overflow-hidden bg-background font-sans text-foreground">
      <NavigationSidebar saveStatus={saveStatus} />

      <Toolbar onAddElement={addElement} />

      <LayersPanel onUpdate={handleUpdate} />

      <Canvas onUpdateElement={handleUpdate} />

      <PropertiesPanel
        onCopyLink={handleCopyLink}
        onDelete={handleDelete}
        onExport={handleExport}
        onPreview={handlePreview}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
```

**Step 2: Remove projectId from ElementRenderer**

Find all usages of `projectId` prop in ElementRenderer and remove them (they were used for preview URLs which are now handled differently).

**Step 3: Update NavigationSidebar**

Remove `projectName` prop:

```typescript
interface NavigationSidebarProps {
  saveStatus?: React.ReactNode;
}

export function NavigationSidebar({ saveStatus }: NavigationSidebarProps) {
  // ... implementation
}
```

**Step 4: Test canvas editor**

Verify canvas editor works without projectId prop.

**Step 5: Commit prop removal**

```bash
git add apps/web/src/features/canvas/
git commit -m "refactor: remove projectId and projectName props"
```

---

## Task 12: Update Router to Remove Project Routes

**Files:**
- Modify: `apps/web/src/router.tsx` (if needed)

**Step 1: Check if router needs updates**

View the router file and verify it's using auto-generated routes from TanStack Router.

**Step 2: Regenerate route tree**

```bash
cd apps/web
npm run dev
```

Expected: TanStack Router should auto-detect route file changes and regenerate route tree.

**Step 3: Verify routes work**

Navigate to:
- `http://localhost:3001/overlays` - should load canvas editor
- `http://localhost:3001/overlays/view` - should load full canvas view

Old routes should 404:
- `http://localhost:3001/overlays/{any-id}` - should 404

**Step 4: Commit if router was modified**

```bash
git add apps/web/src/router.tsx
git commit -m "chore: regenerate router for new overlay routes"
```

---

## Task 13: Update Navigation Links

**Files:**
- Modify: `apps/web/src/features/layout/components/navbar.tsx` (or wherever nav links are)

**Step 1: Find navigation component**

```bash
cd apps/web
find src -name "*nav*.tsx" -o -name "*sidebar*.tsx" | head -10
```

**Step 2: Update overlay link**

Find the link to overlays page and ensure it points to `/overlays` (not `/overlays/` with trailing slash):

```typescript
<Link to="/overlays">Overlays</Link>
```

**Step 3: Test navigation**

Click through app navigation and verify overlay link works.

**Step 4: Commit navigation updates**

```bash
git add apps/web/src/features/
git commit -m "fix: update overlay navigation link"
```

---

## Task 14: Test End-to-End Workflow

**Files:**
- N/A (testing only)

**Step 1: Test canvas editor workflow**

1. Navigate to `http://localhost:3001/overlays`
2. Add various element types (text, box, chat, etc.)
3. Move and resize elements
4. Verify auto-save indicator shows "Saving..." then "Saved"
5. Refresh page - all elements should persist
6. Delete an element
7. Refresh - element should stay deleted

**Step 2: Test OBS view URLs**

1. Create some visible elements in canvas
2. Navigate to `http://localhost:3001/overlays/view`
3. Verify all elements render correctly
4. Note an element ID from browser dev tools
5. Navigate to `http://localhost:3001/overlays/view/{elementId}`
6. Verify single element renders full-screen

**Step 3: Test element hierarchy**

1. Create a frame (OVERLAY type)
2. Create elements and drag them into the frame in the layers panel
3. Verify parent-child relationships work
4. Delete the frame - children should also delete

**Step 4: Document any issues**

Create GitHub issues for any bugs found during testing.

---

## Task 15: Clean Up and Final Commit

**Files:**
- Various

**Step 1: Run code formatter**

```bash
cd apps/web
npx ultracite fix
```

**Step 2: Check for unused imports**

```bash
npx ultracite check
```

Fix any issues reported.

**Step 3: Run TypeScript check**

```bash
npm run typecheck
```

Fix any type errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: format code and fix linting issues"
```

**Step 5: Push to remote**

```bash
git push origin main
```

---

## Summary

This plan refactors the application from a multi-project canvas system to a single canvas per user with hierarchical overlay elements. Key changes:

1. **Database**: Replaced `projects` table with hierarchical `overlays` table using `parentId`
2. **Backend**: Rewrote overlays API with CRUD operations for individual elements
3. **Routes**: Single canvas at `/overlays`, OBS views at `/overlays/view` and `/overlays/view/{id}`
4. **State**: Canvas loads all user overlays and reconstructs tree structure in memory
5. **Persistence**: Auto-save with debounce (1.5s), batch updates to backend

**Testing checklist:**
- ✅ Create elements of all types
- ✅ Move, resize, delete elements
- ✅ Elements persist across page refresh
- ✅ Full canvas view renders correctly
- ✅ Individual element view renders full-screen
- ✅ Parent-child relationships work
- ✅ Cascade delete works (deleting parent deletes children)
