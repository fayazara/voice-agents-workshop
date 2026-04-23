export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "code"; language: string; content: string; filename?: string }
  | { type: "note"; content: string }
  | { type: "heading"; content: string }
  | { type: "list"; items: string[] }
  | { type: "diagram"; content: string }
  | { type: "intro"; name: string; role: string; photo: string }
  | {
      type: "resources";
      qrUrl: string;
      links: { label: string; url: string; icon?: string }[];
    };

export interface Step {
  title: string;
  subtitle?: string;
  blocks: ContentBlock[];
}

export const steps: Step[] = [
  // ── 0: Intro ───────────────────────────────────────────────────────────────
  {
    title: "Building Voice Agents with the Cloudflare Agents SDK",
    blocks: [
      {
        type: "intro",
        name: "Fayaz Ahmed",
        role: "Sr. Developer Educator at Cloudflare",
        photo: "https://github.com/fayazara.png",
      },
    ],
  },

  // ── 1: Workshop Overview ──────────────────────────────────────────────────
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
          'A voice-powered customer support agent for a fictional e-commerce store called "Acme Inc." Users speak into their microphone, the agent transcribes their speech in real-time, calls an LLM to generate a response, and speaks the answer back - all over a single WebSocket connection.',
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

  // ── 2: Prerequisites ──────────────────────────────────────────────────────
  {
    title: "Prerequisites",
    subtitle: "Before we begin",
    blocks: [
      {
        type: "list",
        items: [
          "A Cloudflare account - sign up at dash.cloudflare.com",
          "Workers AI access (included in the free plan - no extra setup)",
          "Node.js 18+ installed - check with: node --version",
          "pnpm installed - npm install -g pnpm",
          "Wrangler CLI authenticated - run: wrangler login",
          "A microphone (built-in or external)",
        ],
      },
    ],
  },

  // ── 3: Architecture Overview ──────────────────────────────────────────────
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
          "Key insight: Every voice agent is a Durable Object - a stateful, addressable server instance with its own SQLite database, WebSocket connections, and application logic. The voice pipeline extends this model instead of replacing it.",
      },
    ],
  },

  // ── 4: @cloudflare/voice Overview ──────────────────────────────────────────
  {
    title: "@cloudflare/voice",
    subtitle: "What the SDK gives you out of the box",
    blocks: [
      {
        type: "text",
        content:
          "An experimental voice pipeline for the Agents SDK. Voice becomes another way to talk to the same Durable Object, with the same tools, persistence, and WebSocket connection model. No separate voice framework needed.",
      },
      {
        type: "heading",
        content: "Server & client exports",
      },
      {
        type: "list",
        items: [
          "withVoice(Agent) - Full voice agent mixin: STT + LLM + TTS + persistence",
          "withVoiceInput(Agent) - STT-only mixin: transcription without a response (dictation, voice search)",
          "useVoiceAgent - React hook for withVoice agents",
          "useVoiceInput - React hook for withVoiceInput agents",
          "VoiceClient - Framework-agnostic client (vanilla JS, Vue, Svelte, etc.)",
        ],
      },
      {
        type: "heading",
        content: "Built-in Workers AI providers (no API keys)",
      },
      {
        type: "list",
        items: [
          "WorkersAIFluxSTT - Continuous STT via @cf/deepgram/flux (best for conversation)",
          "WorkersAINova3STT - Continuous STT via @cf/deepgram/nova-3 (best for dictation)",
          "WorkersAITTS - Text-to-speech via @cf/deepgram/aura-1",
        ],
      },
      {
        type: "heading",
        content: "Key features",
      },
      {
        type: "list",
        items: [
          "Single WebSocket - all audio, transcripts, and messages flow over one connection",
          "Automatic conversation persistence - messages stored in SQLite, survive restarts and reconnections",
          "Streaming TTS - LLM tokens are sentence-chunked and synthesized concurrently for fast first-audio",
          "Interruption handling - user speech during playback cancels the current response via context.signal",
          "Continuous STT - per-call transcriber session; the model handles turn detection, not the client",
          "Pipeline hooks - afterTranscribe, beforeSynthesize, afterSynthesize to intercept/transform data",
          "Lifecycle hooks - beforeCallStart (reject calls), onCallStart, onCallEnd, onInterrupt",
          "Text input alongside voice - sendText() bypasses STT and goes straight to onTurn()",
          "Swappable providers - ElevenLabs TTS, Deepgram STT, Twilio telephony, or bring your own",
        ],
      },
      {
        type: "note",
        content:
          "Because a voice agent is still a Durable Object, all normal Agents SDK capabilities still apply: scheduling, state management, multiple connections, and tools. Voice and text share the same state.",
      },
    ],
  },

  // ── 5: Scaffold the Project ────────────────────────────────────────────────
  {
    title: "Step 1 - Scaffold the Project",
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
        content: "Add Tailwind CSS v4 via CDN (just to keep it simple)",
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

  // ── 5: Configure Wrangler ─────────────────────────────────────────────────
  {
    title: "Step 2 - Configure Wrangler",
    subtitle: "Add AI, Durable Objects, and voice agent bindings",
    blocks: [
      {
        type: "text",
        content:
          "The scaffold gives you a basic wrangler.jsonc. We need to add the Workers AI binding, declare the Durable Object, and set up SQLite migrations. Here is the complete wrangler.jsonc:",
      },
      {
        type: "code",
        language: "jsonc",
        filename: "wrangler.jsonc",
        content: `{
  "name": "voice-agent-workshop",
  "main": "worker/index.ts",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "ai": {
    "binding": "AI"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "VoiceAgent",
        "class_name": "VoiceAgent"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["VoiceAgent"]
    }
  ]
}`,
      },
      {
        type: "heading",
        content: "What each field does",
      },
      {
        type: "list",
        items: [
          'main - Points to our Worker entry file at worker/index.ts (create this folder and file next)',
          'nodejs_compat - Required by the agents SDK (uses Node.js APIs under the hood)',
          'assets.not_found_handling: "single-page-application" - Serves index.html for all non-API routes so client-side routing works',
          'ai.binding: "AI" - Creates an AI binding we can use for STT, LLM, and TTS - no API keys needed',
          "durable_objects - Declares our VoiceAgent class as a Durable Object",
          "migrations - Required for Durable Objects with SQLite storage (conversation history lives here)",
        ],
      },
      {
        type: "note",
        content:
          'The class_name "VoiceAgent" must exactly match the class name you export from worker/index.ts. The hook on the client auto-converts PascalCase to kebab-case for the URL path: VoiceAgent → /agents/voice-agent/default.',
      },
    ],
  },

  // ── 6: Minimal Voice Agent (echo) ─────────────────────────────────────────
  {
    title: "Step 3 - A Minimal Voice Agent",
    subtitle: "Create worker/index.ts with an echo agent",
    blocks: [
      {
        type: "text",
        content:
          "Let's build incrementally. Create the file worker/index.ts with the absolute minimum - a voice agent that echoes back what you say. This proves the entire voice pipeline works before we add any AI logic.",
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
          "WorkersAIFluxSTT handles continuous speech-to-text - the model detects when the user stops speaking",
          "WorkersAITTS converts text responses to audio",
          "onCallStart() fires when a user first connects - we use this.speak() to send a greeting",
          "onTurn() receives the final transcript and returns a response string - right now it just echoes back",
          "routeAgentRequest() maps incoming requests to the correct Durable Object by URL pattern",
          "The default export is the Worker entry point - it routes agent requests or returns 404",
        ],
      },
      {
        type: "note",
        content:
          "At this point you can run pnpm dev and test the echo agent with the React client (we'll build that in Step 7). It should greet you and repeat back whatever you say.",
      },
    ],
  },

  // ── 7: Add LLM to onTurn ──────────────────────────────────────────────────
  {
    title: "Step 4 - Add LLM Integration",
    subtitle: "Replace the echo with an actual AI response",
    blocks: [
      {
        type: "text",
        content:
          "Now let's make the agent think. We'll replace the echo logic in onTurn with a call to Workers AI via the Vercel AI SDK. Here is the complete updated worker/index.ts - the only changes are: two new imports at the top, and the onTurn method body.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (complete file)",
        content: `import { Agent, routeAgentRequest } from "agents";
import {
  withVoice,
  WorkersAIFluxSTT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";

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

    const ai = createWorkersAI({ binding: this.env.AI });

    const { text } = await generateText({
      model: ai("@cf/google/gemma-4-26b-a4b-it"),
      system:
        "You are a helpful voice assistant. Keep responses concise - " +
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
        content: "What changed from Step 3",
      },
      {
        type: "list",
        items: [
          'Added imports: generateText from "ai" and createWorkersAI from "workers-ai-provider"',
          "createWorkersAI() bridges the Vercel AI SDK to Workers AI - no API keys needed, it uses the AI binding directly",
          "context.messages gives us SQLite-backed conversation history that survives reconnections",
          'We pass a system prompt telling the LLM to keep responses concise and avoid Markdown (since this is voice output)',
          "The model @cf/google/gemma-4-26b-a4b-it is fast and capable - you can swap it for any Workers AI model",
        ],
      },
      {
        type: "note",
        content:
          "Try it now! Run pnpm dev, start a call, and ask it a general question. It should respond intelligently instead of just echoing. Next we'll give it tools to look up real data.",
      },
    ],
  },

  // ── 8: System Prompt ──────────────────────────────────────────────────────
  {
    title: "Step 5 - The System Prompt",
    subtitle: "Teaching the LLM to handle voice transcripts",
    blocks: [
      {
        type: "text",
        content:
          "Before we add tools, we need a proper system prompt. Voice agents have a unique challenge: when users say \"order nine eight three one\", the STT model transcribes it as words, not digits. The system prompt must teach the LLM to convert these to the format ORD-9831 before calling tools.",
      },
      {
        type: "text",
        content:
          "Add this constant above the VoiceAgent class in worker/index.ts. We will reference it in the next step when we wire everything together.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (add above the VoiceAgent class)",
        content: `const SYSTEM_PROMPT = \`You are a friendly customer support voice assistant for Acme Inc, an online store.

You have tools to look up orders, start returns, and check product availability. USE THEM - do not make up info.


IMPORTANT - SPEECH-TO-TEXT:
Users speak their order number, so transcripts contain spoken words not digits.
Order IDs look like "ORD-" followed by 4 digits (e.g. ORD-9831, ORD-8916).
Convert spoken numbers to digits and prepend "ORD-" before calling tools:
- "nine eight three one" or "ninety-eight thirty-one" → "ORD-9831"
- "eight nine one six" → "ORD-8916"
If the user only says digits without "ORD", still format as "ORD-XXXX".

Keep responses SHORT and conversational. After tool results, summarize naturally.
Don't read out full addresses or long lists - give the key info.
Do not return Markdown or code blocks in your responses.\`;`,
      },
      {
        type: "heading",
        content: "Why this prompt matters for voice",
      },
      {
        type: "list",
        items: [
          "STT outputs words, not digits - \"nine eight three one\" must become ORD-9831",
          "We tell the LLM to USE the tools and not make up info - hallucinated order statuses are bad",
          'We tell it to keep responses SHORT - nobody wants a 3-paragraph answer read aloud',
          'We say no Markdown - bold text and bullet points don\'t make sense when spoken',
        ],
      },
    ],
  },

  // ── 9: CRM Helper Functions ───────────────────────────────────────────────
  {
    title: "Step 6a - CRM API Helper Functions",
    subtitle: "Functions to call our mock e-commerce API",
    blocks: [
      {
        type: "text",
        content:
          "Our agent needs to look up orders, process returns, and check product stock. We'll call a mock CRM API at https://fixtures.fayaz.workers.dev/api. Add these types and functions to worker/index.ts, right after the Env interface.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (add after the Env interface)",
        content: `// ─── CRM API Types & Client ──────────────────────────────────────────────

const CRM_API_BASE = "https://fixtures.fayaz.workers.dev/api";

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  orderNumber: string;
  userId: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  sku: string;
  stock: number;
  rating: number;
  brand: string;
  createdAt: string;
};

type Paginated<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

async function fetchOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  const url =
    \`\${CRM_API_BASE}/orders?search=\${encodeURIComponent(orderNumber)}\`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as Paginated<Order>;
  const exact = body.data.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase(),
  );
  return exact ?? body.data[0] ?? null;
}`,
      },
      {
        type: "note",
        content:
          "This is a mock API - it returns fixed demo data. In a real app, you'd call your actual order management system here.",
      },
    ],
  },

  // ── 10: Tool Execute Functions ────────────────────────────────────────────
  {
    title: "Step 6b - Tool Execute Functions",
    subtitle: "The logic behind each tool the LLM can call",
    blocks: [
      {
        type: "text",
        content:
          "Each tool the LLM calls needs an execute function that does the actual work. These functions call the CRM API and return structured results. Add these right after the fetchOrderByNumber function.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (add after fetchOrderByNumber)",
        content: `// ─── Tool Execute Functions ──────────────────────────────────────────────

async function lookupOrder(orderId: string) {
  const normalized = orderId.toUpperCase().trim();
  try {
    const order = await fetchOrderByNumber(normalized);
    if (!order) {
      return {
        found: false,
        message: \`No order found with ID \${normalized}.\`,
      };
    }
    return {
      found: true,
      id: order.orderNumber,
      status: order.status,
      items: order.items.map(
        (i) => \`\${i.quantity}x \${i.productName} ($\${i.price})\`,
      ),
      total: order.total.toFixed(2),
      shipping_address: order.shippingAddress,
      created_at: order.createdAt,
    };
  } catch (err) {
    console.error("[lookupOrder] error", err);
    return {
      found: false,
      message: "Could not reach the orders service right now.",
    };
  }
}

async function requestReturn(orderId: string, reason: string) {
  const normalized = orderId.toUpperCase().trim();
  try {
    const order = await fetchOrderByNumber(normalized);
    if (!order) {
      return {
        success: false,
        message: \`No order found with ID \${normalized}.\`,
      };
    }
    if (order.status !== "delivered") {
      return {
        success: false,
        message: \`Order \${normalized} cannot be returned - status is "\${order.status}".\`,
      };
    }
    const returnId = \`RET-\${Math.floor(1000 + Math.random() * 9000)}\`;
    return {
      success: true,
      return_id: returnId,
      order_id: normalized,
      reason,
      instructions:
        "A prepaid return label has been emailed. Ship items back within 14 days. Refund in 3-5 business days.",
    };
  } catch (err) {
    console.error("[requestReturn] error", err);
    return {
      success: false,
      message: "Could not reach the orders service right now.",
    };
  }
}

async function checkProduct(productName: string) {
  const query = productName.trim();
  try {
    const url = \`\${CRM_API_BASE}/products?search=\${encodeURIComponent(query)}&limit=5\`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        found: false,
        message: \`No product found matching "\${productName}".\`,
      };
    }
    const body = (await res.json()) as Paginated<Product>;
    const p = body.data[0];
    if (!p) {
      return {
        found: false,
        message: \`No product found matching "\${productName}".\`,
      };
    }
    return {
      found: true,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: \`$\${p.price}\`,
      in_stock: p.stock > 0,
      stock_count: p.stock,
    };
  } catch (err) {
    console.error("[checkProduct] error", err);
    return {
      found: false,
      message: "Could not reach the products service right now.",
    };
  }
}`,
      },
      {
        type: "heading",
        content: "What each function does",
      },
      {
        type: "list",
        items: [
          "lookupOrder - Finds an order by ID and returns its status, items, and total",
          "requestReturn - Validates the order is delivered, then generates a return ID with instructions",
          "checkProduct - Searches products by name and returns price, stock, and brand info",
          "All three normalize input, handle errors gracefully, and return structured objects the LLM can summarize",
        ],
      },
    ],
  },

  // ── 11: Tool Definitions ──────────────────────────────────────────────────
  {
    title: "Step 6c - Define Tools with Zod Schemas",
    subtitle: "Give the LLM typed tools it can call",
    blocks: [
      {
        type: "text",
        content:
          "Now we define the tools the LLM can call using the Vercel AI SDK's tool() helper and Zod schemas. The LLM sees each tool's description and schema, decides when to call them, and we execute them with the functions from the previous step. Add these after the tool execute functions.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (add after the tool execute functions)",
        content: `// ─── Add these imports at the top of the file ──────────────────────────
// import { generateText, stepCountIs, tool } from "ai";
// import { z } from "zod";
// (replace your existing "import { generateText } from 'ai'" line)

// ─── Tool Definitions ────────────────────────────────────────────────────

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
    execute: async ({ order_id, reason }) =>
      requestReturn(order_id, reason),
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
        content: "How AI tool calling works",
      },
      {
        type: "list",
        items: [
          "The LLM sees the tool name, description, and Zod schema - it decides IF and WHEN to call a tool",
          "When the LLM wants to call a tool, it outputs a structured tool call with the right arguments",
          "The Vercel AI SDK automatically runs the execute function and feeds the result back to the LLM",
          "The LLM then uses the tool result to generate a natural language response",
          "This can happen multiple times in a single turn (e.g., look up order then start a return)",
        ],
      },
    ],
  },

  // ── 12: Complete worker/index.ts ──────────────────────────────────────────
  {
    title: "Step 7 - The Complete Voice Agent",
    subtitle: "Putting it all together - the final worker/index.ts",
    blocks: [
      {
        type: "text",
        content:
          "Here is the complete worker/index.ts with everything wired together: imports, types, CRM functions, tools, system prompt, and the VoiceAgent class. Copy this as your final file.",
      },
      {
        type: "code",
        language: "typescript",
        filename: "worker/index.ts (complete file)",
        content: `import { Agent, routeAgentRequest } from "agents";
import {
  withVoice,
  WorkersAIFluxSTT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";
import { generateText, stepCountIs, tool } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { z } from "zod";

interface Env {
  AI: Ai;
  VoiceAgent: DurableObjectNamespace;
}

// ─── CRM API Client ─────────────────────────────────────────────────────

const CRM_API_BASE = "https://fixtures.fayaz.workers.dev/api";

type OrderItem = {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  orderNumber: string;
  userId: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  sku: string;
  stock: number;
  rating: number;
  brand: string;
  createdAt: string;
};

type Paginated<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

async function fetchOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  const url =
    \`\${CRM_API_BASE}/orders?search=\${encodeURIComponent(orderNumber)}\`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as Paginated<Order>;
  const exact = body.data.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase(),
  );
  return exact ?? body.data[0] ?? null;
}

// ─── Tool Execute Functions ──────────────────────────────────────────────

async function lookupOrder(orderId: string) {
  const normalized = orderId.toUpperCase().trim();
  try {
    const order = await fetchOrderByNumber(normalized);
    if (!order) {
      return {
        found: false,
        message: \`No order found with ID \${normalized}.\`,
      };
    }
    return {
      found: true,
      id: order.orderNumber,
      status: order.status,
      items: order.items.map(
        (i) => \`\${i.quantity}x \${i.productName} ($\${i.price})\`,
      ),
      total: order.total.toFixed(2),
      shipping_address: order.shippingAddress,
      created_at: order.createdAt,
    };
  } catch (err) {
    console.error("[lookupOrder] error", err);
    return {
      found: false,
      message: "Could not reach the orders service right now.",
    };
  }
}

async function requestReturn(orderId: string, reason: string) {
  const normalized = orderId.toUpperCase().trim();
  try {
    const order = await fetchOrderByNumber(normalized);
    if (!order) {
      return {
        success: false,
        message: \`No order found with ID \${normalized}.\`,
      };
    }
    if (order.status !== "delivered") {
      return {
        success: false,
        message: \`Order \${normalized} cannot be returned - status is "\${order.status}".\`,
      };
    }
    const returnId = \`RET-\${Math.floor(1000 + Math.random() * 9000)}\`;
    return {
      success: true,
      return_id: returnId,
      order_id: normalized,
      reason,
      instructions:
        "A prepaid return label has been emailed. Ship items back within 14 days. Refund in 3-5 business days.",
    };
  } catch (err) {
    console.error("[requestReturn] error", err);
    return {
      success: false,
      message: "Could not reach the orders service right now.",
    };
  }
}

async function checkProduct(productName: string) {
  const query = productName.trim();
  try {
    const url = \`\${CRM_API_BASE}/products?search=\${encodeURIComponent(query)}&limit=5\`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        found: false,
        message: \`No product found matching "\${productName}".\`,
      };
    }
    const body = (await res.json()) as Paginated<Product>;
    const p = body.data[0];
    if (!p) {
      return {
        found: false,
        message: \`No product found matching "\${productName}".\`,
      };
    }
    return {
      found: true,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: \`$\${p.price}\`,
      in_stock: p.stock > 0,
      stock_count: p.stock,
    };
  } catch (err) {
    console.error("[checkProduct] error", err);
    return {
      found: false,
      message: "Could not reach the products service right now.",
    };
  }
}

// ─── Tool Definitions ────────────────────────────────────────────────────

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
    execute: async ({ order_id, reason }) =>
      requestReturn(order_id, reason),
  }),
  check_product_availability: tool({
    description: "Check if a product is in stock and get pricing.",
    inputSchema: z.object({
      product_name: z.string().describe("Product name to search for"),
    }),
    execute: async ({ product_name }) => checkProduct(product_name),
  }),
};

// ─── System Prompt ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = \`You are a friendly customer support voice assistant for Acme Inc, an online store.

You have tools to look up orders, start returns, and check product availability. USE THEM - do not make up info.


IMPORTANT - SPEECH-TO-TEXT:
Users speak their order number, so transcripts contain spoken words not digits.
Order IDs look like "ORD-" followed by 4 digits (e.g. ORD-9831, ORD-8916).
Convert spoken numbers to digits and prepend "ORD-" before calling tools:
- "nine eight three one" or "ninety-eight thirty-one" → "ORD-9831"
- "eight nine one six" → "ORD-8916"
If the user only says digits without "ORD", still format as "ORD-XXXX".

Keep responses SHORT and conversational. After tool results, summarize naturally.
Don't read out full addresses or long lists - give the key info.
Do not return Markdown or code blocks in your responses.\`;

// ─── Voice Agent ─────────────────────────────────────────────────────────

const BaseVoiceAgent = withVoice(Agent);

export class VoiceAgent extends BaseVoiceAgent<Env> {
  transcriber = new WorkersAIFluxSTT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  async onCallStart() {
    for (const connection of this.getConnections()) {
      await this.speak(
        connection,
        "Hi there! Welcome to Acme support. I can help you track an order, start a return, or check if a product is in stock. What can I do for you?",
      );
    }
  }

  async onTurn(transcript: string, context: VoiceTurnContext) {
    console.log(\`[onTurn] "\${transcript}"\`);

    const ai = createWorkersAI({ binding: this.env.AI });

    const { text, steps } = await generateText({
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
      stopWhen: stepCountIs(5),
    });

    for (const step of steps) {
      for (const tc of step.toolCalls) {
        console.log(\`[TOOL] \${tc.toolName}(\${JSON.stringify(tc.input)})\`);
      }
      for (const tr of step.toolResults) {
        console.log(
          \`[RESULT] \${tr.toolName} →\`,
          JSON.stringify(tr.output),
        );
      }
    }
    console.log(\`[RESPONSE] "\${text}"\`);

    return text || "Sorry, I couldn't process that. Could you try again?";
  }
}

// ─── Worker Entry ────────────────────────────────────────────────────────

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
        content: "What's new in this final version",
      },
      {
        type: "list",
        items: [
          "tools: ecomTools - passes the three tools to generateText so the LLM can call them",
          "stopWhen: stepCountIs(5) - caps tool-call iterations at 5 to prevent runaway loops",
          "The LLM can chain tools: look up an order, then start a return, in a single conversation turn",
          "Tool call and result logging - watch the terminal for [TOOL] and [RESULT] logs during testing",
          "Greeting updated to mention all three capabilities so users know what to ask",
        ],
      },
    ],
  },

  // ── 13: Build the React Client ────────────────────────────────────────────
  {
    title: "Step 8 - Build the React Client",
    subtitle: "The useVoiceAgent hook - the entire client API",
    blocks: [
      {
        type: "heading",
        content: "index.html",
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
        content: "The useVoiceAgent hook",
      },
      {
        type: "text",
        content:
          'The @cloudflare/voice/react package gives us useVoiceAgent - a single hook that manages the entire client-side voice connection. It opens a WebSocket, streams audio, and gives us reactive state. Here is a minimal but functional App.tsx:',
      },
      {
        type: "code",
        language: "tsx",
        filename: "src/App.tsx",
        content: `import { useVoiceAgent } from "@cloudflare/voice/react";

function App() {
  const {
    status,            // "idle" | "listening" | "thinking" | "speaking"
    transcript,        // Array of { role: "user"|"agent", text: string }
    interimTranscript, // Partial text while user is still speaking
    audioLevel,        // 0-1 mic volume (for visualizations)
    isMuted,           // Whether the mic is muted
    startCall,         // Function to start the voice call
    endCall,           // Function to hang up
    toggleMute,        // Function to toggle mic mute
  } = useVoiceAgent({ agent: "VoiceAgent" });

  const isActive = status !== "idle";

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Cloudflare Voice Agent</h1>

      {/* Call / Hang up button */}
      <button
        onClick={isActive ? endCall : startCall}
        className={\`px-6 py-3 rounded-full text-white font-medium \${
          isActive
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }\`}
      >
        {isActive ? "Hang up" : "Start Call"}
      </button>

      {/* Status */}
      {isActive && (
        <p className="text-sm text-neutral-500">
          Status: <span className="font-medium">{status}</span>
        </p>
      )}

      {/* Transcript */}
      <div className="w-full max-w-md space-y-2">
        {transcript.map((msg, i) => (
          <div
            key={i}
            className={\`flex \${
              msg.role === "user" ? "justify-end" : "justify-start"
            }\`}
          >
            <span
              className={\`rounded-2xl px-4 py-2 text-sm \${
                msg.role === "user"
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-200 text-neutral-800"
              }\`}
            >
              {msg.text}
            </span>
          </div>
        ))}

        {interimTranscript && (
          <div className="flex justify-end">
            <span className="rounded-2xl bg-orange-500/60 px-4 py-2 text-sm italic text-white">
              {interimTranscript}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;`,
      },
      {
        type: "heading",
        content: "Key points",
      },
      {
        type: "list",
        items: [
          'useVoiceAgent({ agent: "VoiceAgent" }) - the agent name must match the exported class name in worker/index.ts',
          "The hook auto-converts PascalCase to kebab-case for the WebSocket URL: VoiceAgent → /agents/voice-agent/default",
          "status cycles: idle → listening → thinking → speaking → listening (this is all you need for UI state)",
          "transcript is an array of finalized messages from both user and agent",
          "interimTranscript shows what the STT model is hearing in real-time before the utterance is finalized",
          "audioLevel (0-1) is great for building mic volume visualizers",
        ],
      },
    ],
  },

  // ── 14: Run and Test ──────────────────────────────────────────────────────
  {
    title: "Step 9 - Run and Test",
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
          '"What\'s the status of order ORD-9831?" - triggers lookup_order tool',
          '"I\'d like to return order ORD-8916, it was damaged" - triggers request_return tool',
          '"Do you have wireless headphones in stock?" - triggers check_product_availability tool',
        ],
      },
      {
        type: "heading",
        content: "What to look for",
      },
      {
        type: "list",
        items: [
          "The agent greets you when the call starts (onCallStart)",
          "Interim transcripts appear in real-time as you speak",
          "The status changes: Listening → Thinking → Speaking",
          "Final transcripts appear as solid message bubbles",
          "Watch the terminal for [TOOL] and [RESULT] logs showing tool calls in action",
        ],
      },
      {
        type: "note",
        content:
          "Even in local dev, the AI binding hits remote Cloudflare APIs. You need valid Cloudflare auth (wrangler login) and will incur usage - but Workers AI has a generous free tier.",
      },
    ],
  },

  // ── 15: Deploy ────────────────────────────────────────────────────────────
  {
    title: "Step 10 - Deploy to Cloudflare",
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
          "Single WebSocket - all audio and messages flow over one connection",
          "Continuous STT - audio streams continuously; the model decides when the user is done speaking",
          "Conversation persistence - context.messages is backed by SQLite; history survives reconnections",
          "Interruption support - if the user speaks while the agent is responding, context.signal aborts the LLM",
        ],
      },
    ],
  },

  // ── 16: Bonus ─────────────────────────────────────────────────────────────
  {
    title: "Bonus: Pipeline Hooks & Third-Party Providers",
    subtitle: "Extend the voice pipeline",
    blocks: [
      {
        type: "heading",
        content: "Pipeline hooks - intercept and transform data",
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

  // ── 17: Resources & Links ──────────────────────────────────────────────────
  {
    title: "Thank You!",
    subtitle: "Resources & Links",
    blocks: [
      {
        type: "resources",
        qrUrl: "https://voice-agent.fayaz.workers.dev/#/workshop/18",
        links: [
          {
            label: "GitHub Codebase",
            url: "https://github.com/fayazara/voice-agents-workshop",
            icon: "github",
          },
          {
            label: "Live Demo",
            url: "https://voice-agent.fayaz.workers.dev",
            icon: "globe",
          },
          {
            label: "Voice Agents Documentation",
            url: "https://developers.cloudflare.com/agents/api-reference/voice/",
            icon: "doc",
          },
          {
            label: "Blog: Voice Agents",
            url: "https://blog.cloudflare.com/voice-agents/",
            icon: "doc",
          },
          {
            label: "github.com/fayazara",
            url: "https://github.com/fayazara",
            icon: "github",
          },
          {
            label: "x.com/fayazara",
            url: "https://x.com/fayazara",
            icon: "twitter",
          },
          {
            label: "LinkedIn",
            url: "https://www.linkedin.com/in/fayaz-aralikatti/",
            icon: "linkedin",
          },
        ],
      },
    ],
  },
];
