import { NextResponse } from "next/server";
import { parseJsonLoose } from "@/lib/json-utils";
import { ollamaChat } from "@/lib/ollama";
import type { ChatMessage } from "@/lib/types";

const SYSTEM = `You help users pick a travel destination. You must respond as **only** valid JSON (no markdown, no extra text) with this exact shape:
{"message": string, "confirmedDestination": string | null}

Rules:
- While the user has **not** clearly committed to one destination, set "confirmedDestination" to null.
- Ask **at most one** clear follow-up question in "message" when confirmedDestination is null. Keep "message" under 120 words. You may suggest 1–3 places as short bullet lines (use "-" lines) in "message".
- When the user **confirms** a place (names it directly, says "let's do X", picks one of your suggestions, or otherwise locks in a single trip target), set "confirmedDestination" to a **short, search-friendly** place name (e.g. "Lisbon" or "Kyoto, Japan"). In that same reply, "message" must **only** briefly celebrate the choice and tell them to use the Continue button — **do not** ask any follow-up questions.
- After you have set confirmedDestination non-null, if the user sends more text in this session, keep returning that **same** confirmedDestination and short acknowledgements only — still no new questions.

Plain text only inside the JSON strings; no markdown headings.`;

function extractChatPayload(raw: unknown): { message: string; confirmedDestination: string | null } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const cd = o.confirmedDestination;
  const confirmedDestination =
    cd === null || cd === undefined
      ? null
      : typeof cd === "string" && cd.trim()
        ? cd.trim()
        : null;
  if (!message) return null;
  return { message, confirmedDestination };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = body.messages?.filter(
      (m) => m.content?.trim() && (m.role === "user" || m.role === "assistant")
    );
    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const ollamaMessages = [
      { role: "system" as const, content: SYSTEM },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.trim(),
      })),
    ];

    const raw = await ollamaChat(ollamaMessages, { format: "json", temperature: 0.55 });
    let parsed: unknown;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      return NextResponse.json({ error: "Assistant returned invalid JSON. Try again." }, { status: 502 });
    }

    const payload = extractChatPayload(parsed);
    if (!payload) {
      return NextResponse.json({ error: "Assistant JSON missing message" }, { status: 502 });
    }

    return NextResponse.json({
      message: payload.message,
      confirmedDestination: payload.confirmedDestination,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
