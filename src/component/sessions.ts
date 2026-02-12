import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import type { Id } from "./_generated/dataModel.js";
import { browserUseRequest } from "./request.js";

// ------- Types for Browser Use API responses -------

interface CreateSessionResponse {
  id: string;
  status: string;
  liveUrl: string | null;
}

interface SessionDetailResponse {
  id: string;
  status: string;
  liveUrl: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

// ------- Internal functions -------

export const saveSession = internalMutation({
  args: {
    externalId: v.string(),
    status: v.union(v.literal("active"), v.literal("stopped")),
    liveUrl: v.optional(v.string()),
    profileId: v.optional(v.string()),
    proxyCountryCode: v.optional(v.string()),
    startUrl: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        liveUrl: args.liveUrl,
        finishedAt: args.finishedAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("sessions", args);
  },
});

export const getByExternalId = internalQuery({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

// ------- Public queries -------

export const get = query({
  args: { sessionId: v.id("sessions") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("stopped"))),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let q;
    if (args.status) {
      q = ctx.db
        .query("sessions")
        .withIndex("byStatus", (idx) => idx.eq("status", args.status!));
    } else {
      q = ctx.db.query("sessions");
    }
    return await q.order("desc").take(args.limit ?? 50);
  },
});

// ------- Public actions -------

export const create = action({
  args: {
    apiKey: v.string(),
    profileId: v.optional(v.string()),
    proxyCountryCode: v.optional(v.string()),
    startUrl: v.optional(v.string()),
    browserScreenWidth: v.optional(v.number()),
    browserScreenHeight: v.optional(v.number()),
  },
  returns: v.object({
    sessionId: v.id("sessions"),
    externalId: v.string(),
    liveUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    sessionId: Id<"sessions">;
    externalId: string;
    liveUrl?: string;
  }> => {
    const { apiKey, ...sessionArgs } = args;

    const body: Record<string, unknown> = {};
    if (sessionArgs.profileId) body.profile_id = sessionArgs.profileId;
    if (sessionArgs.proxyCountryCode)
      body.proxy_country_code = sessionArgs.proxyCountryCode;
    if (sessionArgs.startUrl) body.start_url = sessionArgs.startUrl;
    if (sessionArgs.browserScreenWidth)
      body.browser_screen_width = sessionArgs.browserScreenWidth;
    if (sessionArgs.browserScreenHeight)
      body.browser_screen_height = sessionArgs.browserScreenHeight;

    const response = await browserUseRequest<CreateSessionResponse>({
      method: "POST",
      path: "/api/v2/sessions",
      apiKey,
      body,
    });

    const sessionId = await ctx.runMutation(internal.sessions.saveSession, {
      externalId: response.id,
      status: "active",
      liveUrl: response.liveUrl ?? undefined,
      profileId: sessionArgs.profileId,
      proxyCountryCode: sessionArgs.proxyCountryCode,
      startUrl: sessionArgs.startUrl,
    });

    return {
      sessionId,
      externalId: response.id,
      liveUrl: response.liveUrl ?? undefined,
    };
  },
});

export const fetchDetail = action({
  args: {
    apiKey: v.string(),
    externalId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<unknown> => {
    const response = await browserUseRequest<SessionDetailResponse>({
      method: "GET",
      path: `/api/v2/sessions/${args.externalId}`,
      apiKey: args.apiKey,
    });

    const sessionId = await ctx.runMutation(internal.sessions.saveSession, {
      externalId: response.id,
      status: response.status === "active" ? "active" : "stopped",
      liveUrl: response.liveUrl ?? undefined,
      finishedAt: response.finishedAt
        ? new Date(response.finishedAt).getTime()
        : undefined,
    });

    return {
      sessionId,
      ...response,
    };
  },
});

export const stop = action({
  args: {
    apiKey: v.string(),
    externalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await browserUseRequest({
      method: "PATCH",
      path: `/api/v2/sessions/${args.externalId}`,
      apiKey: args.apiKey,
      body: { status: "stopped" },
    });

    const existing = (await ctx.runQuery(internal.sessions.getByExternalId, {
      externalId: args.externalId,
    })) as Record<string, unknown> | null;

    if (existing) {
      await ctx.runMutation(internal.sessions.saveSession, {
        externalId: args.externalId,
        status: "stopped",
      });
    }

    return null;
  },
});
