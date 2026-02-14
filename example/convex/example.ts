import { BrowserUse } from "../../src/client/index.js";
import { components } from "./_generated/api.js";
import { action, query } from "./_generated/server.js";
import { v } from "convex/values";

const browserUse = new BrowserUse(components.browserUse);

// ------- Tasks -------

export const createTask = action({
  args: {
    task: v.string(),
    startUrl: v.optional(v.string()),
    llm: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.createTask(ctx, args);
  },
});

export const getTask = query({
  args: { taskId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.getTask(ctx, { taskId: args.taskId });
  },
});

export const listTasks = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.listTasks(ctx, args as never);
  },
});

export const getTaskSteps = query({
  args: { taskId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.getTaskSteps(ctx, { taskId: args.taskId });
  },
});

export const fetchTaskStatus = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.fetchTaskStatus(ctx, args);
  },
});

export const fetchTaskDetail = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.fetchTaskDetail(ctx, args);
  },
});

export const stopTask = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.stopTask(ctx, args);
  },
});

// ------- Sessions -------

export const createSession = action({
  args: {
    proxyCountryCode: v.optional(v.string()),
    startUrl: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.createSession(ctx, args);
  },
});

export const getSession = query({
  args: { sessionId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.getSession(ctx, { sessionId: args.sessionId });
  },
});

export const listSessions = query({
  args: {
    status: v.optional(
      v.union(v.literal("active"), v.literal("stopped")),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.listSessions(ctx, args);
  },
});

export const fetchSessionDetail = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.fetchSessionDetail(ctx, args);
  },
});

export const stopSession = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.stopSession(ctx, args);
  },
});

// ------- Profiles -------

export const createProfile = action({
  args: { name: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.createProfile(ctx, args);
  },
});

export const listProfiles = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.listProfiles(ctx);
  },
});

export const getProfile = action({
  args: { profileId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.getProfile(ctx, args);
  },
});

export const updateProfile = action({
  args: { profileId: v.string(), name: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.updateProfile(ctx, args);
  },
});

export const deleteProfile = action({
  args: { profileId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.deleteProfile(ctx, args);
  },
});
