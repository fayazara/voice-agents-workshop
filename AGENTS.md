# AGENTS.md

## What this is

Workshop demo: a Cloudflare Workers voice agent using `@cloudflare/voice` (experimental). React SPA client + Workers backend with a Durable Object voice agent. Not a framework app — plain Vite React + Cloudflare Vite plugin.

## Architecture (two separate worlds)

- **`worker/index.ts`** — Workers entry point. Exports `VoiceAgent` (Durable Object class) and a default fetch handler using `routeAgentRequest()`. This is the only server file.
- **`src/`** — React SPA. Client connects to the agent via `useVoiceAgent({ agent: "VoiceAgent" })` which opens a WebSocket to `/agents/voice-agent/default`.
- **`index.html`** — Uses Tailwind CSS v4 via CDN (`@tailwindcss/browser@4`). No build-time Tailwind, no CSS files.

The `useVoiceAgent` hook auto-converts the agent name from PascalCase to kebab-case for the URL path (`VoiceAgent` → `voice-agent`). The agent name in the hook **must match** the exported class name in `worker/index.ts` and the `class_name` in `wrangler.jsonc`.

## Commands

```sh
pnpm dev          # Vite dev server (runs Workers locally via miniflare)
pnpm build        # tsc -b && vite build
pnpm deploy       # build + wrangler deploy
pnpm cf-typegen   # regenerate worker-configuration.d.ts from wrangler.jsonc
```

## TypeScript: three tsconfig projects

- `tsconfig.app.json` — `src/` (React, DOM types)
- `tsconfig.worker.json` — `worker/` (extends node config, includes `worker-configuration.d.ts` for CF runtime types)
- `tsconfig.node.json` — `vite.config.ts`

The `worker/index.ts` file defines its own `Env` interface inline rather than using the generated one. If you add bindings to `wrangler.jsonc`, update the `Env` interface in `worker/index.ts` manually (or run `pnpm cf-typegen` and switch to the generated type).

## Wrangler bindings

- `AI` — Workers AI binding (always remote, even in local dev)
- `VoiceAgent` — Durable Object binding (class `VoiceAgent`, SQLite-backed via migrations)

The `account_id` is set in `wrangler.jsonc` to avoid the multi-account prompt in local dev.

## Voice SDK patterns

- Server: `withVoice(Agent)` mixin adds the voice pipeline. Implement `onTurn(transcript, context)` — return a string or stream.
- `onCallStart()` can call `this.speak(connection, text)` for a greeting.
- `context.messages` gives SQLite-backed conversation history. `context.signal` aborts on user interrupt.
- Client: `useVoiceAgent` from `@cloudflare/voice/react`. States: `idle` → `listening` → `thinking` → `speaking`.
- For STT-only (no TTS response), use `withVoiceInput` / `useVoiceInput` instead.

## Gotchas

- **Do NOT use TanStack Start or other SSR frameworks with voice agents** — the framework controls the fetch handler entry point, making it impossible to export Durable Object classes and run `routeAgentRequest` without significant hacking. Use plain Vite + Cloudflare Vite plugin.
- AI bindings always hit remote Cloudflare APIs, even in `pnpm dev`. This means you need valid Cloudflare auth (`wrangler login`) and will incur usage.
- Adding a new Durable Object class requires a new migration entry in `wrangler.jsonc` `migrations` array with a new tag.
- The `assets.not_found_handling: "single-page-application"` setting makes the Worker serve `index.html` for all non-API routes — the SPA handles client routing.
