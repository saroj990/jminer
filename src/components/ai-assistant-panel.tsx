"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, TextArea, TextField } from "@/components/ui";
import type { AIMode } from "@/lib/ai/providers";
import { useResumeStore } from "@/store/resume-store";

export function AiAssistantPanel() {
  const { status } = useSession();
  const setSummary = useResumeStore((s) => s.setSummary);
  const updateExperience = useResumeStore((s) => s.updateExperience);

  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [modeOverride, setModeOverride] = useState<AIMode | "default">("default");
  const [savedMode, setSavedMode] = useState<AIMode>("online");
  const [busy, setBusy] = useState<"tailor" | "ats" | "cover" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [ats, setAts] = useState<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    recommendations: string[];
  } | null>(null);
  const [coverLetter, setCoverLetter] = useState<{ subject: string; body: string } | null>(
    null,
  );
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/preferences")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.mode) setSavedMode(data.mode);
      })
      .catch(() => undefined);
  }, [status]);

  if (status !== "authenticated") {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          AI assistant
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Sign in to use AI resume tailoring, ATS scoring, and cover letters.
        </p>
      </section>
    );
  }

  const effectiveMode: AIMode =
    modeOverride === "default" ? savedMode : modeOverride;

  const run = async (kind: "tailor" | "ats" | "cover") => {
    setBusy(kind);
    setError(null);
    setMeta(null);
    try {
      const endpoint =
        kind === "tailor"
          ? "/api/ai/tailor"
          : kind === "ats"
            ? "/api/ai/ats"
            : "/api/ai/cover-letter";

      const resume = useResumeStore.getState().resume;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          resume,
          company: company || undefined,
          role: role || undefined,
          modeOverride: modeOverride === "default" ? undefined : modeOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      setMeta(
        `Used ${data.provider} (${data.model}) · mode: ${data.mode}` +
          (data.attempts?.length
            ? ` · attempts: ${data.attempts
                .map(
                  (a: { provider: string; ok: boolean }) =>
                    `${a.provider}${a.ok ? "✓" : "✗"}`,
                )
                .join(", ")}`
            : ""),
      );

      if (kind === "tailor" && data.tailored) {
        if (data.tailored.summary) setSummary(data.tailored.summary);
        for (const exp of data.tailored.experiences ?? []) {
          if (exp.id && exp.description) {
            updateExperience(exp.id, { description: exp.description });
          }
        }
        setNotes(data.tailored.notes ?? []);
      }
      if (kind === "ats") setAts(data.analysis);
      if (kind === "cover") setCoverLetter(data.letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            AI assistant
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Active mode: <strong>{effectiveMode}</strong>
            {effectiveMode === "online"
              ? " (Gemini → Cerebras → Groq)"
              : " (Ollama)"}
          </p>
        </div>
        <select
          className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
          value={modeOverride}
          onChange={(e) => setModeOverride(e.target.value as AIMode | "default")}
        >
          <option value="default">Use settings ({savedMode})</option>
          <option value="online">Force online</option>
          <option value="local">Force local</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <TextField
          label="Role (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <TextArea
          label="Job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          className="sm:col-span-2"
          rows={6}
          hint="Paste the full job post (min ~40 characters)"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={!!busy || jobDescription.trim().length < 40}
          onClick={() => run("tailor")}
        >
          {busy === "tailor" ? "Tailoring…" : "Tailor resume"}
        </Button>
        <Button
          disabled={!!busy || jobDescription.trim().length < 40}
          onClick={() => run("ats")}
        >
          {busy === "ats" ? "Scoring…" : "ATS score"}
        </Button>
        <Button
          disabled={!!busy || jobDescription.trim().length < 40}
          onClick={() => run("cover")}
        >
          {busy === "cover" ? "Writing…" : "Cover letter"}
        </Button>
      </div>

      {meta ? <p className="mt-3 text-xs text-[var(--ink-muted)]">{meta}</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}

      {notes.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {ats ? (
        <div className="mt-4 rounded-xl bg-[var(--panel-muted)] p-4">
          <p className="font-semibold text-[var(--ink)]">ATS score: {ats.score}/100</p>
          <p className="mt-2 text-sm">
            <strong>Matched:</strong> {ats.matchedKeywords.join(", ") || "—"}
          </p>
          <p className="mt-1 text-sm">
            <strong>Missing:</strong> {ats.missingKeywords.join(", ") || "—"}
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {ats.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {coverLetter ? (
        <div className="mt-4 rounded-xl bg-[var(--panel-muted)] p-4">
          <p className="font-semibold text-[var(--ink)]">{coverLetter.subject}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">
            {coverLetter.body}
          </p>
        </div>
      ) : null}
    </section>
  );
}
