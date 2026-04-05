const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1:8b";

type OllamaChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function ollamaChat(
  messages: OllamaChatMessage[],
  options?: { format?: "json"; temperature?: number }
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: options?.temperature ?? 0.6 },
      ...(options?.format === "json" ? { format: "json" } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text || res.statusText}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const content = data.message?.content;
  if (!content) throw new Error("Ollama returned empty response");
  return content.trim();
}
