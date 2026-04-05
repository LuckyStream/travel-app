/**
 * Lightweight destination context from Wikipedia REST API (no API key).
 */
export async function fetchDestinationSummary(destination: string): Promise<string | null> {
  const title = destination.trim();
  if (!title) return null;

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_")
  )}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { extract?: string; title?: string };
    if (!data.extract) return null;
    return `${data.title ?? title}: ${data.extract}`;
  } catch {
    return null;
  }
}
