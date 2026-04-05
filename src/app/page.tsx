"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DestinationChat } from "@/components/DestinationChat";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const goPreferences = () => {
    const d = destination.trim();
    if (!d) return;
    router.push(`/preferences?destination=${encodeURIComponent(d)}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0a0e12_55%)]">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Step 1</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink md:text-5xl">
            Where are you headed?
          </h1>
          <p className="mt-3 text-ink-muted">
            Search a city or region, or chat with the planner if you are still deciding.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="dest" className="mb-1 block text-xs font-medium text-ink-muted">
              Destination
            </label>
            <input
              id="dest"
              className="w-full rounded-xl border border-surface-muted bg-surface-raised px-4 py-3 text-ink outline-none placeholder:text-ink-muted focus:border-accent"
              placeholder="e.g. Lisbon, Kyoto, Patagonia…"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goPreferences()}
            />
          </div>
          <button
            type="button"
            onClick={goPreferences}
            disabled={!destination.trim()}
            className="rounded-xl bg-accent px-6 py-3 font-medium text-surface hover:bg-accent-dim disabled:opacity-40"
          >
            Continue
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-surface-muted" />
          <span className="text-xs text-ink-muted">or</span>
          <div className="h-px flex-1 bg-surface-muted" />
        </div>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="rounded-xl border border-surface-muted bg-surface-raised px-6 py-4 text-left transition hover:border-accent/40 hover:bg-surface-muted"
        >
          <span className="font-display text-lg font-semibold text-ink">Not sure yet</span>
          <p className="mt-1 text-sm text-ink-muted">
            Answer a few quick questions; when you lock in a place, continue straight to
            preferences from the chat.
          </p>
        </button>

        <p className="text-xs text-ink-muted">
          Local AI uses{" "}
          <a href="https://ollama.com/" className="text-accent underline" target="_blank" rel="noreferrer">
            Ollama
          </a>{" "}
          (default model <code className="rounded bg-surface-muted px-1">llama3.1:8b</code>).
          Start Ollama before using chat or generating plans.
        </p>
      </main>

      <DestinationChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
