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

  // Version history for AI modifications
  overlay_history: defineTable({
    userId: v.id("profiles"),
    overlayId: v.id("overlays"),
    snapshot: v.any(), // Complete overlay state before AI modification
    changeDescription: v.string(), // AI summary of changes
    prompt: v.string(), // Original user prompt
    modelUsed: v.string(), // e.g., "anthropic/claude-3.5-sonnet"
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_overlayId", ["overlayId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),

  // AI conversation threads
  ai_threads: defineTable({
    userId: v.id("profiles"),
    threadId: v.string(), // From @convex-dev/agent
    title: v.string(),
    lastMessageAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_threadId", ["threadId"]),

  // Usage tracking for rate limiting
  ai_usage: defineTable({
    userId: v.id("profiles"),
    operation: v.union(
      v.literal("design_generation"),
      v.literal("image_generation"),
      v.literal("overlay_modification")
    ),
    model: v.string(),
    tokensUsed: v.number(),
    cost: v.number(), // In cents
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_createdAt", ["userId", "createdAt"]),
});
