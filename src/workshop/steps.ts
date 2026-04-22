export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string; filename?: string }
  | { type: "note"; content: string }
  | { type: "heading"; content: string }
  | { type: "list"; items: string[] }
  | { type: "diagram"; content: string };

export interface Step {
  title: string;
  subtitle?: string;
  blocks: ContentBlock[];
}

export const steps: Step[] = [
  // ── 0: Workshop Overview ──────────────────────────────────────────────────
  {
    title: "Building Voice Agents with the Cloudflare Agents SDK",
    subtitle: "Workshop Overview",
    blocks: [
      {
        type: "text",
        content:
          "A hands-on workshop where you'll build a real-time voice-powered customer support agent from scratch using Cloudflare Workers, Durable Objects, Workers AI, and the @cloudflare/voice SDK.",
      },
      {
        type: "heading",
        content: "What we're building",
      },
      {
        type: "text",
        content:
          'A voice-powered customer support agent for a fictional e-commerce store called "Acme Inc." Users speak into their microphone, the agent transcribes their speech in real-time, calls an LLM to generate a response, and speaks the answer back — all over a single WebSocket connection.',
      },
      {
        type: "heading",
        content: "The agent can",
      },
      {
        type: "list",
        items: [
          "Look up order status by order number",
          "Initiate returns for delivered orders",
          "Check product availability and pricing",
        ],
      },
      {
        type: "heading",
        content: "What you'll learn",
      },
      {
        type: "list",
        items: [
          "How the Cloudflare Agents SDK works (Durable Objects under the hood)",
          "How @cloudflare/voice adds a real-time voice pipeline (STT → LLM → TTS)",
          "How to wire up AI tool calls with the Vercel AI SDK",
          "How to build a React client using the useVoiceAgent hook",
        ],
      },
    ],
  },

  // ── 1: Prerequisites ──────────────────────────────────────────────────────
  {
    title: "Prerequisites",
    subtitle: "Before we begin",
    blocks: [
      {
        type: "list",
        items: [
          "A Cloudflare account — sign up at dash.cloudflare.com",
          "Workers AI access (included in the free plan — no extra setup)",
          "Node.js 18+ installed — check with: node --version",
          "pnpm installed — npm install -g pnpm",
          "Wrangler CLI authenticated — run: wrangler login",
          "A microphone (built-in or external)",
        ],
      },
    ],
  },

  // ── 2: Architecture Overview ──────────────────────────────────────────────
  {
    title: "Architecture Overview",
    subtitle: "How the pieces fit together",
    blocks: [
      {
        type: "diagram",
        content: `sequenceDiagram
    participant User
    participant Browser as React SPA
    participant DO as VoiceAgent Durable Object
    participant AI as Workers AI
    participant API as CRM Fixture API

    User->>Browser: Clicks call button
    Browser->>DO: WebSocket opens
    DO-->>Browser: Greeting (TTS audio)

    loop Conversation turns
        User->>Browser: Speaks
        Browser->>DO: Audio stream
        DO->>AI: STT (speech-to-text)
        AI-->>DO: Transcript text
        DO->>AI: LLM (generateText + tools)

        opt Tool calls (0-5 steps)
            AI-->>DO: Tool call request
            DO->>API: lookup_order / request_return / check_product
            API-->>DO: JSON result
            DO->>AI: Tool result
        end

        AI-->>DO: Final text response
        DO->>AI: TTS (text-to-speech)
        AI-->>DO: Audio stream
        DO-->>Browser: Audio stream
        Browser->>User: Agent speaks
    end

    User->>Browser: Clicks hang up
    Browser->>DO: WebSocket closes`,
      },
      {
        type: "note",
        content:
          "Key insight: Every voice agent is a Durable Object — a stateful, addressable server instance with its own SQLite database, WebSocket connections, and application logic. The voice pipeline extends this model instead of replacing it.",
      },
    ],
  },

  // ── 3: Scaffold & Configure ────────────────────────────────────────────────
  {
    title: "Step 1 — Scaffold the Project",
    subtitle: "Create a React + Workers app with C3",
    blocks: [
      {
        type: "code",
        language: "bash",
        content: "pnpm create cloudflare@latest voice-agent-workshop --framework=react",
      },
      {
        type: "text",
        content:
          "This gives you a working React + Vite + Cloudflare Workers project with TypeScript, wrangler.jsonc, and the Cloudflare Vite plugin already configured.",
      },
      {
        type: "heading",
        content: "Install the voice agent dependencies",
      },
      {
        type: "code",
        language: "bash",
        content: "pnpm add @cloudflare/voice agents ai workers-ai-provider zod",
      },
      {
        type: "heading",
        content: "Add Tailwind CSS v4 via CDN (Just to keep it simple)",
      },
      {
        type: "text",
        content:
          "Add this script tag to the <head> of your index.html for quick styling (no build step):",
      },
      {
        type: "code",
        language: "html",
        filename: "index.html",
        content: `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`,
      },
    ],
  },

  // ── 4: Configure Wrangler ─────────────────────────────────────────────────
  {
    title: "Step 2 — Configure Wrangler",
    subtitle: "Add AI, Durable Objects, and voice agent bindings",
    blocks: [
      {
        type: "text",
        content:
          "The scaffold gives you a basic wrangler.jsonc. Add the following bindings for Workers AI, the Durable Object, and SQLite migrations:",
      },
      {
        type: "code",
        language: "jsonc",
        filename: "wrangler.jsonc (add these fields)",
        content: `{
  // ... existing scaffold config
  "main": "worker/index.ts",
  "compatibility_flags": ["nodejs_compat"],
  "ai": {
    "binding": "AI",
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "VoiceAgent",
        "class_name": "VoiceAgent",
      },
    ],
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["VoiceAgent"],
    },
  ],
}`,
      },
      {
        type: "heading",
        content: "What each field does",
      },
      {
        type: "list",
        items: [
          'main — Points to our Worker entry file at worker/index.ts',
          'nodejs_compat — Required for the agents SDK (uses Node.js APIs)',
          'ai.binding: "AI" — Creates an AI binding for Workers AI models (STT, LLM, TTS)',
          "durable_objects — Declares our VoiceAgent Durable Object class",
          "migrations — Required for Durable Objects with SQLite storage",
        ],
      },
      {
        type: "note",
        content:
          'The class_name must match the class name you export from worker/index.ts. The binding name must also match the name used in the useVoiceAgent hook on the client.',
      },
    ],
  },

  // ── 5: Build the Voice Agent (Server) ─────────────────────────────────────
  {
    title: "Step 3 — Build the Voice Agent",
    subtitle: "The server-side voice pipeline",
    blocks: [
      {
        type: "heading",
        content: "5a. Start with a minimal voice agent",
      },
      {
        type: "text",
        content:
          "Let's build incrementally. Start with the absolute minimum — a voice agent that echoes back what you say:",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts",
        content: `import { Agent, routeAgentRequest } from "agents";
import {
  withVoice,
  WorkersAIFluxSTT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";

interface Env {
  AI: Ai;
  VoiceAgent: DurableObjectNamespace;
}

const BaseVoiceAgent = withVoice(Agent);

export class VoiceAgent extends BaseVoiceAgent<Env> {
  transcriber = new WorkersAIFluxSTT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  async onCallStart() {
    for (const connection of this.getConnections()) {
      await this.speak(connection, "Hi there! How can I help you today?");
    }
  }

  async onTurn(transcript: string, context: VoiceTurnContext) {
    console.log(\`[onTurn] "\${transcript}"\`);
    return \`You said: \${transcript}\`;
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;`,
      },
      {
        type: "heading",
        content: "What's happening here",
      },
      {
        type: "list",
        items: [
          "withVoice(Agent) is a mixin that adds the entire voice pipeline to a standard Agent class",
          "WorkersAIFluxSTT handles continuous speech-to-text — the model detects when the user stops speaking",
          "WorkersAITTS converts text responses to audio",
          "onCallStart() fires when a user first connects — we use this.speak() to send a greeting",
          "onTurn() receives the transcript and returns a response string (or stream)",
          "routeAgentRequest() maps /agents/voice-agent/default to the VoiceAgent Durable Object",
        ],
      },
    ],
  },

  // ── 8: Add LLM Integration ────────────────────────────────────────────────
  {
    title: "Step 3b — Add LLM Integration",
    subtitle: "Make the agent actually think",
    blocks: [
      {
        type: "text",
        content:
          "Replace the echo onTurn method to use Workers AI via the Vercel AI SDK:",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (updated onTurn)",
        content: `import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";

// Inside the VoiceAgent class:
async onTurn(transcript: string, context: VoiceTurnContext) {
  console.log(\`[onTurn] "\${transcript}"\`);

  const ai = createWorkersAI({ binding: this.env.AI });

  const { text } = await generateText({
    model: ai("@cf/google/gemma-4-26b-a4b-it"),
    system:
      "You are a helpful voice assistant. Keep responses concise — " +
      "you are being spoken aloud. Do not return Markdown or code blocks.",
    messages: [
      ...context.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: transcript },
    ],
  });

  console.log(\`[RESPONSE] "\${text}"\`);
  return text || "Sorry, I couldn't process that. Could you try again?";
}`,
      },
      {
        type: "heading",
        content: "Key concepts",
      },
      {
        type: "list",
        items: [
          "createWorkersAI() connects the Vercel AI SDK to Workers AI models — no API keys needed",
          "context.messages gives us SQLite-backed conversation history that survives reconnections",
          "context.signal aborts the LLM call if the user interrupts",
          "We use generateText here for simplicity — you could use streamText for faster first-audio time",
        ],
      },
      {
        type: "note",
        content:
          "Model note: We're using @cf/google/gemma-4-26b-a4b-it — a fast, capable model on Workers AI. You can swap this for any Workers AI model.",
      },
    ],
  },

  // ── 9: Add Tool Calls ─────────────────────────────────────────────────────
  {
    title: "Step 4 — Add Tool Calls",
    subtitle: "CRM integration with order lookup, returns, and product search",
    blocks: [
      {
        type: "text",
        content:
          "We'll give the agent tools to look up orders, process returns, and check product stock from a mock CRM API at https://fixtures.fayaz.workers.dev/api",
      },
      {
        type: "heading",
        content: "Define the tools with Zod schemas",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (tools)",
        content: `import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

const ecomTools = {
  lookup_order: tool({
    description:
      "Look up an order by its order ID (e.g. ORD-1024). " +
      "Use when customer asks about order status, tracking, or delivery.",
    inputSchema: z.object({
      order_id: z.string().describe("The order ID, e.g. ORD-1024"),
    }),
    execute: async ({ order_id }) => lookupOrder(order_id),
  }),
  request_return: tool({
    description:
      "Start a return for a delivered order. Only delivered orders can be returned.",
    inputSchema: z.object({
      order_id: z.string().describe("The order ID to return"),
      reason: z.string().describe("Reason for the return"),
    }),
    execute: async ({ order_id, reason }) => requestReturn(order_id, reason),
  }),
  check_product_availability: tool({
    description: "Check if a product is in stock and get pricing.",
    inputSchema: z.object({
      product_name: z.string().describe("Product name to search for"),
    }),
    execute: async ({ product_name }) => checkProduct(product_name),
  }),
};`,
      },
      {
        type: "heading",
        content: "Wire tools into onTurn",
      },
      {
        type: "code",
        language: "typescript",
        content: `const { text, steps } = await generateText({
  model: ai("@cf/google/gemma-4-26b-a4b-it"),
  system: SYSTEM_PROMPT,
  messages: [
    ...context.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: transcript },
  ],
  tools: ecomTools,
  // Allow up to 5 tool-call steps before forcing a final response
  stopWhen: stepCountIs(5),
});`,
      },
      {
        type: "note",
        content:
          "stepCountIs(5) caps tool-call iterations at 5 to prevent runaway loops. The LLM might need multiple steps — call a tool, get the result, then call another tool or generate the final response.",
      },
    ],
  },

  // ── 10: System Prompt ─────────────────────────────────────────────────────
  {
    title: "Step 4b — The System Prompt",
    subtitle: "Teaching the LLM to handle voice transcripts",
    blocks: [
      {
        type: "text",
        content:
          'When users say "order nine eight three one", the STT model transcribes it as words, not digits. The system prompt teaches the LLM to convert these to the format ORD-9831 before calling tools. This is a critical real-world pattern for voice agents.',
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts",
        content: `const SYSTEM_PROMPT = \`You are a friendly customer support voice assistant for Acme Inc, an online store.

You have tools to look up orders, start returns, and check product availability. USE THEM — do not make up info.


IMPORTANT — SPEECH-TO-TEXT:
Users speak their order number, so transcripts contain spoken words not digits.
Order IDs look like "ORD-" followed by 4 digits (e.g. ORD-9831, ORD-8916).
Convert spoken numbers to digits and prepend "ORD-" before calling tools:
- "nine eight three one" or "ninety-eight thirty-one" → "ORD-9831"
- "eight nine one six" → "ORD-8916"
If the user only says digits without "ORD", still format as "ORD-XXXX".

Keep responses SHORT and conversational. After tool results, summarize naturally.
Don't read out full addresses or long lists — give the key info.
Do not return Markdown or code blocks in your responses.\`;`,
      },
    ],
  },

  // ── 11: Build the React Client ────────────────────────────────────────────
  {
    title: "Step 5 — Build the React Client",
    subtitle: "The voice UI with useVoiceAgent hook",
    blocks: [
      {
        type: "heading",
        content: "HTML shell with Tailwind CSS v4 CDN",
      },
      {
        type: "code",
        language: "html",
        filename: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cloudflare Voice Agent Demo</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  </head>
  <body class="bg-neutral-50 text-neutral-900 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        type: "heading",
        content: "The useVoiceAgent hook — the entire client API",
      },
      {
        type: "code",
        language: "tsx",
        filename: "src/App.tsx",
        content: `import { useVoiceAgent } from "@cloudflare/voice/react";

function App() {
  const {
    status,           // "idle" | "listening" | "thinking" | "speaking"
    transcript,       // Array of { role: "user"|"agent", text: string }
    interimTranscript,// Partial transcript while user is still speaking
    audioLevel,       // 0-1 mic volume (for visualizations)
    isMuted,          // Whether the mic is muted
    startCall,        // Function to start the call
    endCall,          // Function to end the call
    toggleMute,       // Function to toggle mic mute
  } = useVoiceAgent({ agent: "VoiceAgent" });

  const isActive = status !== "idle";

  return (
    <div>
      <button onClick={isActive ? endCall : startCall}>
        {isActive ? "Hang up" : "Start call"}
      </button>

      {transcript.map((msg, i) => (
        <div key={i}>
          <strong>{msg.role}:</strong> {msg.text}
        </div>
      ))}

      {interimTranscript && <div><em>{interimTranscript}</em></div>}
    </div>
  );
}`,
      },
      {
        type: "heading",
        content: "Key points",
      },
      {
        type: "list",
        items: [
          'useVoiceAgent({ agent: "VoiceAgent" }) — agent name must match the exported class name. The hook auto-converts PascalCase → kebab-case for the URL',
          "status cycles: idle → listening → thinking → speaking → listening — this is all you need for UI state",
          "transcript is an array of finalized messages — both user and agent",
          "interimTranscript shows what the STT model is hearing in real-time",
          "audioLevel gives a 0–1 value for mic volume — great for visualizations",
        ],
      },
    ],
  },

  // ── 12: Run and Test ──────────────────────────────────────────────────────
  {
    title: "Step 6 — Run and Test",
    subtitle: "Start the dev server and try it out",
    blocks: [
      {
        type: "code",
        language: "bash",
        content: "pnpm dev",
      },
      {
        type: "text",
        content:
          "This starts Vite's dev server with the Workers runtime (Miniflare) running locally. Open the URL shown in the terminal (usually http://localhost:5173).",
      },
      {
        type: "heading",
        content: "Test prompts to try",
      },
      {
        type: "list",
        items: [
          '"What\'s the status of order ORD-9831?" — triggers lookup_order tool',
          '"I\'d like to return order ORD-8916, it was damaged" — triggers request_return tool',
          '"Do you have wireless headphones in stock?" — triggers check_product_availability tool',
        ],
      },
      {
        type: "heading",
        content: "What to look for",
      },
      {
        type: "list",
        items: [
          "The status badge changes: Listening (green) → Thinking (yellow) → Speaking (blue)",
          "The audio level bars react to your voice in real-time",
          "Interim transcripts appear while you're still speaking",
          "Final transcripts appear as solid message bubbles once finalized",
          "Watch the terminal for [TOOL] and [RESULT] logs showing tool calls in action",
        ],
      },
      {
        type: "note",
        content:
          "Even in local dev, the AI binding hits remote Cloudflare APIs. You need valid Cloudflare auth (wrangler login) and will incur usage — but it's included in the free plan.",
      },
    ],
  },

  // ── 13: Deploy ────────────────────────────────────────────────────────────
  {
    title: "Step 7 — Deploy to Cloudflare",
    subtitle: "Ship it globally",
    blocks: [
      {
        type: "code",
        language: "bash",
        content: "pnpm deploy",
      },
      {
        type: "text",
        content:
          'This runs "tsc -b && vite build" then "wrangler deploy". Your voice agent is now running globally on Cloudflare\'s network.',
      },
      {
        type: "heading",
        content: "How the voice pipeline works end-to-end",
      },
      {
        type: "diagram",
        content: `sequenceDiagram
    participant Browser
    participant DO as VoiceAgent DO
    participant STT as WorkersAI STT
    participant LLM as WorkersAI LLM
    participant TTS as WorkersAI TTS

    Browser->>DO: WebSocket opens
    DO->>TTS: this.speak(greeting)
    TTS-->>DO: Audio
    DO-->>Browser: Greeting audio

    loop Each utterance
        Browser->>DO: PCM audio stream
        DO->>STT: Continuous transcription
        STT-->>Browser: Interim transcripts
        STT-->>DO: Final transcript
        DO->>LLM: onTurn(transcript, context)
        LLM-->>DO: Tool calls + final text
        DO->>TTS: Response text
        TTS-->>DO: Audio stream
        DO-->>Browser: Audio stream
    end

    Browser->>DO: WebSocket closes
    Note over DO: Conversation saved in SQLite`,
      },
      {
        type: "heading",
        content: "Key details",
      },
      {
        type: "list",
        items: [
          "Single WebSocket — all audio and messages flow over one connection",
          "Continuous STT — audio streams continuously; the model decides when the user is done speaking",
          "Conversation persistence — context.messages is backed by SQLite; history survives reconnections",
          "Interruption support — if the user speaks while the agent is responding, context.signal aborts the LLM",
        ],
      },
    ],
  },

  // ── 14: Bonus ─────────────────────────────────────────────────────────────
  {
    title: "Bonus: Pipeline Hooks & Third-Party Providers",
    subtitle: "Extend the voice pipeline",
    blocks: [
      {
        type: "heading",
        content: "Pipeline hooks — intercept and transform data",
      },
      {
        type: "code",
        language: "typescript",
        content: `export class VoiceAgent extends BaseVoiceAgent<Env> {
  transcriber = new WorkersAIFluxSTT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  // Filter out noise / very short transcripts
  afterTranscribe(transcript: string, connection: Connection) {
    if (transcript.length < 3) return null; // Drop it
    return transcript;
  }

  // Fix pronunciation before TTS
  beforeSynthesize(text: string, connection: Connection) {
    return text.replace(/\\bAI\\b/g, "A.I.");
  }

  async onTurn(transcript: string, context: VoiceTurnContext) {
    // ...
  }
}`,
      },
      {
        type: "heading",
        content: "Third-party STT/TTS providers",
      },
      {
        type: "code",
        language: "typescript",
        content: `import { ElevenLabsTTS } from "@cloudflare/voice-elevenlabs";
import { DeepgramSTT } from "@cloudflare/voice-deepgram";

export class VoiceAgent extends BaseVoiceAgent<Env> {
  transcriber = new DeepgramSTT({
    apiKey: this.env.DEEPGRAM_API_KEY,
  });

  tts = new ElevenLabsTTS({
    apiKey: this.env.ELEVENLABS_API_KEY,
    voiceId: "21m00Tcm4TlvDq8ikWAM",
  });
}`,
      },
      {
        type: "heading",
        content: "Voice-input only (no TTS)",
      },
      {
        type: "code",
        language: "typescript",
        content: `import { withVoiceInput, WorkersAINova3STT } from "@cloudflare/voice";

const InputAgent = withVoiceInput(Agent);

export class DictationAgent extends InputAgent<Env> {
  transcriber = new WorkersAINova3STT(this.env.AI);

  onTranscript(text: string, connection: Connection) {
    console.log("User said:", text);
  }
}`,
      },
      {
        type: "text",
        content:
          "Client-side: use useVoiceInput instead of useVoiceAgent.",
      },
    ],
  },

  // ── 15: Resources ─────────────────────────────────────────────────────────
  {
    title: "Resources",
    subtitle: "Further reading and documentation",
    blocks: [
      {
        type: "list",
        items: [
          "Cloudflare Voice Agent Docs — developers.cloudflare.com/agents/guides/build-a-voice-agent/",
          "Voice API Reference — developers.cloudflare.com/agents/api-reference/voice/",
          "Blog Post: \"Add voice to your agent\" — blog.cloudflare.com/voice-agents/",
          "Agents SDK GitHub — github.com/cloudflare/agents",
          "Vercel AI SDK Docs — sdk.vercel.ai/docs",
          "Workers AI Models — developers.cloudflare.com/workers-ai/models/",
          "Durable Objects Docs — developers.cloudflare.com/durable-objects/",
        ],
      },
    ],
  },
];
