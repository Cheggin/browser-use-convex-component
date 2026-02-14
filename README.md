# Browser Use Convex Component

A [Convex](https://convex.dev) component that wraps the [Browser Use Cloud API](https://cloud.browser-use.com), enabling AI-powered browser automation with persistent task tracking, session management, and reactive queries.

## Features

- **Task Management** - Create, monitor, and stop browser automation tasks
- **Session Management** - Create persistent browser sessions with proxy support
- **Profile Management** - Manage browser profiles for authentication persistence
- **Reactive Queries** - All task and session data stored in Convex for real-time subscriptions

## Installation

```bash
npm install browser-use-convex-component
```

## Setup

### 1. Configure your app

In your `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import browserUse from "browser-use-convex-component/convex.config.js";

const app = defineApp();
app.use(browserUse);

export default app;
```

### 2. Set your API key

Set the `BROWSER_USE_API_KEY` environment variable in your Convex deployment:

```bash
npx convex env set BROWSER_USE_API_KEY bu_your_api_key_here
```

## Usage

### Initialize the client

```typescript
import { BrowserUse } from "browser-use-convex-component";
import { components } from "./_generated/api.js";

const browserUse = new BrowserUse(components.browserUse);
```

### Create a task

```typescript
export const startTask = action({
  args: { task: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { taskId, externalId } = await browserUse.createTask(ctx, {
      task: args.task,
      startUrl: "https://example.com",
    });
    return { taskId, externalId };
  },
});
```

### Query tasks reactively

```typescript
export const listTasks = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.listTasks(ctx);
  },
});
```

### Check task status

```typescript
export const checkTask = action({
  args: { externalId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await browserUse.fetchTaskStatus(ctx, args);
  },
});
```

### Session management

```typescript
export const createSession = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.createSession(ctx, {
      proxyCountryCode: "us",
    });
  },
});
```

### Profile management

```typescript
export const listProfiles = action({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await browserUse.listProfiles(ctx);
  },
});
```

## API Reference

### Tasks

| Method | Type | Description |
|--------|------|-------------|
| `createTask(ctx, args)` | Action | Create a browser automation task |
| `getTask(ctx, { taskId })` | Query | Get task from local DB |
| `listTasks(ctx, opts?)` | Query | List tasks with optional filters |
| `getTaskSteps(ctx, { taskId })` | Query | Get step-by-step execution details |
| `fetchTaskStatus(ctx, { externalId })` | Action | Fetch latest status from API |
| `fetchTaskDetail(ctx, { externalId })` | Action | Fetch full details and steps from API |
| `stopTask(ctx, { externalId })` | Action | Stop a running task |

### Sessions

| Method | Type | Description |
|--------|------|-------------|
| `createSession(ctx, args?)` | Action | Create a browser session |
| `getSession(ctx, { sessionId })` | Query | Get session from local DB |
| `listSessions(ctx, opts?)` | Query | List sessions with optional filters |
| `fetchSessionDetail(ctx, { externalId })` | Action | Fetch session details from API |
| `stopSession(ctx, { externalId })` | Action | Stop a session |

### Profiles

| Method | Type | Description |
|--------|------|-------------|
| `createProfile(ctx, args?)` | Action | Create a browser profile |
| `listProfiles(ctx)` | Action | List all profiles |
| `getProfile(ctx, { profileId })` | Action | Get profile details |
| `updateProfile(ctx, { profileId, name })` | Action | Update profile name |
| `deleteProfile(ctx, { profileId })` | Action | Delete a profile |

## Task Options

| Option | Type | Description |
|--------|------|-------------|
| `task` | `string` | The instruction for the AI agent (required) |
| `llm` | `string` | AI model (default: `browser-use-2.0`) |
| `sessionId` | `string` | Existing session to use |
| `startUrl` | `string` | Initial URL to navigate to |
| `maxSteps` | `number` | Max execution steps (default: 100) |
| `flashMode` | `boolean` | Accelerated execution mode |
| `thinking` | `boolean` | Extended reasoning |
| `vision` | `boolean \| "auto"` | Visual recognition |
| `highlightElements` | `boolean` | Highlight interactive elements |
| `systemPromptExtension` | `string` | Append to the system prompt |
| `structuredOutput` | `object` | JSON schema for response formatting |
| `secrets` | `object` | Secure key-value data injection |
| `allowedDomains` | `string[]` | Navigation restrictions |
| `metadata` | `object` | Custom tracking pairs |
| `judge` | `boolean` | AI-powered success validation |
| `judgeGroundTruth` | `string` | Ground truth for judge evaluation |
| `judgeLlm` | `string` | Model for judge evaluation |
| `skillIds` | `string[]` | Pre-built skill IDs to use |

## License

MIT
