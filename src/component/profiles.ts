import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { browserUseRequest } from "./request.js";

// ------- Types for Browser Use API responses -------

interface ProfileResponse {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  cookieDomains: string[] | null;
}

interface ProfileListResponse {
  items: ProfileResponse[];
  totalItems: number;
}

// ------- Public actions -------

export const create = action({
  args: {
    apiKey: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.object({
    id: v.string(),
    name: v.optional(v.string()),
    createdAt: v.string(),
  }),
  handler: async (_ctx, args) => {
    const body: Record<string, unknown> = {};
    if (args.name) body.name = args.name;

    const response = await browserUseRequest<ProfileResponse>({
      method: "POST",
      path: "/api/v2/profiles",
      apiKey: args.apiKey,
      body,
    });

    return {
      id: response.id,
      name: response.name ?? undefined,
      createdAt: response.createdAt,
    };
  },
});

export const list = action({
  args: {
    apiKey: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.optional(v.string()),
      createdAt: v.string(),
      lastUsedAt: v.optional(v.string()),
      cookieDomains: v.array(v.string()),
    }),
  ),
  handler: async (_ctx, args) => {
    const response = await browserUseRequest<ProfileListResponse>({
      method: "GET",
      path: "/api/v2/profiles",
      apiKey: args.apiKey,
    });

    return response.items.map((p) => ({
      id: p.id,
      name: p.name ?? undefined,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt ?? undefined,
      cookieDomains: p.cookieDomains ?? [],
    }));
  },
});

export const getProfile = action({
  args: {
    apiKey: v.string(),
    profileId: v.string(),
  },
  returns: v.object({
    id: v.string(),
    name: v.optional(v.string()),
    createdAt: v.string(),
    lastUsedAt: v.optional(v.string()),
    cookieDomains: v.array(v.string()),
  }),
  handler: async (_ctx, args) => {
    const response = await browserUseRequest<ProfileResponse>({
      method: "GET",
      path: `/api/v2/profiles/${args.profileId}`,
      apiKey: args.apiKey,
    });

    return {
      id: response.id,
      name: response.name ?? undefined,
      createdAt: response.createdAt,
      lastUsedAt: response.lastUsedAt ?? undefined,
      cookieDomains: response.cookieDomains ?? [],
    };
  },
});

export const update = action({
  args: {
    apiKey: v.string(),
    profileId: v.string(),
    name: v.string(),
  },
  returns: v.object({
    id: v.string(),
    name: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const response = await browserUseRequest<ProfileResponse>({
      method: "PATCH",
      path: `/api/v2/profiles/${args.profileId}`,
      apiKey: args.apiKey,
      body: { name: args.name },
    });

    return {
      id: response.id,
      name: response.name ?? undefined,
    };
  },
});

export const deleteProfile = action({
  args: {
    apiKey: v.string(),
    profileId: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    await browserUseRequest({
      method: "DELETE",
      path: `/api/v2/profiles/${args.profileId}`,
      apiKey: args.apiKey,
    });
    return null;
  },
});
