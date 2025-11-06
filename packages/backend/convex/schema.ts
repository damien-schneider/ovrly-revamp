import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Note: userId and idUser fields reference better-auth user IDs (strings)
  // Better-auth manages its user table internally, so we use string IDs
  // Use authComponent.getAnyUserById() or authComponent.getAuthUser() to fetch users
  overlays: defineTable({
    userId: v.string(), // References better-auth user ID (tokenIdentifier)
    name: v.string(),
    settings: v.any(),
    channel: v.optional(v.string()),
    type: v.union(v.literal("chat"), v.literal("emoji-wall")),
  })
    .index("by_userId", ["userId"])
    .index("by_channel", ["channel"]),
  provider: defineTable({
    idUser: v.string(), // References better-auth user ID (tokenIdentifier)
    twitchToken: v.string(),
    twitchRefreshToken: v.string(),
  }).index("by_idUser", ["idUser"]),
});
