import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { type QueryCtx, query } from "./_generated/server";

const siteUrl = process.env.SITE_URL || "";
// For local dev: SITE_URL is the Convex HTTP endpoint (e.g., http://127.0.0.1:3211)
// WEB_APP_ORIGIN is where the frontend runs (e.g., http://localhost:3001)
const webAppOrigin = process.env.WEB_APP_ORIGIN || "http://localhost:3001";
// Detect if we're running over HTTPS (production) or HTTP (local dev)
const isProduction = siteUrl.startsWith("https://");

const authFunctions: AuthFunctions = (internal as any).auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  verbose: true,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        // Sync new user to profiles table
        await ctx.db.insert("profiles", {
          authId: authUser._id,
          email: authUser.email ?? null,
          name: authUser.name ?? null,
          image: authUser.image ?? null,
          emailVerified: authUser.emailVerified ?? false,
          createdAt: authUser.createdAt,
          updatedAt: authUser.updatedAt,
        });
      },
      onUpdate: async (ctx, newAuthUser, _oldAuthUser) => {
        // Update profile when Better Auth user is updated
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("by_authId", (q) => q.eq("authId", newAuthUser._id))
          .unique();

        if (existingProfile) {
          await ctx.db.patch(existingProfile._id, {
            email: newAuthUser.email ?? null,
            name: newAuthUser.name ?? null,
            image: newAuthUser.image ?? null,
            emailVerified: newAuthUser.emailVerified ?? false,
            updatedAt: newAuthUser.updatedAt,
          });
        } else {
          // Profile doesn't exist, create it (handles edge case)
          await ctx.db.insert("profiles", {
            authId: newAuthUser._id,
            email: newAuthUser.email ?? null,
            name: newAuthUser.name ?? null,
            image: newAuthUser.image ?? null,
            emailVerified: newAuthUser.emailVerified ?? false,
            createdAt: newAuthUser.createdAt,
            updatedAt: newAuthUser.updatedAt,
          });
        }
      },
      onDelete: async (ctx, authUser) => {
        // Delete profile and related data when Better Auth user is deleted
        const existingProfile = await ctx.db
          .query("profiles")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();

        if (!existingProfile) {
          return;
        }

        // Delete related overlays
        const overlays = await ctx.db
          .query("overlays")
          .withIndex("by_userId", (q) => q.eq("userId", existingProfile._id))
          .collect();

        for (const overlay of overlays) {
          await ctx.db.delete(overlay._id);
        }

        // Delete profile
        await ctx.db.delete(existingProfile._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) =>
  betterAuth({
    baseURL: siteUrl,
    logger: {
      disabled: optionsOnly,
    },
    trustedOrigins: [
      siteUrl,
      webAppOrigin,
      // Include development origins for local testing (only when not in production)
      ...(isProduction
        ? []
        : ["http://localhost:3001", "http://127.0.0.1:3001"]),
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID as string,
        clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
        redirectURI: `${siteUrl}/api/auth/callback/twitch`,
        scope: ["chat:read", "chat:edit", "user:read:email", "user:read:chat"],
      },
    },
    advanced: {
      // Production (HTTPS): use secure cookies with sameSite: "none" for cross-origin
      // Local dev (HTTP): use lax cookies since secure: true requires HTTPS
      defaultCookieAttributes: {
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        httpOnly: true,
        path: "/",
      },
    },
    // crossDomain plugin is REQUIRED for SPAs where frontend and backend are on different origins
    plugins: [crossDomain({ siteUrl }), convex()],
  });

// Helper to get current auth user - reusable across queries
export const getAuthUser = async (ctx: GenericCtx<DataModel>) =>
  await authComponent.getAuthUser(ctx);

// Helper to get current profile (needed for foreign keys to profiles table)
export const safeGetProfile = async (ctx: QueryCtx) => {
  const authUser = await authComponent.safeGetAuthUser(
    ctx as unknown as GenericCtx<DataModel>
  );
  if (!authUser) {
    return null;
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
    .unique();

  return profile;
};

export const getProfile = async (ctx: QueryCtx) => {
  const profile = await safeGetProfile(ctx);
  if (!profile) {
    throw new Error("User not authenticated or profile not found");
  }
  return profile;
};

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => getAuthUser(ctx as unknown as GenericCtx<DataModel>),
});

export const getCurrentProvider = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    // Use safeGetAuthUser to handle unauthenticated users gracefully
    const authUser = await authComponent.safeGetAuthUser(
      ctx as unknown as GenericCtx<DataModel>
    );
    if (!authUser) {
      return null;
    }

    // Query the account table from Better Auth component to get the provider
    const account = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "account",
      where: [
        {
          field: "userId",
          operator: "eq",
          value: authUser._id,
        },
      ],
    });

    if (!account) {
      return null;
    }

    return account.providerId;
  },
});
