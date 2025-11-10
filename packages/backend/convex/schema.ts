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
  }).index("by_authId", ["authId"]),
  overlays: defineTable({
    userId: v.id("profiles"), // Foreign key to profiles table
    name: v.string(),
    settings: v.any(),
    channel: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("emoji-wall")),
  })
    .index("by_userId", ["userId"])
    .index("by_channel", ["channel"]),
});
