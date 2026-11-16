"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui";

export type AtsAnalysis = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  recommendations: string[];
};

type ResumeSource = {
  kind: string;
  resumeName?: string;
};

type Props = {
  leadId: string;
  initialScore?: number | null;
  initialAnalysis?: AtsAnalysis | null;
  onScored?: (score: number, analysis: AtsAnalysis) => void;
};

function scoreColor(score: number) {
  if (score >= 75) return "text-[var(--accent)]";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-[var(--danger)]";
}

function ScoreRing({ score, compact }: { score: number; compact?: boolean }) {
  const color = scoreColor(score);
  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--panel-muted)] px-3 py-1 font-[family-name:var(--font-display)] text-lg font-bold tabular-nums ${color}`}
      >
        {score}
        <span className="ml-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          /100
        </span>
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] px-6 py-4">
      <p
        className={`font-[family-name:var(--font-display)] text-5xl font-bold tabular-nums ${color}`}
      >
        {score}
      </p>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        ATS match / 100
      </p>
    </div>
  );
}

function PillList({ items, variant }: { items: string[]; variant: "match" | "gap" }) {
  if (!items.length) return <p className="text-sm text-[var(--ink-muted)]">—</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
            variant === "match"
              ? "bg-[var(--accent-soft)] text-[var(--accent)] ring-[var(--accent)]/25"
              : "bg-[var(--panel-muted)] text-[var(--ink-muted)] ring-[var(--line)]"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function sourceLabel(source: ResumeSource | null) {
  if (!source) return "Primary resume";
  if (source.kind === "primary" && source.resumeName) {
    return `Primary resume: ${source.resumeName}`;
  }
  if (source.resumeName) return `Resume: ${source.resumeName}`;
  if (source.kind === "master-profile") return "Master profile (no saved resume snapshot)";
  return "Primary resume";
}

export function UpworkAtsCard({
  leadId,
  initialScore = null,
  initialAnalysis = null,
  onScored,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [source, setSource] = useState<ResumeSource | null>(null);
  const [ats, setAts] = useState<AtsAnalysis | null>(initialAnalysis);
  const [score, setScore] = useState<number | null>(initialScore);
  const [expanded, setExpanded] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setMeta(null);
    try {
      const res = await fetch(`/api/upwork/leads/${leadId}/ats`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ATS failed");
      setAts(data.analysis);
      setScore(data.lead?.atsScore ?? data.analysis?.score ?? null);
      setSource(data.resumeSource ?? null);
      setMeta(`Scored with ${data.provider} (${data.model}) · ${data.mode} mode`);
      setExpanded(true);
      onScored?.(data.analysis.score, data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ATS failed");
    } finally {
      setLoading(false);
    }
  };

  const displayScore = score ?? ats?.score ?? null;
  const hasDetails = displayScore != null && ats;
  const gapPreview = hasDetails ? ats.missingKeywords.slice(0, 4) : [];

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
      <AtsCardHeader
        hasDetails={Boolean(hasDetails)}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        displayScore={displayScore}
        loading={loading}
        onRun={run}
        gapPreview={gapPreview}
      />

      {error ? (
        <p className="border-t border-[var(--line)] px-4 py-2 text-sm text-[var(--danger)] sm:px-6">
          {error}
        </p>
      ) : null}

      {hasDetails && expanded ? (
        <div className="border-t border-[var(--line)] p-4 sm:p-6">
          {meta ? (
            <p className="mb-4 text-xs text-[var(--ink-muted)]">
              {sourceLabel(source)} · {meta}
            </p>
          ) : (
            <p className="mb-4 text-xs text-[var(--ink-muted)]">
              Uses your{" "}
              <Link href="/resumes" className="font-semibold text-[var(--accent)] hover:underline">
                primary resume
              </Link>
              .
            </p>
          )}
          <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <ScoreRing score={displayScore} />
            <div className="min-w-0 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">Where you excel</h3>
                {ats.strengths.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
                    {ats.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2">
                    <PillList items={ats.matchedKeywords.slice(0, 12)} variant="match" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">Gaps for this role</h3>
                <div className="mt-2">
                  <PillList items={ats.missingKeywords} variant="gap" />
                </div>
              </div>
              {ats.matchedKeywords.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Matched keywords</h3>
                  <div className="mt-2">
                    <PillList items={ats.matchedKeywords} variant="match" />
                  </div>
                </div>
              ) : null}
              {ats.recommendations.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Suggestions</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
                    {ats.recommendations.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : !hasDetails ? (
        <p className="border-t border-[var(--line)] px-4 py-4 text-sm text-[var(--ink-muted)] sm:px-6">
          Set a primary resume under Resumes (needs a saved version from Builder), then run ATS score.
        </p>
      ) : null}
    </section>
  );
}

function AtsCardHeader({
  hasDetails,
  expanded,
  onToggle,
  displayScore,
  loading,
  onRun,
  gapPreview,
}: {
  hasDetails: boolean;
  expanded: boolean;
  onToggle: () => void;
  displayScore: number | null;
  loading: boolean;
  onRun: () => void;
  gapPreview: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 sm:gap-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {hasDetails ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              aria-expanded={expanded}
            >
              <span
                className={`shrink-0 text-[var(--ink-muted)] transition-transform ${expanded ? "rotate-90" : ""}`}
                aria-hidden
              >
                ▶
              </span>
              <h2 className="text-base font-semibold text-[var(--ink)] sm:text-lg">
                ATS score vs this job
              </h2>
            </button>
          ) : (
            <h2 className="text-base font-semibold text-[var(--ink)] sm:text-lg">
              ATS score vs this job
            </h2>
          )}
          {hasDetails && displayScore != null ? <ScoreRing score={displayScore} compact /> : null}
        </div>
        {hasDetails && !expanded && gapPreview.length ? (
          <p className="mt-1 truncate pl-6 text-xs text-[var(--ink-muted)] sm:pl-7">
            Top gaps: {gapPreview.join(", ")}
            {gapPreview.length >= 4 ? "…" : ""}
          </p>
        ) : !hasDetails ? (
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">
            Compares your{" "}
            <Link href="/resumes" className="font-semibold text-[var(--accent)] hover:underline">
              primary resume
            </Link>{" "}
            to this posting.
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {hasDetails ? (
          <Button variant="secondary" onClick={onToggle}>
            {expanded ? "Hide details" : "Show details"}
          </Button>
        ) : null}
        <Button variant="primary" onClick={onRun} disabled={loading}>
          {loading ? "Scoring…" : displayScore != null ? "Re-run" : "Run ATS score"}
        </Button>
      </div>
    </div>
  );
}