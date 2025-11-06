import { v } from "convex/values";
import { mutationWithRLS, queryWithRLS } from "./rls";

export const get = queryWithRLS({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const provider = await ctx.db
      .query("provider")
      .withIndex("by_idUser", (q) => q.eq("idUser", identity.tokenIdentifier))
      .first();
    // RLS read rule automatically filters results
    return provider ?? null;
  },
});

export const upsert = mutationWithRLS({
  args: {
    twitchToken: v.string(),
    twitchRefreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("provider")
      .withIndex("by_idUser", (q) => q.eq("idUser", userId))
      .first();

    if (existing) {
      // RLS modify rule automatically checks authorization
      await ctx.db.patch(existing._id, {
        twitchToken: args.twitchToken,
        twitchRefreshToken: args.twitchRefreshToken,
      });
      return await ctx.db.get(existing._id);
    }

    // RLS insert rule automatically checks authorization
    const providerId = await ctx.db.insert("provider", {
      idUser: userId,
      twitchToken: args.twitchToken,
      twitchRefreshToken: args.twitchRefreshToken,
    });
    return await ctx.db.get(providerId);
  },
});

export const remove = mutationWithRLS({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const provider = await ctx.db
      .query("provider")
      .withIndex("by_idUser", (q) => q.eq("idUser", identity.tokenIdentifier))
      .first();
    if (!provider) {
      throw new Error("Provider not found");
    }
    // RLS modify rule automatically checks authorization
    await ctx.db.delete(provider._id);
    return { success: true };
  },
});

// Note: Token syncing from better-auth should be handled on the frontend
// after Twitch OAuth completes. The frontend can call the upsert mutation
// directly with tokens obtained from better-auth's session/API.
