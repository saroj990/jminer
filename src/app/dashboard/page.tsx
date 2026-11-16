"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";

type DashboardData = {
  stats: {
    resumes: number;
    experiences: number;
    projects: number;
    skills: number;
    education: number;
  };
  recentActivity: Array<{
    id: string;
    resumeName: string;
    exportType: string;
    template: string;
    label: string;
    createdAt: string;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const stats = data?.stats;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Overview
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/profile">
            <Button>Edit profile</Button>
          </Link>
          <Link href="/builder">
            <Button variant="primary">Open builder</Button>
          </Link>
        </div>
      </div>

      {error ? <p className="text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Resumes", stats?.resumes],
          ["Experiences", stats?.experiences],
          ["Projects", stats?.projects],
          ["Skills", stats?.skills],
          ["Education", stats?.education],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--ink)]">
              {value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          Recent activity
        </h2>
        <div className="mt-4 space-y-3">
          {(data?.recentActivity.length ?? 0) === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">
              No exports yet. Build a resume and export PDF or Word to create versions.
            </p>
          ) : (
            data?.recentActivity.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--panel-muted)] px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[var(--ink)]">{item.resumeName}</p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {item.label || item.exportType} · {item.template}
                  </p>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
