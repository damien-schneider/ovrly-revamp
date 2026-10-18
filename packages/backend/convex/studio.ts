import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

/**
 * Get studio settings for the current user
 */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getProfile(ctx);
    return await ctx.db
      .query("studio_settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

/**
 * Create or update studio settings
 */
export const upsertSettings = mutation({
  args: {
    streamKey: v.optional(v.string()),
    resolution: v.optional(v.union(v.literal("1080p"), v.literal("720p"))),
    framerate: v.optional(v.union(v.literal(30), v.literal(60))),
    bitrate: v.optional(v.number()),
    lastScene: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getProfile(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("studio_settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (args.streamKey !== undefined) {
        updates.streamKey = args.streamKey;
      }
      if (args.resolution !== undefined) {
        updates.resolution = args.resolution;
      }
      if (args.framerate !== undefined) {
        updates.framerate = args.framerate;
      }
      if (args.bitrate !== undefined) {
        updates.bitrate = args.bitrate;
      }
      if (args.lastScene !== undefined) {
        updates.lastScene = args.lastScene;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("studio_settings", {
      userId: user._id,
      streamKey: args.streamKey ?? "",
      resolution: args.resolution ?? "1080p",
      framerate: args.framerate ?? 30,
      bitrate: args.bitrate ?? 4500,
      lastScene: args.lastScene ?? "camera-full",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete studio settings (cleanup)
 */
export const deleteSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getProfile(ctx);
    const existing = await ctx.db
      .query("studio_settings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
