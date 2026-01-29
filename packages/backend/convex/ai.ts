import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

// Note: AI agent functionality is temporarily simplified
// Full agent integration will be added in the next phase

// ============================================================================
// Thread Management
// ============================================================================

export const createThread = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const threadId = crypto.randomUUID();

    await ctx.db.insert("ai_threads", {
      userId: profile._id,
      threadId,
      title: args.title,
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return threadId;
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);

    const threads = await ctx.db
      .query("ai_threads")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .order("desc")
      .collect();

    return threads;
  },
});

// ============================================================================
// Usage Tracking
// ============================================================================

export const checkRateLimit = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    const dayStart = Date.now() - (Date.now() % 86_400_000);

    const todayUsage = await ctx.db
      .query("ai_usage")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", profile._id).gte("createdAt", dayStart)
      )
      .collect();

    const FREE_TIER_LIMITS = {
      requestsPerDay: 50,
      tokensPerDay: 5000,
    };

    const requestsToday = todayUsage.filter((u) => u.success).length;
    const tokensToday = todayUsage.reduce((sum, u) => sum + u.tokensUsed, 0);

    const allowed =
      requestsToday < FREE_TIER_LIMITS.requestsPerDay &&
      tokensToday < FREE_TIER_LIMITS.tokensPerDay;

    return {
      allowed,
      requestsRemaining: FREE_TIER_LIMITS.requestsPerDay - requestsToday,
      tokensRemaining: FREE_TIER_LIMITS.tokensPerDay - tokensToday,
      resetIn: 86_400 - Math.floor((Date.now() % 86_400_000) / 1000),
    };
  },
});

// ============================================================================
// History Management
// ============================================================================

export const listHistory = query({
  args: {
    overlayId: v.optional(v.id("overlays")),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const historyQuery = ctx.db
      .query("overlay_history")
      .withIndex("by_userId_createdAt", (q) => q.eq("userId", profile._id))
      .order("desc");

    const history = await historyQuery.collect();

    if (args.overlayId) {
      return history.filter((h) => h.overlayId === args.overlayId);
    }

    return history;
  },
});

export const revertToSnapshot = mutation({
  args: {
    historyId: v.id("overlay_history"),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const historyEntry = await ctx.db.get(args.historyId);
    if (!historyEntry) {
      throw new Error("History entry not found");
    }

    if (historyEntry.userId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const snapshot = historyEntry.snapshot;

    // Restore the overlay
    await ctx.db.patch(historyEntry.overlayId, {
      ...snapshot,
      updatedAt: Date.now(),
    });

    return historyEntry.overlayId;
  },
});
