const USER_AGENT = "TravelRecommendationApp/1.0 (contact: local-dev)";

export async function geocodePlace(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    q
  )}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!data?.length) return null;
    const lat = parseFloat(data[0].lat ?? "");
    const lng = parseFloat(data[0].lon ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function enrichItemCoordinates(
  items: { name: string; lat: number; lng: number; destinationHint: string }[]
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const needsFix = it.lat === 0 && it.lng === 0;
    if (!needsFix) continue;
    const query = `${it.name}, ${it.destinationHint}`;
    const coords = await geocodePlace(query);
    if (coords) {
      it.lat = coords.lat;
      it.lng = coords.lng;
    }
    if (i < items.length - 1) {
      await new Promise((r) => setTimeout(r, 1100));
    }
  }
}
