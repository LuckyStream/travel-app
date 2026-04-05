export type Budget = "low" | "medium" | "high";

export type InterestTag =
  | "nature"
  | "history"
  | "food"
  | "shopping"
  | "nightlife"
  | "art"
  | "adventure"
  | "relaxation";

export type DiningTag =
  | "local cuisine"
  | "trendy spots"
  | "vegetarian friendly"
  | "street food";

export type PriorityKey = "sightseeing" | "food" | "shopping" | "relaxation";

/** Canonical JSON keys from /api/generate-plan (snake_case). */
export type TimeSlot =
  | "morning_destination"
  | "lunch"
  | "afternoon_destination"
  | "dinner"
  | "evening_activity";

/** Display / sort order within each day. */
export const TIME_SLOT_ORDER: readonly TimeSlot[] = [
  "morning_destination",
  "lunch",
  "afternoon_destination",
  "dinner",
  "evening_activity",
] as const;

/** Sort index for a slot id (handles legacy saved trips from older versions). */
export function timeSlotOrderIndex(slot: string): number {
  const legacy: Record<string, TimeSlot> = {
    morning: "morning_destination",
    afternoon: "afternoon_destination",
    evening: "evening_activity",
  };
  const canonical = legacy[slot] ?? (slot as TimeSlot);
  const i = (TIME_SLOT_ORDER as readonly string[]).indexOf(canonical);
  return i === -1 ? 999 : i;
}

export type ItineraryItem = {
  id: string;
  day: number;
  timeSlot: TimeSlot;
  name: string;
  description: string;
  lat: number;
  lng: number;
  /** Google-style 1–5 rating when sourced from verified places / LLM. */
  rating?: number | null;
  reviewCount?: number | null;
};

export type TripPreferences = {
  destination: string;
  budget: Budget;
  interests: InterestTag[];
  dining: DiningTag[];
  priorityOrder: PriorityKey[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** Present on assistant turns when the model locked in a destination (see /api/chat JSON). */
  confirmedDestination?: string | null;
};
