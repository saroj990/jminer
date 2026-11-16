"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UpworkActivityCard } from "@/components/upwork-activity-card";
import { UpworkAtsCard } from "@/components/upwork-ats-card";
import { UpworkClientCard } from "@/components/upwork-client-card";
import { UpworkScorePanel } from "@/components/upwork-score-panel";
import { Button } from "@/components/ui";
import type { AtsAnalysis } from "@/components/upwork-ats-card";
import type { UpworkAnalysis } from "@/types/upwork-lead";

type LeadDetail = {
  id: string;
  title: string;
  jobUrl: string;
  postedAtText: string;
  description: string;
  techStack: string[];
  connectsRequired: number | null;
  hourlyRateText: string;
  durationText: string;
  experienceLevel: string;
  projectType: string;
  clientName: string;
  clientInfo: Record<string, unknown>;
  activity: Record<string, unknown>;
  engagementScore: number | null;
  genuinenessScore: number | null;
  atsScore: number | null;
  atsAnalysis: AtsAnalysis | null;
  analysis: UpworkAnalysis | null;
  analyzedAt: string | null;
  notes: string;
  status: string;
};

export default function UpworkLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [meta, setMeta] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/upwork/leads/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const lead = data.lead;
        setLead({
          ...lead,
          atsAnalysis: lead.atsAnalysis as AtsAnalysis | null,
        });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setMeta(null);
    try {
      const res = await fetch(`/api/upwork/leads/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setLead(data.lead);
      setMeta(`Scored with ${data.provider} (${data.model}) · ${data.mode} mode`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/upwork/leads/${id}`, { method: "DELETE" });
    router.push("/upwork");
  };

  if (error && !lead) {
    return (
      <AppShell>
        <p className="text-[var(--danger)]">{error}</p>
        <Link href="/upwork" className="mt-4 inline-block text-[var(--accent)]">
          ← Back to list
        </Link>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell>
        <p className="text-[var(--ink-muted)]">Loading…</p>
      </AppShell>
    );
  }

  const a = lead.analysis;

  return (
    <AppShell>
      <Link href="/upwork" className="text-sm font-semibold text-[var(--accent)]">
        ← Upwork leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            {lead.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {lead.clientName} · Posted {lead.postedAtText || "—"} · {lead.connectsRequired ?? "?"}{" "}
            Connects
          </p>
          {lead.jobUrl ? (
            <a
              href={lead.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm text-[var(--accent)]"
            >
              Open job link
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? "Scoring…" : lead.analyzedAt ? "Re-run AI scores" : "Run AI scores"}
          </Button>
          <Button variant="secondary" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {meta ? <p className="mt-2 text-xs text-[var(--ink-muted)]">{meta}</p> : null}
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}

      <UpworkScorePanel
        lead={{
          description: lead.description,
          connectsRequired: lead.connectsRequired,
          clientInfo: lead.clientInfo,
          activity: lead.activity,
          engagementScore: lead.engagementScore,
          genuinenessScore: lead.genuinenessScore,
        }}
        analysis={a}
        analyzedAt={lead.analyzedAt}
      />

      <div className="mt-6">
        <UpworkAtsCard
          leadId={lead.id}
          initialScore={lead.atsScore}
          initialAnalysis={lead.atsAnalysis}
          onScored={(score, analysis) =>
            setLead((prev) =>
              prev
                ? {
                    ...prev,
                    atsScore: Math.round(score),
                    atsAnalysis: analysis,
                  }
                : prev,
            )
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Job details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-[var(--ink-muted)]">Rate</dt>
              <dd>{lead.hourlyRateText || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Duration</dt>
              <dd>{lead.durationText || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Experience</dt>
              <dd>{lead.experienceLevel || "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-muted)]">Project type</dt>
              <dd>{lead.projectType || "—"}</dd>
            </div>
          </dl>
          <h3 className="mt-4 text-sm font-semibold text-[var(--ink)]">Tech stack</h3>
          {lead.techStack.length ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {lead.techStack.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-[var(--panel-muted)] px-2.5 py-1 text-xs font-medium text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-[var(--ink-soft)]">—</p>
          )}
          <h3 className="mt-4 text-sm font-semibold text-[var(--ink)]">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
            {lead.description || "—"}
          </p>
        </section>

        <section className="space-y-6">
          <UpworkClientCard clientName={lead.clientName} clientInfo={lead.clientInfo} />
          <UpworkActivityCard activity={lead.activity} />
        </section>
      </div>
    </AppShell>
  );
}