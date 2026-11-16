"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, TextArea, TextField } from "@/components/ui";
import { isUsableJobUrl } from "@/lib/upwork-posted-at";
import {
  APPLICATION_STATUS_LABELS,
  JOB_SOURCE_LABELS,
  jobApplicationSourceSchema,
  jobApplicationStatusSchema,
} from "@/types/job-application";
import type { z } from "zod";

type ApplicationRow = {
  id: string;
  title: string;
  jobSource: string;
  jobUrl: string;
  status: string;
  appliedAt: string | null;
  skillFitScore: number | null;
  atsScore: number | null;
};

type JobSource = z.infer<typeof jobApplicationSourceSchema>;
type JobStatus = z.infer<typeof jobApplicationStatusSchema>;

const sources = jobApplicationSourceSchema.options;

function parseTechInput(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ApplicationsPage() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [jobSource, setJobSource] = useState<JobSource>("other");
  const [jobUrl, setJobUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStackText, setTechStackText] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/applications")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setRows(data.applications))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle("");
    setJobSource("other");
    setJobUrl("");
    setDescription("");
    setTechStackText("");
  };

  const submit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          jobSource,
          jobUrl: jobUrl.trim() || undefined,
          description: description.trim(),
          techStack: parseTechInput(techStackText),
          status: "draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const labelSource = (s: string) =>
    s in JOB_SOURCE_LABELS ? JOB_SOURCE_LABELS[s as JobSource] : s;
  const labelStatus = (s: string) =>
    s in APPLICATION_STATUS_LABELS ? APPLICATION_STATUS_LABELS[s as JobStatus] : s;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Pipeline
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            Job applications
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
            Track roles you apply to, compare skills and resume fit against each job description.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add application"}
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      {showForm ? (
        <section className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--ink)]">New application</h2>
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
            <TextField
              label="Job URL"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://… or leave blank"
              className="sm:col-span-2"
            />
            <TextArea
              label="Job description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="sm:col-span-2"
            />
            <TextArea
              label="Tech stack"
              hint="Comma- or line-separated skills"
              value={techStackText}
              onChange={(e) => setTechStackText(e.target.value)}
              rows={3}
              className="sm:col-span-2"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save application"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel-muted)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied</th>
                <th className="px-4 py-3">Skills</th>
                <th className="px-4 py-3">ATS</th>
                <th className="px-4 py-3">URL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-[var(--ink-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-[var(--ink-muted)]">
                    No applications yet. Add one above.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--line)] transition hover:bg-[var(--panel-muted)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/applications/${row.id}`}
                        className="font-semibold text-[var(--accent)] hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{labelSource(row.jobSource)}</td>
                    <td className="px-4 py-3">{labelStatus(row.status)}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {row.appliedAt
                        ? new Date(row.appliedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.skillFitScore ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{row.atsScore ?? "—"}</td>
                    <td className="px-4 py-3">
                      {isUsableJobUrl(row.jobUrl) ? (
                        <a
                          href={row.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}