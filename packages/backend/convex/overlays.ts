import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("overlays").collect(),
});

export const getById = query({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    return overlay;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    settings: v.any(),
    channel: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("emoji-wall"), v.literal("ad")),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);
    const overlayId = await ctx.db.insert("overlays", {
      userId: profile._id,
      name: args.name,
      settings: args.settings,
      channel: args.channel,
      type: args.type,
    });
    return await ctx.db.get(overlayId);
  },
});

export const update = mutation({
  args: {
    id: v.id("overlays"),
    name: v.optional(v.string()),
    settings: v.optional(v.any()),
    channel: v.optional(v.string()),
    type: v.optional(
      v.union(v.literal("chat"), v.literal("emoji-wall"), v.literal("ad"))
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    const profile = await getProfile(ctx);
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    if (overlay.userId !== profile._id) {
      throw new Error("Unauthorized: You can only update your own overlays");
    }
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    const profile = await getProfile(ctx);
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    if (overlay.userId !== profile._id) {
      throw new Error("Unauthorized: You can only delete your own overlays");
    }
    await ctx.db.delete(id);
    return { success: true };
  },
});
