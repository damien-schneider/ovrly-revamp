import { v } from "convex/values";
import { mutationWithRLS, queryWithRLS } from "./rls";

export const list = queryWithRLS({
  args: {},
  handler: async (ctx) => await ctx.db.query("overlays").collect(),
});

export const getById = queryWithRLS({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    return overlay;
  },
});

export const create = mutationWithRLS({
  args: {
    name: v.string(),
    settings: v.any(),
    channel: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("emoji-wall")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const overlayId = await ctx.db.insert("overlays", {
      userId: identity.tokenIdentifier,
      name: args.name,
      settings: args.settings,
      channel: args.channel,
      type: args.type,
    });
    return await ctx.db.get(overlayId);
  },
});

export const update = mutationWithRLS({
  args: {
    id: v.id("overlays"),
    name: v.optional(v.string()),
    settings: v.optional(v.any()),
    channel: v.optional(v.string()),
    type: v.optional(v.union(v.literal("chat"), v.literal("emoji-wall"))),
  },
  handler: async (ctx, { id, ...updates }) => {
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    // RLS modify rule automatically checks authorization
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const remove = mutationWithRLS({
  args: { id: v.id("overlays") },
  handler: async (ctx, { id }) => {
    const overlay = await ctx.db.get(id);
    if (!overlay) {
      throw new Error("Overlay not found");
    }
    // RLS modify rule automatically checks authorization
    await ctx.db.delete(id);
    return { success: true };
  },
});
