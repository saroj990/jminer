"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  buildScoreEvidence,
  type LeadEvidenceContext,
  type ScoreEvidenceItem,
} from "@/lib/upwork-score-evidence";
import type { UpworkAnalysis } from "@/types/upwork-lead";

type PanelKey = "engagement" | "genuineness" | "connects";

type Props = {
  lead: LeadEvidenceContext;
  analysis: UpworkAnalysis | null;
  analyzedAt: string | null;
};

function scoreTone(value: number | null): string {
  if (value == null) return "text-[var(--ink-muted)]";
  if (value >= 70) return "text-[var(--accent)]";
  if (value >= 45) return "text-amber-700 dark:text-amber-400";
  return "text-[var(--danger)]";
}

function creditTone(v?: string) {
  if (v === "yes") return "text-[var(--accent)]";
  if (v === "no") return "text-[var(--danger)]";
  return "text-amber-700 dark:text-amber-400";
}

function toneRing(tone: ScoreEvidenceItem["tone"]) {
  if (tone === "positive") return "ring-[var(--accent)]/25 bg-[var(--accent-soft)]/40";
  if (tone === "negative") return "ring-[var(--danger)]/25 bg-[var(--danger)]/5";
  return "ring-[var(--line)] bg-[var(--panel-muted)]";
}

function toneMark(tone: ScoreEvidenceItem["tone"]) {
  if (tone === "positive") return { sym: "+", cls: "text-[var(--accent)]" };
  if (tone === "negative") return { sym: "−", cls: "text-[var(--danger)]" };
  return { sym: "·", cls: "text-[var(--ink-muted)]" };
}

function EvidenceCardGrid({ items }: { items: ScoreEvidenceItem[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        Run AI scores to populate signals. Evidence comes from saved client, activity, and job fields.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((row) => {
        const mark = toneMark(row.tone);
        return (
          <li
            key={row.id}
            className={`flex min-h-[7.5rem] flex-col rounded-lg border border-[var(--line)] px-2.5 py-2 ring-1 ${toneRing(row.tone)}`}
          >
            <div className="flex items-center gap-1">
              <span className={`text-[0.65rem] font-bold ${mark.cls}`} aria-hidden>
                {mark.sym}
              </span>
              <p className="line-clamp-2 text-[0.7rem] font-semibold leading-snug text-[var(--ink)]">
                {row.headline}
              </p>
            </div>
            <p className="mt-1.5 line-clamp-4 flex-1 text-[0.65rem] leading-snug text-[var(--ink-soft)]">
              {row.evidence}
            </p>
            <p className="mt-1 text-[0.55rem] uppercase tracking-wide text-[var(--ink-muted)]">
              {row.source}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function SignalCardGrid({
  items,
  variant,
}: {
  items: string[];
  variant: "signal" | "risk";
}) {
  if (!items.length) return null;
  const ring =
    variant === "signal"
      ? "ring-[var(--accent)]/20 bg-[var(--accent-soft)]"
      : "ring-[var(--danger)]/25 bg-[var(--danger)]/8";
  const text = variant === "signal" ? "text-[var(--ink-soft)]" : "text-[var(--danger)]";
  return (
    <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((x) => (
        <li
          key={x}
          className={`rounded-lg px-2 py-2 text-[0.7rem] leading-snug ring-1 ${ring} ${text}`}
        >
          <span className="line-clamp-4">{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function UpworkScorePanel({ lead, analysis, analyzedAt }: Props) {
  const [open, setOpen] = useState<PanelKey | null>(null);

  const evidence = useMemo(
    () => buildScoreEvidence(lead, analysis),
    [lead, analysis],
  );

  const toggle = (key: PanelKey) => {
    setOpen((prev) => (prev === key ? null : key));
  };

  const openItems =
    open === "engagement"
      ? evidence.engagement
      : open === "genuineness"
        ? evidence.genuineness
        : open === "connects"
          ? evidence.connects
          : [];

  const openTitle =
    open === "engagement"
      ? "Why this engagement index"
      : open === "genuineness"
        ? "Why this genuineness score"
        : open === "connects"
          ? "Is it worth the Connects?"
          : "";

  const openBlurb =
    open === "engagement"
      ? "Likelihood the client views, shortlists, and replies — from activity (views, proposals, interviews) and client hiring history."
      : open === "genuineness"
        ? "Trust that this is a real job — payment/phone verification, spend, reviews, and description quality from your import."
        : open === "connects"
          ? "Whether the Connects cost is justified given competition, both scores, and calibrated rules."
          : "";

  const connectsRequired = lead.connectsRequired;

  return (
    <section className="mt-6 space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Connects required">
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums text-[var(--ink)]">
            {connectsRequired ?? "—"}
          </p>
        </StatTile>

        <ScoreTile
          label="Engagement index"
          active={open === "engagement"}
          onClick={() => toggle("engagement")}
        >
          <p
            className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums ${scoreTone(lead.engagementScore)}`}
          >
            {lead.engagementScore ?? "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Tap for evidence</p>
        </ScoreTile>

        <ScoreTile
          label="Genuineness"
          active={open === "genuineness"}
          onClick={() => toggle("genuineness")}
        >
          <p
            className={`mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold tabular-nums ${scoreTone(lead.genuinenessScore)}`}
          >
            {lead.genuinenessScore ?? "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Tap for evidence</p>
        </ScoreTile>

        <ScoreTile
          label="Worth the Connects?"
          active={open === "connects"}
          onClick={() => toggle("connects")}
        >
          <p
            className={`mt-1 text-lg font-semibold uppercase tracking-wide ${creditTone(analysis?.creditWorthIt)}`}
          >
            {analysis?.creditWorthIt ?? "Run analysis"}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Tap for evidence</p>
        </ScoreTile>
      </div>

      {open ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <h3 className="text-base font-semibold text-[var(--ink)]">{openTitle}</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">{openBlurb}</p>
          <div className="mt-4 max-h-[min(28rem,70vh)] overflow-y-auto pr-1">
            <EvidenceCardGrid items={openItems} />
          </div>
        </div>
      ) : null}

      {analysis ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="text-sm leading-relaxed text-[var(--ink)]">{analysis.summary}</p>

          <div className="mt-5 space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Engagement signals
              </h4>
              {analysis.engagementFactors.length ? (
                <SignalCardGrid items={analysis.engagementFactors} variant="signal" />
              ) : (
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  None listed — open the engagement tile for field evidence.
                </p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Risk flags
              </h4>
              {analysis.riskFlags.length ? (
                <SignalCardGrid items={analysis.riskFlags} variant="risk" />
              ) : (
                <p className="mt-2 text-sm text-[var(--ink-muted)]">No risks flagged on last run.</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-[var(--ink-muted)]">
            Recommend apply:{" "}
            <span className="font-semibold text-[var(--ink)]">
              {analysis.recommendApply ? "Yes" : "No"}
            </span>
            {analyzedAt ? ` · Last run ${new Date(analyzedAt).toLocaleString()}` : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">
          Run AI scores to see summary, signals, and evidence-backed breakdowns.
        </p>
      )}
    </section>
  );
}

function StatTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function ScoreTile({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-3 text-left transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/30"
          : "border-[var(--line)] bg-[var(--panel-muted)] hover:border-[var(--accent)]/40"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      aria-expanded={active}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
        {label}
      </p>
      {children}
    </button>
  );
}