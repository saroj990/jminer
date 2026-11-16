"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { extractResumeText } from "@/lib/extract-resume-text";
import { parseResumeTextLocal } from "@/lib/parse-resume-local";
import { parsedPayloadToResumeData } from "@/lib/parsed-resume";
import type { ResumeData } from "@/types/resume";

type ResumeRow = {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
  versions: Array<{
    id: string;
    label: string;
    exportType: string;
    createdAt: string;
    snapshot?: string;
  }>;
};

type ParseMode = "local" | "ai";
type AiProviderMode = "online" | "local";

type ProgressStep = "idle" | "extract" | "structure" | "apply" | "done";

type OllamaHealth = {
  ok: boolean;
  baseUrl: string;
  configuredModel: string;
  modelFound: boolean;
  models: string[];
  latencyMs: number | null;
  error: string | null;
};

type HealthResponse = {
  ollama: OllamaHealth;
  online: {
    ready: boolean;
    providers: { gemini: boolean; cerebras: boolean; groq: boolean };
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
  onLoaded: (resume: ResumeData, sourceLabel: string) => void;
};

function tryParseSnapshot(snapshot: string | undefined): ResumeData | null {
  if (!snapshot) return null;
  try {
    const data = JSON.parse(snapshot) as Partial<ResumeData> & {
      resume?: ResumeData;
    };
    const candidate = data.resume ?? data;
    if (
      candidate &&
      typeof candidate === "object" &&
      "personal" in candidate &&
      "experiences" in candidate
    ) {
      return candidate as ResumeData;
    }
  } catch {
    return null;
  }
  return null;
}

function stepIndex(step: ProgressStep) {
  if (step === "extract") return 0;
  if (step === "structure") return 1;
  if (step === "apply" || step === "done") return 2;
  return -1;
}

export function ImportResumeDialog({ open, onClose, onLoaded }: Props) {
  const { status } = useSession();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "existing">("upload");
  const [parseMode, setParseMode] = useState<ParseMode>("local");
  const [aiProviderMode, setAiProviderMode] = useState<AiProviderMode>("local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [statusLog, setStatusLog] = useState<string[]>([]);

  const pushStatus = (line: string) => {
    setStatusLog((prev) => [...prev.slice(-12), line]);
  };

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFileName(null);
    setBusy(false);
    setProgressStep("idle");
    setElapsedSec(0);
    setStatusLog([]);
  }, [open]);

  useEffect(() => {
    if (!open || status !== "authenticated") return;
    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.mode === "online" || data?.mode === "local") {
          setAiProviderMode(data.mode);
        }
      })
      .catch(() => undefined);
  }, [open, status]);

  useEffect(() => {
    if (!open || tab !== "existing" || status !== "authenticated") return;
    setLoadingList(true);
    fetch("/api/resumes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load resumes");
        return res.json();
      })
      .then((data) => setResumes(data.resumes ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load resumes"),
      )
      .finally(() => setLoadingList(false));
  }, [open, tab, status]);

  // Health-check Ollama as soon as "With AI" is selected (and when switching provider).
  useEffect(() => {
    if (!open || parseMode !== "ai") return;

    let cancelled = false;
    setHealthChecking(true);

    fetch("/api/ai/health", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Health check failed");
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            ollama: {
              ok: false,
              baseUrl: "http://127.0.0.1:11434",
              configuredModel: "unknown",
              modelFound: false,
              models: [],
              latencyMs: null,
              error: "Could not reach health endpoint",
            },
            online: {
              ready: false,
              providers: { gemini: false, cerebras: false, groq: false },
            },
          });
        }
      })
      .finally(() => {
        if (!cancelled) setHealthChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, parseMode, aiProviderMode]);

  // Elapsed timer while AI structuring is in progress
  useEffect(() => {
    if (!busy || progressStep !== "structure") return;
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [busy, progressStep]);

  if (!open) return null;

  const localConnected =
    Boolean(health?.ollama.ok) && Boolean(health?.ollama.modelFound);
  const localReachableButMissingModel =
    Boolean(health?.ollama.ok) && !health?.ollama.modelFound;
  const onlineReady = Boolean(health?.online.ready);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    if (parseMode === "ai" && aiProviderMode === "local" && !localConnected) {
      setError(
        health?.ollama.error ||
          "Local LLM is not reachable. Start Ollama and pull your model first.",
      );
      return;
    }
    if (parseMode === "ai" && aiProviderMode === "online" && !onlineReady) {
      setError(
        "No online AI keys configured. Set GEMINI_API_KEY / CEREBRAS_API_KEY / GROQ_API_KEY, or use Local (Ollama).",
      );
      return;
    }

    setBusy(true);
    setError(null);
    setFileName(file.name);
    setStatusLog([]);
    setProgressStep("extract");
    pushStatus(`Reading ${file.name}…`);

    try {
      const text = await extractResumeText(file);
      if (text.length < 40) {
        throw new Error("That file did not contain enough readable text.");
      }
      pushStatus(`Extracted ${text.length.toLocaleString()} characters.`);

      if (parseMode === "local") {
        setProgressStep("apply");
        pushStatus("Running local heuristic parse…");
        const parsed = parseResumeTextLocal(text);
        const resume = parsedPayloadToResumeData(parsed);
        setProgressStep("done");
        pushStatus("Filled editor with local extract (draft — not saved yet).");
        onLoaded(resume, `Imported locally from ${file.name}`);
        onClose();
        return;
      }

      setProgressStep("structure");
      pushStatus(
        aiProviderMode === "local"
          ? `Sending text to Ollama (${health?.ollama.configuredModel || "local model"})…`
          : "Sending text to online AI…",
      );
      pushStatus("Waiting for structured JSON (this can take 1–2 minutes)…");

      let res: Response;
      try {
        res = await fetch("/api/ai/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            modeOverride: aiProviderMode,
          }),
        });
      } catch (networkErr) {
        const raw =
          networkErr instanceof Error ? networkErr.message : "Network error";
        throw new Error(
          /^(Load failed|Failed to fetch|networkerror|The network connection was lost)/i.test(
            raw,
          )
            ? "Connection dropped while waiting for the model (often after 60s+). Keep this tab active and try again — or use Local extract / a smaller model (e.g. gemma2:2b)."
            : raw,
        );
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        parsed?: Parameters<typeof parsedPayloadToResumeData>[0];
        provider?: string;
        model?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Parse failed (HTTP ${res.status})`);
      }
      if (!data.parsed) {
        throw new Error(
          "AI returned no structured resume. Try again, or use Local extract.",
        );
      }

      pushStatus(
        `AI response received${data.provider ? ` from ${data.provider}` : ""}${
          data.model ? ` · ${data.model}` : ""
        }.`,
      );
      setProgressStep("apply");
      pushStatus("Mapping fields into the editor…");
      const resume = parsedPayloadToResumeData(data.parsed);
      setProgressStep("done");
      pushStatus("Done. Draft is in the editor — Save to profile when ready.");
      onLoaded(
        resume,
        `Imported with AI (${data.provider ?? aiProviderMode}) from ${file.name}`,
      );
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not import resume";
      pushStatus(`Failed: ${message}`);
      setError(message);
      setProgressStep("idle");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileName(null);
    }
  };

  const loadMasterProfile = async () => {
    if (status !== "authenticated") {
      setError("Sign in to load your master profile.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Load failed");
      onLoaded(data.resumeData, "Loaded from master profile");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setBusy(false);
    }
  };

  const loadVersion = (resumeName: string, snapshot: string | undefined) => {
    const parsed = tryParseSnapshot(snapshot);
    if (!parsed) {
      setError(
        "This saved version has no resume content snapshot. Use master profile instead.",
      );
      return;
    }
    onLoaded(parsed, `Loaded “${resumeName}”`);
    onClose();
  };

  const recheckHealth = () => {
    setHealth(null);
    setHealthChecking(true);
    fetch("/api/ai/health", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Health check failed");
        return res.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch(() =>
        setHealth({
          ollama: {
            ok: false,
            baseUrl: "http://127.0.0.1:11434",
            configuredModel: "unknown",
            modelFound: false,
            models: [],
            latencyMs: null,
            error: "Could not reach health endpoint",
          },
          online: {
            ready: false,
            providers: { gemini: false, cerebras: false, groq: false },
          },
        }),
      )
      .finally(() => setHealthChecking(false));
  };

  const progressPct =
    progressStep === "idle"
      ? 0
      : progressStep === "extract"
        ? 25
        : progressStep === "structure"
          ? Math.min(85, 40 + elapsedSec * 2)
          : progressStep === "apply"
            ? 95
            : 100;

  const steps =
    parseMode === "ai"
      ? [
          { id: "extract" as const, label: "Extract text" },
          {
            id: "structure" as const,
            label:
              aiProviderMode === "local"
                ? "Structure with Ollama"
                : "Structure with AI",
          },
          { id: "apply" as const, label: "Fill editor" },
        ]
      : [
          { id: "extract" as const, label: "Extract text" },
          { id: "apply" as const, label: "Fill editor" },
        ];

  const visualStepIndex = (step: ProgressStep) => {
    if (parseMode === "local") {
      if (step === "extract") return 0;
      if (step === "apply" || step === "done" || step === "structure") return 1;
      return -1;
    }
    return stepIndex(step);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--ink)_45%,transparent)] p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]"
            >
              Load resume
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              PDF/DOCX text is extracted in your browser. The file is never
              stored.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-[var(--ink-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--ink)]"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--line)] px-5 pt-3">
          <button
            type="button"
            className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
              tab === "upload"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setTab("upload")}
            disabled={busy}
          >
            Upload file
          </button>
          <button
            type="button"
            className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
              tab === "existing"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setTab("existing")}
            disabled={busy}
          >
            Existing
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {tab === "upload" ? (
            <>
              <fieldset className="space-y-2">
                <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Fill method
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-3 ${
                      parseMode === "local"
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--panel)]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                      <input
                        type="radio"
                        name="parse-mode"
                        checked={parseMode === "local"}
                        onChange={() => setParseMode("local")}
                        disabled={busy}
                      />
                      Local extract
                    </span>
                    <span className="pl-5 text-xs text-[var(--ink-muted)]">
                      Heuristic parse in your browser. No AI, works offline.
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-3 ${
                      parseMode === "ai"
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--line)] bg-[var(--panel)]"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                      <input
                        type="radio"
                        name="parse-mode"
                        checked={parseMode === "ai"}
                        onChange={() => setParseMode("ai")}
                        disabled={busy}
                      />
                      With AI
                    </span>
                    <span className="pl-5 text-xs text-[var(--ink-muted)]">
                      Sends extracted text only to structure fields more accurately.
                    </span>
                  </label>
                </div>
              </fieldset>

              {parseMode === "ai" ? (
                <>
                  <fieldset className="space-y-2">
                    <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                      AI provider
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-3 ${
                          aiProviderMode === "local"
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--panel)]"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <input
                            type="radio"
                            name="ai-provider"
                            checked={aiProviderMode === "local"}
                            onChange={() => setAiProviderMode("local")}
                            disabled={busy}
                          />
                          Local (Ollama)
                        </span>
                        <span className="pl-5 text-xs text-[var(--ink-muted)]">
                          Uses your local model. No cloud API keys needed.
                        </span>
                      </label>
                      <label
                        className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-3 ${
                          aiProviderMode === "online"
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--line)] bg-[var(--panel)]"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <input
                            type="radio"
                            name="ai-provider"
                            checked={aiProviderMode === "online"}
                            onChange={() => setAiProviderMode("online")}
                            disabled={busy}
                          />
                          Online
                        </span>
                        <span className="pl-5 text-xs text-[var(--ink-muted)]">
                          Gemini → Cerebras → Groq (requires API keys in `.env`).
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-3 py-3">
                    {healthChecking || !health ? (
                      <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--ink-muted)]" />
                        Checking{" "}
                        {aiProviderMode === "local" ? "local LLM" : "online AI"}…
                      </div>
                    ) : aiProviderMode === "local" ? (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              localConnected
                                ? "bg-emerald-500"
                                : localReachableButMissingModel
                                  ? "bg-amber-400"
                                  : "bg-red-500"
                            }`}
                            aria-hidden
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">
                              {localConnected
                                ? "Connected · OK"
                                : localReachableButMissingModel
                                  ? "Connected · model missing"
                                  : "Not connected"}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                              {localConnected
                                ? `${health.ollama.configuredModel}${
                                    health.ollama.latencyMs != null
                                      ? ` · ${health.ollama.latencyMs}ms`
                                      : ""
                                  }`
                                : health.ollama.error ||
                                  "Start Ollama and pull your model."}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline"
                          onClick={recheckHealth}
                          disabled={busy || healthChecking}
                        >
                          Recheck
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              onlineReady ? "bg-emerald-500" : "bg-red-500"
                            }`}
                            aria-hidden
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">
                              {onlineReady
                                ? "Online keys ready"
                                : "No online keys"}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                              {[
                                health.online.providers.gemini && "Gemini",
                                health.online.providers.cerebras && "Cerebras",
                                health.online.providers.groq && "Groq",
                              ]
                                .filter(Boolean)
                                .join(" · ") || "Add API keys in `.env`"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline"
                          onClick={recheckHealth}
                          disabled={busy || healthChecking}
                        >
                          Recheck
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {busy ? (
                <div className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {progressStep === "extract"
                        ? "Extracting text from file…"
                        : progressStep === "structure"
                          ? aiProviderMode === "local"
                            ? "Structuring with local LLM…"
                            : "Structuring with online AI…"
                          : "Filling the editor…"}
                    </p>
                    {progressStep === "structure" ? (
                      <span className="text-xs tabular-nums text-[var(--ink-muted)]">
                        {elapsedSec}s
                      </span>
                    ) : null}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <ol className="space-y-1.5">
                    {steps.map((step, index) => {
                      const current = visualStepIndex(progressStep);
                      const done = current > index;
                      const active = current === index;
                      return (
                        <li
                          key={step.id}
                          className={`flex items-center gap-2 text-xs ${
                            active
                              ? "font-semibold text-[var(--accent)]"
                              : done
                                ? "text-[var(--ink)]"
                                : "text-[var(--ink-muted)]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.65rem] ${
                              done
                                ? "bg-[var(--accent)] text-white"
                                : active
                                  ? "border border-[var(--accent)] text-[var(--accent)]"
                                  : "border border-[var(--line)]"
                            }`}
                          >
                            {done ? "✓" : index + 1}
                          </span>
                          {step.label}
                          {active && step.id === "structure" ? (
                            <span className="text-[var(--ink-muted)]">
                              (local models can take 1–2 min)
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                  {statusLog.length ? (
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                      <ul className="space-y-1">
                        {statusLog.map((line, index) => (
                          <li
                            key={`${index}-${line.slice(0, 24)}`}
                            className="text-xs leading-relaxed text-[var(--ink-soft)]"
                          >
                            <span className="mr-1.5 text-[var(--ink-muted)]">
                              {String(index + 1).padStart(2, "0")}.
                            </span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {fileName ? (
                    <p className="truncate text-xs text-[var(--ink-muted)]">
                      File: {fileName}
                    </p>
                  ) : null}
                </div>
              ) : (
                <label
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition ${
                    parseMode === "ai" &&
                    ((aiProviderMode === "local" && !localConnected) ||
                      (aiProviderMode === "online" && !onlineReady))
                      ? "cursor-not-allowed border-[var(--line)] bg-[var(--panel-muted)] opacity-60"
                      : "cursor-pointer border-[var(--line-strong)] bg-[var(--panel-muted)] hover:border-[var(--accent)] hover:bg-[var(--panel)]"
                  }`}
                >
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    Choose PDF or DOCX
                  </span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    File stays on this device and is discarded after parsing.
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    disabled={
                      busy ||
                      (parseMode === "ai" &&
                        ((aiProviderMode === "local" && !localConnected) ||
                          (aiProviderMode === "online" && !onlineReady)))
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      void handleFile(file);
                    }}
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <Button
                variant="primary"
                className="w-full"
                onClick={loadMasterProfile}
                disabled={busy || status !== "authenticated"}
              >
                {busy ? "Loading…" : "Load master profile"}
              </Button>

              <div>
                <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                  Saved resumes
                </p>
                {status !== "authenticated" ? (
                  <p className="text-sm text-[var(--ink-muted)]">
                    Sign in to see your resume library.
                  </p>
                ) : loadingList ? (
                  <p className="text-sm text-[var(--ink-muted)]">Loading…</p>
                ) : resumes.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">
                    No saved resumes yet. Create one from the Resumes page, or
                    load your master profile above.
                  </p>
                ) : (
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {resumes.map((resume) => {
                      const latest = resume.versions[0];
                      const hasSnapshot = Boolean(
                        tryParseSnapshot(latest?.snapshot),
                      );
                      return (
                        <li
                          key={resume.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--ink)]">
                              {resume.name}
                            </p>
                            <p className="truncate text-xs text-[var(--ink-muted)]">
                              {hasSnapshot
                                ? `Latest: ${latest.label || latest.exportType}`
                                : "No content snapshot — use master profile"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            className="shrink-0"
                            disabled={!hasSnapshot || busy}
                            onClick={() =>
                              loadVersion(resume.name, latest?.snapshot)
                            }
                          >
                            Load
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {error ? (
            <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
