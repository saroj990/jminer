"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, TextField } from "@/components/ui";
import { TEMPLATES } from "@/lib/templates";

type ResumeRow = {
  id: string;
  name: string;
  template: string;
  updatedAt: string;
  versions: Array<{ id: string; exportType: string; createdAt: string }>;
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("classic");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetch("/api/resumes")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load resumes");
        return res.json();
      })
      .then((data) => setResumes(data.resumes))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this resume?")) return;
    await fetch("/api/resumes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          Library
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
          Resumes
        </h1>
      </div>

      <section className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <h2 className="font-semibold text-[var(--ink)]">Create resume</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <TextField
            label="Name"
            placeholder="Google Backend Resume"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Template
            </span>
            <select
              className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button variant="primary" onClick={create} disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
      </section>

      <div className="grid gap-4">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
          >
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                {resume.name}
              </h3>
              <p className="text-sm text-[var(--ink-muted)]">
                Template: {resume.template} · Updated{" "}
                {new Date(resume.updatedAt).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                Versions: {resume.versions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/builder?resumeId=${resume.id}`}>
                <Button variant="primary">Open</Button>
              </Link>
              <Button onClick={() => remove(resume.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {resumes.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No resumes yet. Create your first one.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
