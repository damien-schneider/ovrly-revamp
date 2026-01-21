import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { createAuth } from "./auth";

export const seedTestUser = internalMutation({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx as unknown as GenericCtx<DataModel>);
    const email = "test@mail.com";
    const password = "password";

    // Check if user already exists
    // We can't easily list users with the public API in a way that filters by email efficiently without an index on the auth tables which are internal to better-auth
    // But signUpEmail checks for existing user and returns error or handles it.
    // However, better-auth's signUpEmail might throw if user exists or return null.
    // Let's try to sign up and catch error if it says user exists.

    try {
      const user = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "Test User",
        },
      });
      console.log("Test user created:", user);
      return "Test user created";
    } catch (error) {
      // Better Auth throws if user exists usually, or we can check the error message
      const err = error as { message?: string; code?: string };
      if (
        err.message?.includes("already exists") ||
        err.code === "USER_ALREADY_EXISTS"
      ) {
        console.log("Test user already exists");
        return "Test user already exists";
      }
      // If it's another error, rethrow or log
      console.error("Failed to create test user:", error);
      throw error;
    }
  },
});
