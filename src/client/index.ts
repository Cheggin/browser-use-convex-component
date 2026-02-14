import type {
  GenericActionCtx,
  GenericDataModel,
  GenericQueryCtx,
} from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type ActionCtx = Pick<
  GenericActionCtx<GenericDataModel>,
  "runQuery" | "runMutation" | "runAction"
>;

export interface BrowserUseOptions {
  BROWSER_USE_API_KEY?: string;
}

export class BrowserUse {
  public component: ComponentApi;
  private _apiKey: string | undefined;

  constructor(component: ComponentApi, options?: BrowserUseOptions) {
    this.component = component;
    this._apiKey = options?.BROWSER_USE_API_KEY;
  }

  private get apiKey(): string {
    const key = this._apiKey ?? process.env.BROWSER_USE_API_KEY;
    if (!key) {
      throw new Error(
        "Browser Use API key is required. Pass it as BROWSER_USE_API_KEY option or set the BROWSER_USE_API_KEY environment variable.",
      );
    }
    return key;
  }

  // ------- Tasks -------

  async createTask(
    ctx: ActionCtx,
    args: {
      task: string;
      sessionId?: string;
      startUrl?: string;
      llm?: string;
      maxSteps?: number;
      flashMode?: boolean;
      thinking?: boolean;
      vision?: boolean | "auto";
      highlightElements?: boolean;
      systemPromptExtension?: string;
      secrets?: Record<string, string>;
      allowedDomains?: string[];
      structuredOutput?: unknown;
      metadata?: Record<string, string>;
      judge?: boolean;
      judgeGroundTruth?: string;
      judgeLlm?: string;
      skillIds?: string[];
    },
  ) {
    return await ctx.runAction(this.component.tasks.create, {
      apiKey: this.apiKey,
      ...args,
    });
  }

  async getTask(ctx: QueryCtx, args: { taskId: string }) {
    return await ctx.runQuery(this.component.tasks.get, {
      taskId: args.taskId as never,
    });
  }

  async listTasks(
    ctx: QueryCtx,
    args?: {
      sessionId?: string;
      status?:
        | "created"
        | "started"
        | "paused"
        | "finished"
        | "stopped"
        | "failed";
      limit?: number;
    },
  ) {
    return await ctx.runQuery(this.component.tasks.list, args ?? {});
  }

  async getTaskSteps(ctx: QueryCtx, args: { taskId: string }) {
    return await ctx.runQuery(this.component.tasks.getSteps, {
      taskId: args.taskId as never,
    });
  }

  async fetchTaskStatus(ctx: ActionCtx, args: { externalId: string }) {
    return await ctx.runAction(this.component.tasks.fetchStatus, {
      apiKey: this.apiKey,
      externalId: args.externalId,
    });
  }

  async fetchTaskDetail(ctx: ActionCtx, args: { externalId: string }) {
    return await ctx.runAction(this.component.tasks.fetchDetail, {
      apiKey: this.apiKey,
      externalId: args.externalId,
    });
  }

  async stopTask(ctx: ActionCtx, args: { externalId: string }) {
    return await ctx.runAction(this.component.tasks.stop, {
      apiKey: this.apiKey,
      externalId: args.externalId,
    });
  }

  // ------- Sessions -------

  async createSession(
    ctx: ActionCtx,
    args?: {
      profileId?: string;
      proxyCountryCode?: string;
      startUrl?: string;
      browserScreenWidth?: number;
      browserScreenHeight?: number;
    },
  ) {
    return await ctx.runAction(this.component.sessions.create, {
      apiKey: this.apiKey,
      ...(args ?? {}),
    });
  }

  async getSession(ctx: QueryCtx, args: { sessionId: string }) {
    return await ctx.runQuery(this.component.sessions.get, {
      sessionId: args.sessionId as never,
    });
  }

  async listSessions(
    ctx: QueryCtx,
    args?: {
      status?: "active" | "stopped";
      limit?: number;
    },
  ) {
    return await ctx.runQuery(this.component.sessions.list, args ?? {});
  }

  async fetchSessionDetail(ctx: ActionCtx, args: { externalId: string }) {
    return await ctx.runAction(this.component.sessions.fetchDetail, {
      apiKey: this.apiKey,
      externalId: args.externalId,
    });
  }

  async stopSession(ctx: ActionCtx, args: { externalId: string }) {
    return await ctx.runAction(this.component.sessions.stop, {
      apiKey: this.apiKey,
      externalId: args.externalId,
    });
  }

  // ------- Profiles -------

  async createProfile(ctx: ActionCtx, args?: { name?: string }) {
    return await ctx.runAction(this.component.profiles.create, {
      apiKey: this.apiKey,
      ...(args ?? {}),
    });
  }

  async listProfiles(ctx: ActionCtx) {
    return await ctx.runAction(this.component.profiles.list, {
      apiKey: this.apiKey,
    });
  }

  async getProfile(ctx: ActionCtx, args: { profileId: string }) {
    return await ctx.runAction(this.component.profiles.getProfile, {
      apiKey: this.apiKey,
      profileId: args.profileId,
    });
  }

  async updateProfile(
    ctx: ActionCtx,
    args: { profileId: string; name: string },
  ) {
    return await ctx.runAction(this.component.profiles.update, {
      apiKey: this.apiKey,
      ...args,
    });
  }

  async deleteProfile(ctx: ActionCtx, args: { profileId: string }) {
    return await ctx.runAction(this.component.profiles.deleteProfile, {
      apiKey: this.apiKey,
      profileId: args.profileId,
    });
  }
}
