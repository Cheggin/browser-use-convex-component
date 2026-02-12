import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const taskStatus = v.union(
  v.literal("created"),
  v.literal("started"),
  v.literal("paused"),
  v.literal("finished"),
  v.literal("stopped"),
  v.literal("failed"),
);

export default defineSchema({
  tasks: defineTable({
    externalId: v.string(),
    sessionId: v.optional(v.string()),
    task: v.string(),
    status: taskStatus,
    output: v.optional(v.string()),
    isSuccess: v.optional(v.boolean()),
    startUrl: v.optional(v.string()),
    liveUrl: v.optional(v.string()),
    llm: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    metadata: v.optional(v.any()),
    structuredOutput: v.optional(v.any()),
    error: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
  })
    .index("byExternalId", ["externalId"])
    .index("bySessionId", ["sessionId"])
    .index("byStatus", ["status"]),

  sessions: defineTable({
    externalId: v.string(),
    status: v.union(v.literal("active"), v.literal("stopped")),
    liveUrl: v.optional(v.string()),
    profileId: v.optional(v.string()),
    proxyCountryCode: v.optional(v.string()),
    startUrl: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
  })
    .index("byExternalId", ["externalId"])
    .index("byStatus", ["status"]),

  taskSteps: defineTable({
    taskId: v.id("tasks"),
    externalTaskId: v.string(),
    stepNumber: v.number(),
    goal: v.optional(v.string()),
    evaluation: v.optional(v.string()),
    memory: v.optional(v.string()),
    url: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
    actions: v.optional(v.any()),
  })
    .index("byTaskId", ["taskId"])
    .index("byExternalTaskId", ["externalTaskId"]),
});
