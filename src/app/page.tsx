"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DestinationChat } from "@/components/DestinationChat";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_TRIP_DAYS, MAX_TRIP_DAYS, MIN_TRIP_DAYS } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [tripDays, setTripDays] = useState(DEFAULT_TRIP_DAYS);
  const [chatOpen, setChatOpen] = useState(false);

  const goPreferences = () => {
    const d = destination.trim();
    if (!d) return;
    router.push(
      `/preferences?destination=${encodeURIComponent(d)}&days=${tripDays}`
    );
  };

  const setDays = (n: number) =>
    setTripDays(Math.min(MAX_TRIP_DAYS, Math.max(MIN_TRIP_DAYS, n)));

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

        <div>
          <p className="text-xs font-medium text-ink-muted">Trip length</p>
          <p className="mt-1 text-sm text-ink-muted">How many days are you traveling?</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-surface-muted bg-surface-raised">
              <button
                type="button"
                aria-label="Fewer days"
                onClick={() => setDays(tripDays - 1)}
                disabled={tripDays <= MIN_TRIP_DAYS}
                className="rounded-l-xl px-4 py-2.5 text-lg font-medium text-ink hover:bg-surface-muted disabled:opacity-35"
              >
                −
              </button>
              <span className="min-w-[3rem] text-center font-display text-lg font-semibold tabular-nums text-ink">
                {tripDays}
              </span>
              <button
                type="button"
                aria-label="More days"
                onClick={() => setDays(tripDays + 1)}
                disabled={tripDays >= MAX_TRIP_DAYS}
                className="rounded-r-xl px-4 py-2.5 text-lg font-medium text-ink hover:bg-surface-muted disabled:opacity-35"
              >
                +
              </button>
            </div>
            <span className="text-sm text-ink-muted">
              {tripDays === 1 ? "day" : "days"} ({MIN_TRIP_DAYS}–{MAX_TRIP_DAYS})
            </span>
          </div>
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

      <DestinationChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        tripDays={tripDays}
      />
    </div>
  );
}
