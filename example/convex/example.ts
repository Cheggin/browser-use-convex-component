import { BrowserUse } from "../../src/client/index.js";
import { components } from "./_generated/api.js";
import { action, query } from "./_generated/server.js";
import { v } from "convex/values";

const browserUse = new BrowserUse(components.browserUse);

export const runTask = action({
  args: {
    task: v.string(),
    startUrl: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result = await browserUse.createTaskAndPoll(ctx, {
      task: args.task,
      startUrl: args.startUrl,
    });
    return result;
  },
});

export const createTask = action({
  args: {
    task: v.string(),
    startUrl: v.optional(v.string()),
    llm: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.createTask(ctx, args);
  },
});

export const checkTask = action({
  args: {
    externalId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.fetchTaskStatus(ctx, args);
  },
});

export const listTasks = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.listTasks(ctx);
  },
});

export const createSession = action({
  args: {
    proxyCountryCode: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.createSession(ctx, args);
  },
});

export const listProfiles = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.listProfiles(ctx);
  },
});
