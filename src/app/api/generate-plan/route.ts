import { NextResponse } from "next/server";
import { enrichItemCoordinates } from "@/lib/geocode";
import {
  fetchVerifiedPlacesForDestination,
  formatVerifiedPlacesForPrompt,
  GOOGLE_NEARBY_MAX_RADIUS_METERS,
  useRegionalSearchRadius,
} from "@/lib/google-places";
import { normalizeItinerary } from "@/lib/itinerary-schema";
import { parseJsonLoose } from "@/lib/json-utils";
import { ollamaChat } from "@/lib/ollama";
import type { ItineraryItem, TripPreferences } from "@/lib/types";
import { fetchDestinationSummary } from "@/lib/wikipedia";

const PLAN_SYSTEM = `You are an expert travel planner. Output **only valid JSON** — no markdown, no code fences, no explanation.

Return exactly **3** day objects. You may use EITHER:
A) A top-level JSON **array** of 3 objects, OR
B) A JSON object with a key "days" whose value is that array.

Each day object must have:
- "day": integer 1, 2, or 3
- These **exact snake_case keys** (each value is an object):
  - "morning_destination": sightseeing / attraction / park (not a meal).
  - "lunch": **restaurant or café**.
  - "afternoon_destination": place to visit.
  - "dinner": **restaurant**.
  - "evening_activity": optional — omit the key or use null if none; otherwise bar, night market, show, etc.

Each slot object MUST have:
  - "name": string — must match a **verified place** from the user message when you use that venue (exact name).
  - "description": string — **include the Google rating and review count** in the prose (e.g. "4.6★, 1,240 reviews") plus a short useful line (cuisine, vibe, or what to see).
  - "lat": number (WGS84)
  - "lng": number (WGS84)
  - "rating": number (1–5, from the verified list for that place)
  - "reviewCount": integer (non‑negative, from the verified list)

**Choose from the following verified places only.** Do **not** invent new locations, coordinates, ratings, or review counts. Use only entries supplied under "Verified places" in the user message. If nothing fits a slot perfectly, pick the closest real option from the same list.

**Group activities geographically by day.** Each day's morning visit, lunch, afternoon visit, dinner, and optional evening stop should be **physically close** to each other to minimize travel time. **Do not** mix far-apart parts of the region on the same day.`;

function buildUserPrompt(
  prefs: TripPreferences,
  wiki: string | null,
  verifiedPlacesText: string,
  regionalNatureHint: boolean
): string {
  const wikiBlock = wiki ? `\nDestination context (Wikipedia):\n${wiki}\n` : "";
  const kmApprox = Math.round(GOOGLE_NEARBY_MAX_RADIUS_METERS / 1000);
  const regionalBlock = regionalNatureHint
    ? `\nRegional / outdoor coverage: The user selected **nature, adventure, and/or relaxation**. For those interests, include **nearby natural attractions** that could reasonably be reached within about **one hour's driving time** from the city — not only dense city-center spots. Verified place searches for those themes used up to **~${kmApprox} km** from the destination center (Google Places API limit).\n`
    : `\nUrban coverage: Shopping, dining, nightlife, and most history venues use a **~15 km** search radius from the destination center.\n`;

  return `Plan a 3-day trip.

Destination: ${prefs.destination}
Budget: ${prefs.budget}
Interests: ${prefs.interests.join(", ") || "general"}
Dining preferences: ${prefs.dining.join(", ") || "any"}
Priority order (highest first): ${prefs.priorityOrder.join(" > ")}
${wikiBlock}
${regionalBlock}
### Verified places (Google Places — select and arrange ONLY from this list; copy exact names, lat, lng, rating, and reviewCount)
${verifiedPlacesText}

Respect budget and priorities. Build three logical days with geographically clustered stops per day.`;
}

async function generatePlanJson(
  prefs: TripPreferences,
  wiki: string | null,
  verifiedPlacesText: string,
  regionalNatureHint: boolean
): Promise<string> {
  return ollamaChat(
    [
      { role: "system", content: PLAN_SYSTEM },
      {
        role: "user",
        content: buildUserPrompt(prefs, wiki, verifiedPlacesText, regionalNatureHint),
      },
    ],
    { format: "json", temperature: 0.45 }
  );
}

export async function POST(req: Request) {
  try {
    const prefs = (await req.json()) as TripPreferences;
    if (!prefs?.destination?.trim()) {
      return NextResponse.json({ error: "destination required" }, { status: 400 });
    }

    const dest = prefs.destination.trim();
    const placesKey = process.env.GOOGLE_PLACES_API_KEY?.trim() ?? "";

    let verifiedPlacesText: string;
    if (placesKey) {
      try {
        const candidates = await fetchVerifiedPlacesForDestination(
          dest,
          prefs.interests,
          prefs.dining,
          placesKey
        );
        verifiedPlacesText = formatVerifiedPlacesForPrompt(candidates);
      } catch (e) {
        verifiedPlacesText = `(Google Places request failed: ${e instanceof Error ? e.message : "unknown error"}. Use conservative, well-known real venues only and plausible coordinates near ${dest}.)`;
      }
    } else {
      verifiedPlacesText =
        "(No GOOGLE_PLACES_API_KEY — no verified list. Prefer widely known real venues near the destination with realistic coordinates, ratings, and review counts if you must infer.)";
    }

    const regionalNatureHint = useRegionalSearchRadius(prefs.interests);
    const wiki = await fetchDestinationSummary(dest);

    let parsed: unknown;
    try {
      const rawJson = await generatePlanJson(prefs, wiki, verifiedPlacesText, regionalNatureHint);
      parsed = parseJsonLoose(rawJson);
    } catch {
      try {
        const rawJson = await generatePlanJson(prefs, wiki, verifiedPlacesText, regionalNatureHint);
        parsed = parseJsonLoose(rawJson);
      } catch {
        return NextResponse.json(
          { error: "Could not parse LLM response as JSON. Try again or use a model with strong JSON mode." },
          { status: 502 }
        );
      }
    }

    let items: ItineraryItem[] = normalizeItinerary(parsed, dest);

    if (!items.length) {
      return NextResponse.json(
        { error: "Itinerary structure was invalid. Try generating again." },
        { status: 502 }
      );
    }

    const forGeo = items.map((it) => ({
      name: it.name,
      lat: it.lat,
      lng: it.lng,
      destinationHint: dest,
    }));
    await enrichItemCoordinates(forGeo);
    items = items.map((it, i) => ({
      ...it,
      lat: forGeo[i].lat,
      lng: forGeo[i].lng,
    }));

    return NextResponse.json({ items, preferences: prefs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Plan generation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
