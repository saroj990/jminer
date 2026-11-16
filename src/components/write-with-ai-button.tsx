"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import type { WriteFieldType } from "@/lib/ai/prompts";

type Props = {
  fieldType: WriteFieldType;
  value: string;
  onApply: (text: string) => void;
  context?: string;
};

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5l1.1 3.4L12.5 6 9.1 7.1 8 10.5 6.9 7.1 3.5 6l3.4-1.1L8 1.5z"
        fill="currentColor"
      />
      <path
        d="M12.5 9.5l.55 1.7 1.7.55-1.7.55-.55 1.7-.55-1.7-1.7-.55 1.7-.55.55-1.7z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export function WriteWithAiButton({ fieldType, value, onApply, context }: Props) {
  const { status } = useSession();
  const panelId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (status !== "authenticated") {
    return (
      <div className="flex justify-end">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-[var(--ink-muted)] transition hover:text-[var(--accent)]"
        >
          <SparkleIcon className="h-3 w-3" />
          Sign in for AI
        </Link>
      </div>
    );
  }

  const run = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setMeta(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldType,
          text: value,
          context: context || undefined,
          prompt: prompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Write with AI failed");
      setSuggestion(data.text);
      setMeta(
        data.provider
          ? `Draft from ${data.provider}${data.model ? ` · ${data.model}` : ""}`
          : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Write with AI failed");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!suggestion?.trim()) return;
    onApply(suggestion.trim());
    setOpen(false);
    setSuggestion(null);
    setPrompt("");
    setMeta(null);
    setError(null);
  };

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:col-span-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          aria-expanded={open}
          aria-controls={panelId}
          title="Write with AI"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.7rem] font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
        >
          <SparkleIcon className="h-3.5 w-3.5 shrink-0" />
          {open ? "Close AI" : "Write with AI"}
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Your prompt
            </span>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Make bullets more quantifiable, keep tech stack, tone senior engineer…"
              className="min-h-[4.5rem] w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              disabled={loading}
            />
          </label>
          <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
            Optional. Leave blank to rewrite from the current field text and context.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={run}
              disabled={loading || (!value.trim() && !prompt.trim() && !context?.trim())}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-55"
            >
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>

          {error ? (
            <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>
          ) : null}

          {suggestion ? (
            <div className="mt-3 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
              {meta ? (
                <p className="text-[0.65rem] font-medium text-[var(--ink-muted)]">
                  {meta}
                </p>
              ) : null}
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-[family-name:var(--font-body)] text-sm text-[var(--ink)]">
                {suggestion}
              </pre>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="h-8 rounded-lg px-3 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--panel-muted)]"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="h-8 rounded-lg bg-[var(--accent)] px-3 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Apply to field
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
