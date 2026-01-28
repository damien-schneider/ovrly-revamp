import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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
    const user = await getProfile(ctx);
    const overlay = await ctx.db.get(id);

    if (!overlay) {
      return null;
    }

    if (overlay.userId !== user._id) {
      return null;
    }

    return overlay;
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
 * Delete an overlay element (cascades recursively to all descendants)
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

    // Recursive function to delete an overlay and all its descendants
    const deleteRecursively = async (overlayId: Id<"overlays">) => {
      // Find all children
      const children = await ctx.db
        .query("overlays")
        .withIndex("by_userId_parentId", (q) =>
          q.eq("userId", user._id).eq("parentId", overlayId)
        )
        .collect();

      // Recursively delete each child and its descendants
      for (const child of children) {
        await deleteRecursively(child._id);
      }

      // Delete the overlay itself after all descendants are deleted
      await ctx.db.delete(overlayId);
    };

    await deleteRecursively(id);
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
 *
 * SECURITY NOTE: Convex storage URLs are publicly accessible once generated.
 * There is no built-in authorization layer for storage access. If you need
 * private files, you must implement additional access controls or use a
 * different storage solution. Currently, any user who knows a storageId
 * can access the file.
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await getProfile(ctx);
    return await ctx.storage.getUrl(storageId);
  },
});
