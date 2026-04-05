/**
 * Strip markdown fences and parse JSON (some models still wrap output in ```json ... ```).
 */
export function parseJsonLoose(raw: string): unknown {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const i = t.indexOf("{");
  const j = t.indexOf("[");
  let start = 0;
  if (i === -1) start = j;
  else if (j === -1) start = i;
  else start = Math.min(i, j);
  if (start > 0) t = t.slice(start);
  return JSON.parse(t);
}
