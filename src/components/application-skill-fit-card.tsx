"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { SkillFitAnalysis } from "@/types/job-application";

type Props = {
  applicationId: string;
  initialScore?: number | null;
  initialAnalysis?: SkillFitAnalysis | null;
  onScored?: (score: number, analysis: SkillFitAnalysis) => void;
};

export function ApplicationSkillFitCard({
  applicationId,
  initialScore = null,
  initialAnalysis = null,
  onScored,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [fit, setFit] = useState<SkillFitAnalysis | null>(initialAnalysis);
  const [score, setScore] = useState<number | null>(initialScore);
  const [expanded, setExpanded] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setMeta(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/skills`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Skill fit failed");
      const analysis = data.analysis as SkillFitAnalysis;
      setFit(analysis);
      setScore(data.application?.skillFitScore ?? analysis.score ?? null);
      setMeta(`Scored with ${data.provider} (${data.model}) · ${data.mode} mode`);
      setExpanded(true);
      onScored?.(analysis.score, analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill fit failed");
    } finally {
      setLoading(false);
    }
  };

  const displayScore = score ?? fit?.score ?? null;

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            disabled={displayScore == null}
            onClick={() => displayScore != null && setExpanded((v) => !v)}
            className="flex items-center gap-2 text-left"
          >
            {displayScore != null ? (
              <span className="text-[var(--ink-muted)]" aria-hidden>
                {expanded ? "▾" : "▶"}
              </span>
            ) : null}
            <h2 className="text-base font-semibold text-[var(--ink)] sm:text-lg">
              Skill fit vs job
            </h2>
            {displayScore != null ? (
              <span className="rounded-full bg-[var(--panel-muted)] px-2.5 py-0.5 text-sm font-bold tabular-nums text-[var(--accent)]">
                {displayScore}/100
              </span>
            ) : null}
          </button>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            LLM compares skills on your{" "}
            <Link href="/resumes" className="font-semibold text-[var(--accent)] hover:underline">
              primary resume
            </Link>{" "}
            to this JD.
          </p>
        </div>
        <div className="flex gap-2">
          {displayScore != null ? (
            <Button variant="secondary" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide" : "Details"}
            </Button>
          ) : null}
          <Button variant="primary" onClick={run} disabled={loading}>
            {loading ? "Scoring…" : displayScore != null ? "Re-run" : "Run skill fit"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="border-t border-[var(--line)] px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {meta ? (
        <p className="border-t border-[var(--line)] px-4 py-1 text-xs text-[var(--ink-muted)]">
          {meta}
        </p>
      ) : null}

      {expanded && fit ? (
        <div className="border-t border-[var(--line)] p-4 sm:p-6">
          <p className="text-sm text-[var(--ink-soft)]">{fit.summary}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Block title="Matched skills" items={fit.matchedSkills} variant="match" />
            <Block title="Missing skills" items={fit.missingSkills} variant="gap" />
            <Block title="Strong areas" items={fit.strongAreas} variant="match" list />
            <Block title="Gaps" items={fit.gaps} variant="gap" list />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Block({
  title,
  items,
  variant,
  list,
}: {
  title: string;
  items: string[];
  variant: "match" | "gap";
  list?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
      {items.length ? (
        list ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
            {items.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {items.map((x) => (
              <li
                key={x}
                className={`rounded-full px-2 py-1 text-xs ring-1 ${
                  variant === "match"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] ring-[var(--accent)]/25"
                    : "bg-[var(--panel-muted)] text-[var(--ink-muted)] ring-[var(--line)]"
                }`}
              >
                {x}
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="mt-1 text-sm text-[var(--ink-muted)]">—</p>
      )}
    </div>
  );
}
