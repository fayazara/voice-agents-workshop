import { Agent, routeAgentRequest } from "agents";
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

// ─── CRM API client ─────────────────────────────────────────────────────────

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

async function fetchOrderByNumber(orderNumber: string): Promise<Order | null> {
  // Search by order number (e.g. "ORD-9831")
  const url = `${CRM_API_BASE}/orders?search=${encodeURIComponent(orderNumber)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as Paginated<Order>;
  // Prefer exact match on orderNumber
  const exact = body.data.find(
    (o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase(),
  );
  return exact ?? body.data[0] ?? null;
}

// ─── Tool execute functions (standalone so we can call them manually) ────────

async function lookupOrder(orderId: string) {
  const normalized = orderId.toUpperCase().trim();
  try {
    const order = await fetchOrderByNumber(normalized);
    if (!order) {
      return { found: false, message: `No order found with ID ${normalized}.` };
    }
    return {
      found: true,
      id: order.orderNumber,
      status: order.status,
      items: order.items.map(
        (i) => `${i.quantity}x ${i.productName} ($${i.price})`,
      ),
      total: order.total.toFixed(2),
      shipping_address: order.shippingAddress,
      created_at: order.createdAt,
    };
  } catch (err) {
    console.error("[lookupOrder] error", err);
    return {
      found: false,
      message: `Could not reach the orders service right now.`,
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
        message: `No order found with ID ${normalized}.`,
      };
    }
    if (order.status !== "delivered") {
      return {
        success: false,
        message: `Order ${normalized} cannot be returned - status is "${order.status}".`,
      };
    }
    const returnId = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
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
      message: `Could not reach the orders service right now.`,
    };
  }
}

async function checkProduct(productName: string) {
  const query = productName.trim();
  try {
    const url = `${CRM_API_BASE}/products?search=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url);
    if (!res.ok) {
      return {
        found: false,
        message: `No product found matching "${productName}".`,
      };
    }
    const body = (await res.json()) as Paginated<Product>;
    const p = body.data[0];
    if (!p) {
      return {
        found: false,
        message: `No product found matching "${productName}".`,
      };
    }
    return {
      found: true,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: `$${p.price}`,
      in_stock: p.stock > 0,
      stock_count: p.stock,
    };
  } catch (err) {
    console.error("[checkProduct] error", err);
    return {
      found: false,
      message: `Could not reach the products service right now.`,
    };
  }
}

// ─── Tools ───────────────────────────────────────────────────────────────────

const ecomTools = {
  lookup_order: tool({
    description:
      "Look up an order by its order ID (e.g. ORD-1024). Use when customer asks about order status, tracking, or delivery.",
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
};

// ─── Voice Agent ─────────────────────────────────────────────────────────────

const BaseVoiceAgent = withVoice(Agent);

const SYSTEM_PROMPT = `You are a friendly customer support voice assistant for Acme Inc, an online store.

You have tools to look up orders, start returns, and check product availability. USE THEM - do not make up info.


IMPORTANT - SPEECH-TO-TEXT:
Users speak their order number, so transcripts contain spoken words not digits.
Order IDs look like "ORD-" followed by 4 digits (e.g. ORD-9831, ORD-8916).
Convert spoken numbers to digits and prepend "ORD-" before calling tools:
- "nine eight three one" or "ninety-eight thirty-one" → "ORD-9831"
- "eight nine one six" → "ORD-8916"
If the user only says digits without "ORD", still format as "ORD-XXXX".

Keep responses SHORT and conversational. After tool results, summarize naturally. Don't read out full addresses or long lists - give the key info. Do not return Markdown or code blocks in your responses.`;

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
    console.log(`[onTurn] "${transcript}"`);

    const ai = createWorkersAI({ binding: this.env.AI });

    const { text, steps } = await generateText({
      // model: ai("@cf/moonshotai/kimi-k2.5"),
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
        console.log(`[TOOL] ${tc.toolName}(${JSON.stringify(tc.input)})`);
      }
      for (const tr of step.toolResults) {
        console.log(`[RESULT] ${tr.toolName} →`, JSON.stringify(tr.output));
      }
    }
    console.log(`[RESPONSE] "${text}"`);

    return text || "Sorry, I couldn't process that. Could you try again?";
  }
}

// ─── Worker entry ────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ??
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
