import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

/**
 * List all commands for the authenticated user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);

    const commands = await ctx.db
      .query("commands")
      .withIndex("by_userId", (q) => q.eq("userId", profile._id))
      .order("desc")
      .collect();

    return commands;
  },
});

/**
 * Get a specific command by ID
 */
export const get = query({
  args: {
    id: v.id("commands"),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const command = await ctx.db.get(args.id);
    if (!command) {
      throw new Error("Command not found");
    }

    if (command.userId !== profile._id) {
      throw new Error("Unauthorized");
    }

    return command;
  },
});

const MIN_TRIGGER_LENGTH = 2;

function validateTrigger(trigger: string): string {
  const trimmed = trigger.trim();
  if (!trimmed.startsWith("!")) {
    throw new Error("Command trigger must start with '!'");
  }
  if (trimmed.includes(" ")) {
    throw new Error("Command trigger cannot contain spaces");
  }
  if (trimmed.length < MIN_TRIGGER_LENGTH) {
    throw new Error("Command trigger must be at least 2 characters");
  }
  return trimmed.toLowerCase();
}

function validateResponse(response: string): string {
  const trimmed = response.trim();
  if (!trimmed) {
    throw new Error("Command response cannot be empty");
  }
  return trimmed;
}

/**
 * Create a new command
 */
export const create = mutation({
  args: {
    trigger: v.string(),
    response: v.string(),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const trigger = validateTrigger(args.trigger);
    const response = validateResponse(args.response);

    // Check for duplicate trigger
    const existingCommand = await ctx.db
      .query("commands")
      .withIndex("by_userId_trigger", (q) =>
        q.eq("userId", profile._id).eq("trigger", trigger)
      )
      .first();

    if (existingCommand) {
      throw new Error("A command with this trigger already exists");
    }

    const now = Date.now();
    const commandId = await ctx.db.insert("commands", {
      userId: profile._id,
      trigger,
      response,
      enabled: args.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return commandId;
  },
});

/**
 * Update an existing command
 */
export const update = mutation({
  args: {
    id: v.id("commands"),
    trigger: v.optional(v.string()),
    response: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const command = await ctx.db.get(args.id);
    if (!command) {
      throw new Error("Command not found");
    }

    if (command.userId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const updates: {
      trigger?: string;
      response?: string;
      enabled?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.trigger !== undefined) {
      const trigger = validateTrigger(args.trigger);

      // Check for duplicate trigger (excluding current command)
      const existingCommand = await ctx.db
        .query("commands")
        .withIndex("by_userId_trigger", (q) =>
          q.eq("userId", profile._id).eq("trigger", trigger)
        )
        .first();

      if (existingCommand && existingCommand._id !== args.id) {
        throw new Error("A command with this trigger already exists");
      }

      updates.trigger = trigger;
    }

    if (args.response !== undefined) {
      updates.response = validateResponse(args.response);
    }

    if (args.enabled !== undefined) {
      updates.enabled = args.enabled;
    }

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Delete a command
 */
export const remove = mutation({
  args: {
    id: v.id("commands"),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const command = await ctx.db.get(args.id);
    if (!command) {
      throw new Error("Command not found");
    }

    if (command.userId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Toggle a command's enabled status
 */
export const toggle = mutation({
  args: {
    id: v.id("commands"),
  },
  handler: async (ctx, args) => {
    const profile = await getProfile(ctx);

    const command = await ctx.db.get(args.id);
    if (!command) {
      throw new Error("Command not found");
    }

    if (command.userId !== profile._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      enabled: !command.enabled,
      updatedAt: Date.now(),
    });
  },
});
