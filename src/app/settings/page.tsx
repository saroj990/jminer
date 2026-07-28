"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import type { AIMode } from "@/lib/ai/providers";

type Prefs = {
  mode: AIMode;
  onlineProviders: string[];
  localProviders: string[];
  ollamaBaseUrl?: string;
  ollamaModel?: string;
};

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/preferences")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load settings");
        return res.json();
      })
      .then(setPrefs)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const setMode = async (aiMode: AIMode) => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setPrefs((prev) =>
        prev
          ? {
              ...prev,
              mode: data.mode,
              onlineProviders: data.onlineProviders,
              localProviders: data.localProviders,
            }
          : data,
      );
      setMessage(
        aiMode === "local"
          ? "AI mode set to Local (Ollama)."
          : "AI mode set to Online (Gemini → Cerebras → Groq).",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Preferences
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
          Settings
        </h1>
      </div>

      <section className="max-w-2xl rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          AI provider mode
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
          Toggle between online cloud providers and local Ollama. Online uses automatic
          fallback: Gemini Flash → Cerebras → Groq.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => setMode("online")}
            className={`rounded-xl border p-4 text-left transition ${
              prefs?.mode === "online"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            <p className="font-semibold text-[var(--ink)]">Online</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Gemini Flash → Cerebras → Groq
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Configured: {(prefs?.onlineProviders ?? []).join(", ") || "none (add API keys)"}
            </p>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => setMode("local")}
            className={`rounded-xl border p-4 text-left transition ${
              prefs?.mode === "local"
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            <p className="font-semibold text-[var(--ink)]">Local</p>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Ollama only ({prefs?.ollamaModel || "llama3.2"})
            </p>
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              {prefs?.ollamaBaseUrl || "http://127.0.0.1:11434"}
            </p>
          </button>
        </div>

        {message ? (
          <p className="mt-4 text-sm font-medium text-[var(--accent)]">{message}</p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

        <div className="mt-6 rounded-xl bg-[var(--panel-muted)] p-4 text-sm text-[var(--ink-soft)]">
          <p className="font-semibold text-[var(--ink)]">Setup tips</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Add keys in <code>.env</code>: GEMINI_API_KEY, CEREBRAS_API_KEY, GROQ_API_KEY</li>
            <li>
              For local mode: install Ollama, run <code>ollama pull llama3.2</code>, keep it running
            </li>
            <li>You can also override mode per AI request in the builder</li>
          </ul>
          <Button className="mt-3" onClick={load} disabled={saving}>
            Refresh status
          </Button>
        </div>
      </section>
    </AppShell>
  );
}
