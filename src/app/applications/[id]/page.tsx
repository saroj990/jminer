"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApplicationAtsCard } from "@/components/application-ats-card";
import { ApplicationSkillFitCard } from "@/components/application-skill-fit-card";
import { AppShell } from "@/components/app-shell";
import { Button, TextArea, TextField } from "@/components/ui";
import type { AtsAnalysis } from "@/components/upwork-ats-card";
import { isUsableJobUrl } from "@/lib/upwork-posted-at";
import {
  APPLICATION_STATUS_LABELS,
  JOB_SOURCE_LABELS,
  jobApplicationSourceSchema,
  jobApplicationStatusSchema,
  type SkillFitAnalysis,
} from "@/types/job-application";
import type { z } from "zod";

type JobSource = z.infer<typeof jobApplicationSourceSchema>;
type JobStatus = z.infer<typeof jobApplicationStatusSchema>;

type ApplicationDetail = {
  id: string;
  title: string;
  description: string;
  jobUrl: string;
  jobSource: string;
  techStack: string[];
  status: string;
  appliedAt: string | null;
  notes: string;
  skillFitScore: number | null;
  skillFit: SkillFitAnalysis | null;
  atsScore: number | null;
  atsAnalysis: AtsAnalysis | null;
};

const sources = jobApplicationSourceSchema.options;
const statuses = jobApplicationStatusSchema.options;

function parseTechInput(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [jobSource, setJobSource] = useState<JobSource>("other");
  const [jobUrl, setJobUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStackText, setTechStackText] = useState("");
  const [status, setStatus] = useState<JobStatus>("draft");
  const [appliedAt, setAppliedAt] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/applications/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const a = data.application as ApplicationDetail;
        setApp({
          ...a,
          skillFit: a.skillFit as SkillFitAnalysis | null,
          atsAnalysis: a.atsAnalysis as AtsAnalysis | null,
        });
        setTitle(a.title);
        setJobSource(a.jobSource as JobSource);
        setJobUrl(a.jobUrl === "N/A" ? "" : a.jobUrl);
        setDescription(a.description);
        setTechStackText(a.techStack?.join(", ") ?? "");
        setStatus(a.status as JobStatus);
        setAppliedAt(a.appliedAt ? a.appliedAt.slice(0, 10) : "");
        setNotes(a.notes);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          jobSource,
          jobUrl: jobUrl.trim() || undefined,
          description: description.trim(),
          techStack: parseTechInput(techStackText),
          status,
          appliedAt: appliedAt ? new Date(`${appliedAt}T12:00:00`).toISOString() : null,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setApp({
        ...data.application,
        skillFit: data.application.skillFit,
        atsAnalysis: data.application.atsAnalysis,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.push("/applications");
  };

  if (error && !app) {
    return (
      <AppShell>
        <p className="text-[var(--danger)]">{error}</p>
        <Link href="/applications" className="mt-4 inline-block text-[var(--accent)]">
          ← Back
        </Link>
      </AppShell>
    );
  }

  if (!app) {
    return (
      <AppShell>
        <p className="text-[var(--ink-muted)]">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/applications" className="text-sm font-semibold text-[var(--accent)]">
        ← Job applications
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            {app.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            {JOB_SOURCE_LABELS[jobSource]} · {APPLICATION_STATUS_LABELS[status]}
            {isUsableJobUrl(app.jobUrl) ? (
              <>
                {" "}
                ·{" "}
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:underline"
                >
                  Job link
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button variant="secondary" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mt-6 space-y-6">
        <ApplicationSkillFitCard
          applicationId={app.id}
          initialScore={app.skillFitScore}
          initialAnalysis={app.skillFit}
          onScored={(score, analysis) =>
            setApp((prev) =>
              prev ? { ...prev, skillFitScore: Math.round(score), skillFit: analysis } : prev,
            )
          }
        />
        <ApplicationAtsCard
          applicationId={app.id}
          initialScore={app.atsScore}
          initialAnalysis={app.atsAnalysis}
          onScored={(score, analysis) =>
            setApp((prev) =>
              prev ? { ...prev, atsScore: Math.round(score), atsAnalysis: analysis } : prev,
            )
          }
        />
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Source
            </span>
            <select
              value={jobSource}
              onChange={(e) => setJobSource(e.target.value as JobSource)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {JOB_SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {APPLICATION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Applied date"
            type="date"
            value={appliedAt}
            onChange={(e) => setAppliedAt(e.target.value)}
          />
          <TextField
            label="Job URL"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            className="sm:col-span-2"
          />
          <TextArea
            label="Job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="sm:col-span-2"
          />
          <TextArea
            label="Tech stack"
            value={techStackText}
            onChange={(e) => setTechStackText(e.target.value)}
            rows={3}
            className="sm:col-span-2"
          />
          <TextArea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="sm:col-span-2"
          />
        </div>
      </section>
    </AppShell>
  );
}