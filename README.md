# Browser Use Convex Component

A [Convex](https://convex.dev) component that wraps the [Browser Use Cloud API](https://cloud.browser-use.com), enabling AI-powered browser automation with persistent task tracking, session management, and reactive queries.

## Features

- **Task Management** - Create, poll, pause, resume, and stop browser automation tasks
- **Session Management** - Create persistent browser sessions with proxy support
- **Profile Management** - Manage browser profiles for authentication persistence
- **Reactive Queries** - All task and session data stored in Convex for real-time subscriptions
- **Polling** - Built-in `createAndPoll` for fire-and-forget task execution

## Installation

### 1. Install the component

For local development, add the component source to your project. For NPM packages, install via:

```bash
npm install @anthropic/browser-use-convex-component
```

### 2. Configure your app

In your `convex/convex.config.ts`:

```typescript
import { defineApp } from "convex/server";
import browserUse from "@anthropic/browser-use-convex-component/convex.config.js";

const app = defineApp();
app.use(browserUse);

export default app;
```

### 3. Set your API key

Set the `BROWSER_USE_API_KEY` environment variable in your Convex deployment:

```bash
npx convex env set BROWSER_USE_API_KEY bu_your_api_key_here
```

## Usage

### Initialize the client

```typescript
import { BrowserUse } from "@anthropic/browser-use-convex-component";
import { components } from "./_generated/api.js";

const browserUse = new BrowserUse(components.browserUse);
```

### Create and poll a task (fire-and-forget)

```typescript
export const runTask = action({
  args: { task: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result = await browserUse.createTaskAndPoll(ctx, {
      task: args.task,
    });
    // result: { taskId, externalId, status, output, isSuccess }
    return result;
  },
});
```

### Create a task (non-blocking)

```typescript
export const startTask = action({
  args: { task: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { taskId, externalId } = await browserUse.createTask(ctx, {
      task: args.task,
      startUrl: "https://example.com",
      llm: "gemini-2.5-flash",
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

## Client API Reference

### Tasks

| Method | Type | Description |
|--------|------|-------------|
| `createTask(ctx, args)` | Action | Create a browser automation task |
| `createTaskAndPoll(ctx, args)` | Action | Create and wait for task completion |
| `getTask(ctx, { taskId })` | Query | Get task from local DB |
| `listTasks(ctx, opts?)` | Query | List tasks with optional filters |
| `getTaskSteps(ctx, { taskId })` | Query | Get step-by-step execution details |
| `fetchTaskStatus(ctx, { externalId })` | Action | Fetch latest status from API |
| `fetchTaskDetail(ctx, { externalId })` | Action | Fetch full details from API |
| `stopTask(ctx, { externalId })` | Action | Stop a running task |
| `pauseTask(ctx, { externalId })` | Action | Pause a running task |
| `resumeTask(ctx, { externalId })` | Action | Resume a paused task |
| `pollTaskUntilDone(ctx, { externalId })` | Action | Poll until terminal status |

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

When creating tasks, you can pass these options:

| Option | Type | Description |
|--------|------|-------------|
| `task` | `string` | The instruction for the AI agent (required) |
| `sessionId` | `string` | Existing session to use |
| `startUrl` | `string` | Initial URL to navigate to |
| `llm` | `string` | AI model (default: `gemini-2.5-flash`) |
| `maxSteps` | `number` | Max execution steps (default: 100) |
| `flashMode` | `boolean` | Accelerated execution mode |
| `thinking` | `boolean` | Extended reasoning |
| `vision` | `boolean \| "auto"` | Visual recognition |
| `structuredOutput` | `object` | JSON schema for response formatting |
| `secrets` | `object` | Secure key-value data injection |
| `allowedDomains` | `string[]` | Navigation restrictions |
| `metadata` | `object` | Custom tracking pairs |
| `judge` | `boolean` | AI-powered success validation |

## License

MIT
