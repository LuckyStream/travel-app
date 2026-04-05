"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TRIP_DAYS, type ChatMessage } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Carried to preferences when the user continues from chat. */
  tripDays?: number;
};

const INTRO_TEXT =
  "Not sure where to go? Tell me in a sentence or two what kind of trip you want (pace, climate, budget feel), and I will narrow it down.";

export function DestinationChat({ open, onClose, tripDays = DEFAULT_TRIP_DAYS }: Props) {
  const router = useRouter();
  /** Transcript for API: user/assistant only (no static intro). */
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setThread([]);
    setError(null);
    setInput("");
    setLoading(false);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, open, loading, error]);

  const lastConfirmed = [...thread]
    .reverse()
    .find((m) => m.role === "assistant" && m.confirmedDestination)?.confirmedDestination;
  const destinationLocked = Boolean(lastConfirmed);
  const continueLabel = lastConfirmed ? `Continue with ${lastConfirmed}` : null;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || destinationLocked) return;
    setError(null);
    setInput("");
    const nextThread: ChatMessage[] = [...thread, { role: "user", content: text }];
    setThread(nextThread);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextThread }),
      });
      const data = (await res.json()) as {
        message?: string;
        confirmedDestination?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const reply = data.message?.trim();
      if (!reply) throw new Error("Empty reply");
      const confirmed =
        typeof data.confirmedDestination === "string" && data.confirmedDestination.trim()
          ? data.confirmedDestination.trim()
          : null;
      setThread((t) => [
        ...t,
        { role: "assistant", content: reply, confirmedDestination: confirmed },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setThread((t) => t.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [input, loading, thread, destinationLocked]);

  const onContinue = () => {
    if (!lastConfirmed) return;
    router.push(
      `/preferences?destination=${encodeURIComponent(lastConfirmed)}&days=${tripDays}`
    );
    onClose();
  };

  const startOver = () => {
    setThread([]);
    setError(null);
    setInput("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="flex max-h-[min(560px,85vh)] w-full max-w-lg flex-col rounded-2xl border border-surface-muted bg-surface-raised shadow-xl"
        role="dialog"
        aria-labelledby="chat-title"
      >
        <div className="flex items-center justify-between border-b border-surface-muted px-4 py-3">
          <h2 id="chat-title" className="font-display text-lg font-semibold text-ink">
            Explore destinations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-surface-muted px-3 py-2 text-sm leading-relaxed text-ink">
              <p className="whitespace-pre-wrap">{INTRO_TEXT}</p>
            </div>
          </div>

          {thread.map((msg, i) => (
            <div
              key={`${msg.role}-${i}-${msg.content.slice(0, 12)}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent/20 text-ink"
                    : "bg-surface-muted text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {destinationLocked && continueLabel && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onContinue}
                className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-surface hover:bg-accent-dim"
              >
                {continueLabel}
              </button>
            </div>
          )}

          {destinationLocked && (
            <p className="text-center">
              <button
                type="button"
                onClick={startOver}
                className="text-xs text-ink-muted underline hover:text-accent"
              >
                Start over with a different place
              </button>
            </p>
          )}

          {loading && (
            <p className="text-center text-sm text-ink-muted">Thinking…</p>
          )}
          {error && (
            <p className="text-center text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          className={`flex gap-2 border-t border-surface-muted p-3 ${
            destinationLocked ? "opacity-50" : ""
          }`}
        >
          <input
            className="flex-1 rounded-xl border border-surface-muted bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent disabled:cursor-not-allowed"
            placeholder={
              destinationLocked ? "Destination confirmed — use Continue above" : "Type your answer…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
            disabled={loading || destinationLocked}
            aria-label="Chat message"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim() || destinationLocked}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent-dim disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
