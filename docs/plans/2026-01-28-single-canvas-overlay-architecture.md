# Single Canvas Overlay Architecture

**Date:** 2026-01-28
**Status:** Approved

## Overview

Refactor from multi-project canvas system to a single canvas per user with hierarchical overlay elements. Overlays are stored as individual database rows with parent-child relationships, similar to Figma's component structure.

## Current vs New Architecture

### Current (Remove)
- Multiple projects per user
- Projects contain array of elements
- `/overlays` → project list
- `/overlays/{projectId}` → canvas editor
- `/overlays/{projectId}/view` → OBS view

### New (Implement)
- Single canvas per user
- Overlays stored as individual rows with `parentId` for hierarchy
- `/overlays` → canvas editor (loads all user overlays)
- `/overlays/view` → full canvas view
- `/overlays/view/{elementId}` → individual element full-screen

## Database Schema

### Remove
- Old `overlays` table (chat/emoji-wall types)
- `projects` table

### Create New `overlays` Table
```typescript
overlays: defineTable({
  userId: v.id("profiles"),
  type: v.union(
    v.literal("OVERLAY"),    // Frame/container
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
.index("by_userId_parentId", ["userId", "parentId"])
```

**Properties field contains type-specific data:**
- `TEXT`: `{ content, fontFamily, fontSize, color, ... }`
- `CHAT`: `{ style: ChatStyle, mockMessages, previewEnabled }`
- `OVERLAY`: `{ backgroundColor }`
- etc.

## Backend API (Convex)

### New `overlays.ts`
- `list(userId)` - Get all overlays for user
- `getById(id)` - Get single overlay
- `getChildren(parentId)` - Get child overlays
- `create({ type, name, parentId, ...props })` - Create overlay
- `update({ id, ...updates })` - Update overlay
- `remove(id)` - Delete overlay (cascade delete children)
- `generateUploadUrl()` - For image uploads
- `getFileUrl(storageId)` - Get uploaded file URL

### Remove
- `projects.ts` - entire file
- Old `overlays.ts` implementation

## Frontend Routes

### Update/Create
- `/overlays` - Canvas editor (was project list)
- `/overlays/view` - Full canvas OBS view
- `/overlays/view/{elementId}` - Individual element full-screen

### Remove
- `/(with_navbar)/overlays.tsx` - auth wrapper
- `/overlays.tsx` - layout wrapper
- `/overlays.index.tsx` - project list
- `/overlays.$projectId.tsx` - project editor
- `/overlays.$projectId.view.tsx` - project view

Keep only:
- `/overlays.tsx` - Canvas editor (refactored)
- `/overlays.view.tsx` - Full canvas view (new)
- `/overlays.view.$elementId.tsx` - Element view (new)

## Canvas Editor Changes

### Data Loading
- Load all user's overlays: `api.overlays.list()`
- Build element tree in memory from flat list
- No more project concept

### Saving
- Keep debounce approach (1.5s)
- Batch update changed elements
- Or update individual elements as they change

### State Management
- `elementsAtom` stays the same structure
- Load from overlays table instead of project.elements
- Save back to overlays table with individual rows

## OBS Browser Source URLs

1. **Full Canvas**: `http://localhost:3001/overlays/view`
   - Renders all visible overlays in their positions
   - User's entire canvas

2. **Individual Element**: `http://localhost:3001/overlays/view/{elementId}`
   - Renders single element full-screen
   - Useful for positioning sources independently in OBS
   - Works for both sources (CHAT, WEBCAM) and frames (OVERLAY with children)

## Implementation Strategy

1. **Schema & Backend** (foundation)
   - Update schema.ts
   - Rewrite overlays.ts API
   - Remove projects.ts

2. **Routes Cleanup** (remove old)
   - Delete project-related route files
   - Remove unused components

3. **Canvas Editor** (refactor)
   - Update data loading
   - Update save logic
   - Remove project references

4. **OBS View Routes** (new)
   - Implement full canvas view
   - Implement element view with full-screen rendering

5. **Testing**
   - Create overlays
   - Test hierarchy (frames with children)
   - Test OBS URLs
   - Verify save/load

## Migration Notes

No migration needed - no existing users. Fresh start with new schema.
