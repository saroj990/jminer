export type AIMode = "online" | "local";

export type AIProviderId = "gemini" | "cerebras" | "groq" | "ollama";

export type AIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIGenerateResult = {
  text: string;
  provider: AIProviderId;
  model: string;
};

export class AIProviderError extends Error {
  provider: AIProviderId;
  constructor(provider: AIProviderId, message: string) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
  }
}

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? JSON.stringify((data as { error: unknown }).error)
        : raw || res.statusText;
    throw new Error(message);
  }
  return data as Record<string, unknown>;
}

export async function generateWithGemini(
  messages: AIChatMessage[],
): Promise<AIGenerateResult> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AIProviderError("gemini", "GEMINI_API_KEY is not set");

  const model = "gemini-2.0-flash";
  const system = messages.find((m) => m.role === "system")?.content;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  try {
    const data = await postJson(
      url,
      {
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: { temperature: 0.4 },
      },
      {},
    );
    const candidates = data.candidates as
      | Array<{ content?: { parts?: Array<{ text?: string }> } }>
      | undefined;
    const text = candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("Empty response from Gemini");
    return { text, provider: "gemini", model };
  } catch (err) {
    throw new AIProviderError(
      "gemini",
      err instanceof Error ? err.message : "Gemini request failed",
    );
  }
}

async function openAiCompatibleChat(options: {
  provider: AIProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: AIChatMessage[];
}): Promise<AIGenerateResult> {
  const { provider, baseUrl, apiKey, model, messages } = options;
  try {
    const data = await postJson(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.4,
      },
      { Authorization: `Bearer ${apiKey}` },
    );
    const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
    const text = choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error(`Empty response from ${provider}`);
    return { text, provider, model };
  } catch (err) {
    throw new AIProviderError(
      provider,
      err instanceof Error ? err.message : `${provider} request failed`,
    );
  }
}

export async function generateWithCerebras(
  messages: AIChatMessage[],
): Promise<AIGenerateResult> {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  if (!key) throw new AIProviderError("cerebras", "CEREBRAS_API_KEY is not set");

  return openAiCompatibleChat({
    provider: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: key,
    model: "llama-3.3-70b",
    messages,
  });
}

export async function generateWithGroq(
  messages: AIChatMessage[],
): Promise<AIGenerateResult> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new AIProviderError("groq", "GROQ_API_KEY is not set");

  return openAiCompatibleChat({
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey: key,
    model: "llama-3.3-70b-versatile",
    messages,
  });
}

export async function generateWithOllama(
  messages: AIChatMessage[],
): Promise<AIGenerateResult> {
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(
    /\/$/,
    "",
  );
  const model = process.env.OLLAMA_MODEL || "llama3.2";

  try {
    const data = await postJson(
      `${base}/api/chat`,
      {
        model,
        messages,
        stream: false,
        options: { temperature: 0.4 },
      },
      {},
    );
    const message = data.message as { content?: string } | undefined;
    const text = message?.content ?? "";
    if (!text.trim()) throw new Error("Empty response from Ollama");
    return { text, provider: "ollama", model };
  } catch (err) {
    throw new AIProviderError(
      "ollama",
      err instanceof Error
        ? `Ollama failed (${err.message}). Is Ollama running at ${base}?`
        : "Ollama request failed",
    );
  }
}

export type AIAttempt = {
  provider: AIProviderId;
  ok: boolean;
  error?: string;
};

/**
 * Online: Gemini Flash → Cerebras → Groq
 * Local: Ollama only
 */
export async function generateWithFallback(
  mode: AIMode,
  messages: AIChatMessage[],
): Promise<AIGenerateResult & { attempts: AIAttempt[] }> {
  const attempts: AIAttempt[] = [];

  const chain: Array<() => Promise<AIGenerateResult>> =
    mode === "local"
      ? [() => generateWithOllama(messages)]
      : [
          () => generateWithGemini(messages),
          () => generateWithCerebras(messages),
          () => generateWithGroq(messages),
        ];

  for (const run of chain) {
    try {
      const result = await run();
      attempts.push({ provider: result.provider, ok: true });
      return { ...result, attempts };
    } catch (err) {
      const provider: AIProviderId =
        err instanceof AIProviderError ? err.provider : "gemini";
      const error = err instanceof Error ? err.message : "Unknown error";
      attempts.push({
        provider,
        ok: false,
        error,
      });
    }
  }

  const detail = attempts
    .map((a) => `${a.provider}: ${a.error ?? "failed"}`)
    .join(" | ");
  throw new Error(
    mode === "local"
      ? `Local AI failed. ${detail}`
      : `All online AI providers failed. ${detail}`,
  );
}

export function getConfiguredProviders(mode: AIMode): AIProviderId[] {
  if (mode === "local") return ["ollama"];
  const list: AIProviderId[] = [];
  if (process.env.GEMINI_API_KEY?.trim()) list.push("gemini");
  if (process.env.CEREBRAS_API_KEY?.trim()) list.push("cerebras");
  if (process.env.GROQ_API_KEY?.trim()) list.push("groq");
  return list;
}
