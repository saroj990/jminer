import { NextResponse } from "next/server";

type OllamaTags = {
  models?: Array<{ name?: string; model?: string }>;
};

/**
 * Open health check for local (Ollama) and online AI configuration.
 * Used by the import dialog when "With AI" is selected.
 */
export async function GET() {
  const base = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(
    /\/$/,
    "",
  );
  const configuredModel = process.env.OLLAMA_MODEL || "llama3.2";

  const online = {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    cerebras: Boolean(process.env.CEREBRAS_API_KEY?.trim()),
    groq: Boolean(process.env.GROQ_API_KEY?.trim()),
  };
  const onlineReady = online.gemini || online.cerebras || online.groq;

  let ollama: {
    ok: boolean;
    baseUrl: string;
    configuredModel: string;
    modelFound: boolean;
    models: string[];
    latencyMs: number | null;
    error: string | null;
  } = {
    ok: false,
    baseUrl: base,
    configuredModel,
    modelFound: false,
    models: [],
    latencyMs: null,
    error: null,
  };

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${base}/api/tags`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      ollama = {
        ...ollama,
        latencyMs,
        error: `Ollama responded with HTTP ${res.status}`,
      };
    } else {
      const data = (await res.json()) as OllamaTags;
      const models = (data.models ?? [])
        .map((m) => m.name || m.model || "")
        .filter(Boolean);
      const modelFound = models.some((name) => {
        if (name === configuredModel) return true;
        // Accept tag variants like "llama3.1:8b-instruct-q4_0" when configured is "llama3.1:8b"
        if (name.startsWith(`${configuredModel}-`) || name.startsWith(`${configuredModel}:`)) {
          return true;
        }
        return false;
      });
      ollama = {
        ok: true,
        baseUrl: base,
        configuredModel,
        modelFound,
        models,
        latencyMs,
        error: modelFound
          ? null
          : `Connected, but model "${configuredModel}" was not found. Run: ollama pull ${configuredModel}`,
      };
    }
  } catch (err) {
    ollama = {
      ...ollama,
      latencyMs: Date.now() - started,
      error:
        err instanceof Error
          ? err.name === "AbortError"
            ? "Ollama timed out. Is it running?"
            : `Cannot reach Ollama (${err.message})`
          : "Cannot reach Ollama",
    };
  }

  return NextResponse.json({
    ollama,
    online: {
      ready: onlineReady,
      providers: online,
    },
    checkedAt: new Date().toISOString(),
  });
}
