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

export function ImportResumeDialog({ open, onClose, onLoaded }: Props) {
  const { status } = useSession();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "existing">("upload");
  const [parseMode, setParseMode] = useState<ParseMode>("local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFileName(null);
    setBusy(false);
  }, [open]);

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

  if (!open) return null;

  const handleFile = async (file: File | null) => {
    if (!file) return;

    setBusy(true);
    setError(null);
    setFileName(file.name);

    try {
      // Text extraction stays in the browser. The File object is never uploaded or stored.
      const text = await extractResumeText(file);
      if (text.length < 40) {
        throw new Error("That file did not contain enough readable text.");
      }

      if (parseMode === "local") {
        const parsed = parseResumeTextLocal(text);
        const resume = parsedPayloadToResumeData(parsed);
        onLoaded(resume, `Imported locally from ${file.name}`);
        onClose();
        return;
      }

      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");

      const resume = parsedPayloadToResumeData(data.parsed);
      onLoaded(resume, `Imported with AI from ${file.name}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import resume");
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
                        : "border-[var(--line)] bg-white"
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
                        : "border-[var(--line)] bg-white"
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

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--panel-muted)] px-4 py-10 text-center transition hover:border-[var(--accent)] hover:bg-white">
                <span className="text-sm font-semibold text-[var(--ink)]">
                  {busy
                    ? parseMode === "ai"
                      ? "Extracting & structuring with AI…"
                      : "Extracting locally…"
                    : fileName
                      ? fileName
                      : "Choose PDF or DOCX"}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  File stays on this device and is discarded after parsing.
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    void handleFile(file);
                  }}
                />
              </label>
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
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5"
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
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
