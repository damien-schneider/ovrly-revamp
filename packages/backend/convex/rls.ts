import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  type RLSConfig,
  type Rules,
  wrapDatabaseReader,
  wrapDatabaseWriter,
} from "convex-helpers/server/rowLevelSecurity";
import type { DataModel } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

async function rlsRules(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  const userId = identity?.tokenIdentifier ?? null;

  return {
    overlays: {
      read: async () => await Promise.resolve(true),
      insert: async (_ctx, overlay) => {
        if (!userId) {
          return await Promise.resolve(false);
        }
        return await Promise.resolve(overlay.userId === userId);
      },
      modify: async (_ctx, overlay) => {
        if (!userId) {
          return await Promise.resolve(false);
        }
        return await Promise.resolve(overlay.userId === userId);
      },
    },
    provider: {
      read: async (_ctx, provider) => {
        if (!userId) {
          return await Promise.resolve(false);
        }
        return await Promise.resolve(provider.idUser === userId);
      },
      insert: async (_ctx, provider) => {
        if (!userId) {
          return await Promise.resolve(false);
        }
        return await Promise.resolve(provider.idUser === userId);
      },
      modify: async (_ctx, provider) => {
        if (!userId) {
          return await Promise.resolve(false);
        }
        return await Promise.resolve(provider.idUser === userId);
      },
    },
  } satisfies Rules<QueryCtx, DataModel>;
}

const config: RLSConfig = { defaultPolicy: "deny" };

export const queryWithRLS = customQuery(
  query,
  customCtx(async (ctx) => ({
    db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx), config),
  }))
);

export const mutationWithRLS = customMutation(
  mutation,
  customCtx(async (ctx) => ({
    db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx), config),
  }))
);
