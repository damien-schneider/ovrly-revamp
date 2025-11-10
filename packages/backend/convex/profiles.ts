import { v } from "convex/values";
import { query } from "./_generated/server";
import { safeGetProfile } from "./auth";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      email: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    // Get the provider user info from Better Auth

    // Query from the profiles table which is synced from Better Auth via triggers
    // Note: This allows any authenticated user to see all users.
    // Consider restricting this to admins only for production use.
    const profiles = await ctx.db.query("profiles").collect();

    return profiles.map((profile) => ({
      id: profile.authId,
      email: profile.email ?? null,
      name: profile.name ?? null,
    }));
  },
});

export const getCurrentProfile = query({
  args: {},
  returns: v.union(v.any(), v.null()),
  handler: async (ctx) => {
    const profile = await safeGetProfile(ctx);
    if (!profile) {
      return null;
    }
    return {
      id: profile.authId,
      email: profile.email ?? null,
      name: profile.name ?? null,
    };
  },
});
