import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getProfile } from "./auth";

/**
 * List all projects for the current user
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getProfile(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/**
 * Get a single project by ID
 */
export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    name: v.string(),
    elements: v.optional(v.any()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, { name, elements, channel }) => {
    const user = await getProfile(ctx);
    const now = Date.now();

    return await ctx.db.insert("projects", {
      userId: user._id,
      name,
      elements: elements ?? [],
      channel,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing project
 */
export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    elements: v.optional(v.any()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, elements, channel }) => {
    const user = await getProfile(ctx);
    const project = await ctx.db.get(id);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (elements !== undefined) {
      updates.elements = elements;
    }

    if (channel !== undefined) {
      updates.channel = channel;
    }

    await ctx.db.patch(id, updates);
    return id;
  },
});

/**
 * Delete a project
 */
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    const user = await getProfile(ctx);
    const project = await ctx.db.get(id);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(id);
  },
});

/**
 * Generate an upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getProfile(ctx); // Ensure user is authenticated
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a URL for a stored file
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
