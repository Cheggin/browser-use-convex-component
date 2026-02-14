import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server.js";
import { api, internal } from "./_generated/api.js";
import type { Id } from "./_generated/dataModel.js";
import { browserUseRequest } from "./request.js";
import { taskStatus } from "./schema.js";
import {
  DEFAULT_LLM,
  DEFAULT_MAX_STEPS,
  TASK_TERMINAL_STATUSES,
  POLL_INTERVAL_MS,
  MAX_POLL_ATTEMPTS,
} from "./constants.js";

// ------- Types for Browser Use API responses -------

interface CreateTaskResponse {
  id: string;
  sessionId: string;
}

interface TaskDetailResponse {
  id: string;
  status: string;
  output: string | null;
  isSuccess: boolean | null;
  sessionId: string | null;
  steps: TaskStepResponse[];
  finishedAt: string | null;
  liveUrl?: string | null;
  cost?: string;
}

interface TaskStepResponse {
  number: number;
  memory: string | null;
  evaluationPreviousGoal: string | null;
  nextGoal: string | null;
  url: string | null;
  screenshotUrl: string | null;
  actions: unknown[];
}

interface TaskStatusResponse {
  status: string;
  output: string | null;
  isSuccess: boolean | null;
}

// ------- Internal functions -------

export const saveTask = internalMutation({
  args: {
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
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tasks")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        output: args.output,
        isSuccess: args.isSuccess,
        liveUrl: args.liveUrl,
        error: args.error,
        finishedAt: args.finishedAt,
        structuredOutput: args.structuredOutput,
      });
      return existing._id;
    }

    return await ctx.db.insert("tasks", args);
  },
});

export const saveTaskSteps = internalMutation({
  args: {
    taskId: v.id("tasks"),
    externalTaskId: v.string(),
    steps: v.array(
      v.object({
        stepNumber: v.number(),
        goal: v.optional(v.string()),
        evaluation: v.optional(v.string()),
        memory: v.optional(v.string()),
        url: v.optional(v.string()),
        screenshotUrl: v.optional(v.string()),
        actions: v.optional(v.any()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const step of args.steps) {
      const existing = await ctx.db
        .query("taskSteps")
        .withIndex("byExternalTaskId", (q) =>
          q.eq("externalTaskId", args.externalTaskId),
        )
        .filter((q) => q.eq(q.field("stepNumber"), step.stepNumber))
        .first();

      if (!existing) {
        await ctx.db.insert("taskSteps", {
          taskId: args.taskId,
          externalTaskId: args.externalTaskId,
          ...step,
        });
      }
    }
    return null;
  },
});

export const getByExternalId = internalQuery({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .first();
  },
});

// ------- Public queries -------

export const get = query({
  args: { taskId: v.id("tasks") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const list = query({
  args: {
    sessionId: v.optional(v.string()),
    status: v.optional(taskStatus),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    let q;
    if (args.status) {
      q = ctx.db
        .query("tasks")
        .withIndex("byStatus", (idx) => idx.eq("status", args.status!));
    } else if (args.sessionId) {
      q = ctx.db
        .query("tasks")
        .withIndex("bySessionId", (idx) =>
          idx.eq("sessionId", args.sessionId!),
        );
    } else {
      q = ctx.db.query("tasks");
    }
    return await q.order("desc").take(args.limit ?? 50);
  },
});

export const getSteps = query({
  args: { taskId: v.id("tasks") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taskSteps")
      .withIndex("byTaskId", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// ------- Public actions -------

export const create = action({
  args: {
    apiKey: v.string(),
    task: v.string(),
    sessionId: v.optional(v.string()),
    startUrl: v.optional(v.string()),
    llm: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    flashMode: v.optional(v.boolean()),
    thinking: v.optional(v.boolean()),
    vision: v.optional(v.union(v.boolean(), v.literal("auto"))),
    highlightElements: v.optional(v.boolean()),
    systemPromptExtension: v.optional(v.string()),
    secrets: v.optional(v.any()),
    allowedDomains: v.optional(v.array(v.string())),
    structuredOutput: v.optional(v.any()),
    metadata: v.optional(v.any()),
    judge: v.optional(v.boolean()),
    judgeGroundTruth: v.optional(v.string()),
    judgeLlm: v.optional(v.string()),
    skillIds: v.optional(v.array(v.string())),
  },
  returns: v.object({
    taskId: v.id("tasks"),
    externalId: v.string(),
    sessionId: v.string(),
  }),
  handler: async (ctx, args): Promise<{
    taskId: Id<"tasks">;
    externalId: string;
    sessionId: string;
  }> => {
    const { apiKey, ...taskArgs } = args;

    const body: Record<string, unknown> = {
      task: taskArgs.task,
      llm: taskArgs.llm ?? DEFAULT_LLM,
    };

    if (taskArgs.sessionId) body.sessionId = taskArgs.sessionId;
    if (taskArgs.startUrl) body.startUrl = taskArgs.startUrl;
    if (taskArgs.maxSteps) body.maxSteps = taskArgs.maxSteps;
    if (taskArgs.flashMode !== undefined) body.flashMode = taskArgs.flashMode;
    if (taskArgs.thinking !== undefined) body.thinking = taskArgs.thinking;
    if (taskArgs.vision !== undefined) body.vision = taskArgs.vision;
    if (taskArgs.highlightElements !== undefined)
      body.highlightElements = taskArgs.highlightElements;
    if (taskArgs.systemPromptExtension)
      body.systemPromptExtension = taskArgs.systemPromptExtension;
    if (taskArgs.secrets) body.secrets = taskArgs.secrets;
    if (taskArgs.allowedDomains) body.allowedDomains = taskArgs.allowedDomains;
    if (taskArgs.structuredOutput)
      body.structuredOutput = taskArgs.structuredOutput;
    if (taskArgs.metadata) body.metadata = taskArgs.metadata;
    if (taskArgs.judge !== undefined) body.judge = taskArgs.judge;
    if (taskArgs.judgeGroundTruth)
      body.judgeGroundTruth = taskArgs.judgeGroundTruth;
    if (taskArgs.judgeLlm) body.judgeLlm = taskArgs.judgeLlm;
    if (taskArgs.skillIds) body.skillIds = taskArgs.skillIds;

    const response = await browserUseRequest<CreateTaskResponse>({
      method: "POST",
      path: "/api/v2/tasks",
      apiKey,
      body,
    });

    const taskId = await ctx.runMutation(internal.tasks.saveTask, {
      externalId: response.id,
      sessionId: response.sessionId,
      task: taskArgs.task,
      status: "created",
      startUrl: taskArgs.startUrl,
      llm: taskArgs.llm ?? DEFAULT_LLM,
      maxSteps: taskArgs.maxSteps ?? DEFAULT_MAX_STEPS,
      metadata: taskArgs.metadata,
    });

    return {
      taskId,
      externalId: response.id,
      sessionId: response.sessionId,
    };
  },
});

export const fetchStatus = action({
  args: {
    apiKey: v.string(),
    externalId: v.string(),
  },
  returns: v.object({
    status: v.string(),
    output: v.optional(v.string()),
    isSuccess: v.optional(v.boolean()),
  }),
  handler: async (ctx, args): Promise<{
    status: string;
    output?: string;
    isSuccess?: boolean;
  }> => {
    const response = await browserUseRequest<TaskStatusResponse>({
      method: "GET",
      path: `/api/v2/tasks/${args.externalId}/status`,
      apiKey: args.apiKey,
    });

    const normalizedStatus = normalizeStatus(response.status);

    const existingTask = (await ctx.runQuery(internal.tasks.getByExternalId, {
      externalId: args.externalId,
    })) as Record<string, unknown> | null;

    if (existingTask) {
      await ctx.runMutation(internal.tasks.saveTask, {
        externalId: args.externalId,
        task: (existingTask.task as string) ?? "",
        status: normalizedStatus,
        output: response.output ?? undefined,
        isSuccess: response.isSuccess ?? undefined,
      });
    }

    return {
      status: response.status,
      output: response.output ?? undefined,
      isSuccess: response.isSuccess ?? undefined,
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
    const response = await browserUseRequest<TaskDetailResponse>({
      method: "GET",
      path: `/api/v2/tasks/${args.externalId}`,
      apiKey: args.apiKey,
    });

    const normalizedStatus = normalizeStatus(response.status);

    const existingTask = (await ctx.runQuery(internal.tasks.getByExternalId, {
      externalId: args.externalId,
    })) as Record<string, unknown> | null;

    const taskId = await ctx.runMutation(internal.tasks.saveTask, {
      externalId: response.id,
      sessionId: response.sessionId ?? undefined,
      task: (existingTask?.task as string) ?? "",
      status: normalizedStatus,
      output: response.output ?? undefined,
      isSuccess: response.isSuccess ?? undefined,
      liveUrl: response.liveUrl ?? undefined,
      finishedAt: response.finishedAt
        ? new Date(response.finishedAt).getTime()
        : undefined,
    });

    if (response.steps && response.steps.length > 0) {
      await ctx.runMutation(internal.tasks.saveTaskSteps, {
        taskId,
        externalTaskId: response.id,
        steps: response.steps.map((s) => ({
          stepNumber: s.number,
          goal: s.nextGoal ?? undefined,
          evaluation: s.evaluationPreviousGoal ?? undefined,
          memory: s.memory ?? undefined,
          url: s.url ?? undefined,
          screenshotUrl: s.screenshotUrl ?? undefined,
          actions: s.actions ?? undefined,
        })),
      });
    }

    return {
      taskId,
      externalId: response.id,
      status: response.status,
      output: response.output,
      isSuccess: response.isSuccess,
      liveUrl: response.liveUrl,
      steps: response.steps,
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
      path: `/api/v2/tasks/${args.externalId}`,
      apiKey: args.apiKey,
      body: { action: "stop" },
    });

    const existingTask = (await ctx.runQuery(internal.tasks.getByExternalId, {
      externalId: args.externalId,
    })) as Record<string, unknown> | null;

    if (existingTask) {
      await ctx.runMutation(internal.tasks.saveTask, {
        externalId: args.externalId,
        task: (existingTask.task as string) ?? "",
        status: "stopped",
      });
    }

    return null;
  },
});

export const pollUntilDone = action({
  args: {
    apiKey: v.string(),
    externalId: v.string(),
  },
  returns: v.object({
    status: v.string(),
    output: v.optional(v.string()),
    isSuccess: v.optional(v.boolean()),
  }),
  handler: async (ctx, args): Promise<{
    status: string;
    output?: string;
    isSuccess?: boolean;
  }> => {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      const result = await browserUseRequest<TaskStatusResponse>({
        method: "GET",
        path: `/api/v2/tasks/${args.externalId}/status`,
        apiKey: args.apiKey,
      });

      const normalizedStatus = normalizeStatus(result.status);

      if (
        TASK_TERMINAL_STATUSES.includes(
          normalizedStatus as (typeof TASK_TERMINAL_STATUSES)[number],
        )
      ) {
        const existingTask = (await ctx.runQuery(
          internal.tasks.getByExternalId,
          { externalId: args.externalId },
        )) as Record<string, unknown> | null;

        if (existingTask) {
          await ctx.runMutation(internal.tasks.saveTask, {
            externalId: args.externalId,
            task: (existingTask.task as string) ?? "",
            status: normalizedStatus,
            output: result.output ?? undefined,
            isSuccess: result.isSuccess ?? undefined,
          });
        }

        return {
          status: result.status,
          output: result.output ?? undefined,
          isSuccess: result.isSuccess ?? undefined,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error(
      `Task ${args.externalId} did not complete within the maximum poll attempts`,
    );
  },
});

export const createAndPoll = action({
  args: {
    apiKey: v.string(),
    task: v.string(),
    sessionId: v.optional(v.string()),
    startUrl: v.optional(v.string()),
    llm: v.optional(v.string()),
    maxSteps: v.optional(v.number()),
    flashMode: v.optional(v.boolean()),
    thinking: v.optional(v.boolean()),
    vision: v.optional(v.union(v.boolean(), v.literal("auto"))),
    structuredOutput: v.optional(v.any()),
    metadata: v.optional(v.any()),
    secrets: v.optional(v.any()),
    allowedDomains: v.optional(v.array(v.string())),
    systemPromptExtension: v.optional(v.string()),
  },
  returns: v.object({
    taskId: v.id("tasks"),
    externalId: v.string(),
    status: v.string(),
    output: v.optional(v.string()),
    isSuccess: v.optional(v.boolean()),
  }),
  handler: async (ctx, args): Promise<{
    taskId: Id<"tasks">;
    externalId: string;
    status: string;
    output?: string;
    isSuccess?: boolean;
  }> => {
    const createResult = (await ctx.runAction(
      api.tasks.create,
      args,
    )) as { taskId: Id<"tasks">; externalId: string; sessionId: string };

    const pollResult = (await ctx.runAction(api.tasks.pollUntilDone, {
      apiKey: args.apiKey,
      externalId: createResult.externalId,
    })) as { status: string; output?: string; isSuccess?: boolean };

    return {
      taskId: createResult.taskId,
      externalId: createResult.externalId,
      ...pollResult,
    };
  },
});

// ------- Helpers -------

function normalizeStatus(
  status: string,
): "created" | "started" | "paused" | "finished" | "stopped" | "failed" {
  switch (status) {
    case "created":
    case "started":
    case "paused":
    case "finished":
    case "stopped":
    case "failed":
      return status;
    default:
      return "started";
  }
}
