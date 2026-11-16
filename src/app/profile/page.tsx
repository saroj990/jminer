"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, TextArea, TextField } from "@/components/ui";

type ProfileForm = {
  fullName: string;
  headline: string;
  summary: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  github: string;
  linkedin: string;
  portfolio: string;
};

const empty: ProfileForm = {
  fullName: "",
  headline: "",
  summary: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  github: "",
  linkedin: "",
  portfolio: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(empty);
  const [counts, setCounts] = useState({
    experiences: 0,
    education: 0,
    projects: 0,
    skills: 0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        const p = data.profile;
        setForm({
          fullName: p.fullName ?? "",
          headline: p.headline ?? "",
          summary: p.summary ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          address: p.address ?? "",
          website: p.website ?? "",
          github: p.github ?? "",
          linkedin: p.linkedin ?? "",
          portfolio: p.portfolio ?? "",
        });
        setCounts({
          experiences: p.experiences?.length ?? 0,
          education: p.education?.length ?? 0,
          projects: p.projects?.length ?? 0,
          skills: p.skills?.length ?? 0,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage("Master profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ProfileForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Source of truth
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            Master profile
          </h1>
        </div>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>

      {message ? <p className="mb-4 text-sm text-[var(--accent)]">{message}</p> : null}
      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Experiences", counts.experiences],
          ["Education", counts.education],
          ["Projects", counts.projects],
          ["Skills", counts.skills],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {label}
            </p>
            <p className="text-xl font-bold text-[var(--ink)]">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          <TextField label="Headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} />
          <TextField label="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          <TextField label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <TextField label="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          <TextField label="Website" value={form.website} onChange={(e) => set("website", e.target.value)} />
          <TextField label="GitHub" value={form.github} onChange={(e) => set("github", e.target.value)} />
          <TextField label="LinkedIn" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
          <TextField
            label="Portfolio"
            value={form.portfolio}
            onChange={(e) => set("portfolio", e.target.value)}
            className="sm:col-span-2"
          />
          <TextArea
            label="Professional summary"
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="sm:col-span-2"
            rows={5}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Use the Builder to edit experiences, projects, and skills, then sync them into this master profile.
        </p>
      </section>
    </AppShell>
  );
}
