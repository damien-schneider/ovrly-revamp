import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    authId: v.string(), // Better Auth user ID (from authUser._id) - used to look up profile from tokenIdentifier
    email: v.union(v.string(), v.null()),
    name: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
    emailVerified: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),
  overlays: defineTable({
    userId: v.id("profiles"), // Foreign key to profiles table
    name: v.string(),
    settings: v.any(),
    channel: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("emoji-wall"), v.literal("ad")),
  })
    .index("by_userId", ["userId"])
    .index("by_channel", ["channel"]),
  // Canvas editor projects - stores Figma-like canvas elements
  projects: defineTable({
    userId: v.id("profiles"),
    name: v.string(),
    elements: v.any(), // Array of OverlayElement objects
    channel: v.optional(v.string()), // Twitch channel associated with this project
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
  commands: defineTable({
    userId: v.id("profiles"), // Owner of the command
    trigger: v.string(), // Command trigger (e.g., "!projects")
    response: v.string(), // Command response message
    enabled: v.boolean(), // Whether command is active
    cooldown: v.optional(v.number()), // Cooldown in seconds (future feature)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_trigger", ["userId", "trigger"]),
});
