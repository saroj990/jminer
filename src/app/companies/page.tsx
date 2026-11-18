"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, TextField } from "@/components/ui";
import { FETCH_INTERVAL_OPTIONS } from "@/types/company-tracker";

type CompanyRow = {
  id: string;
  name: string;
  careersUrl: string;
  careersUrlHasLink: boolean;
  fetchIntervalLabel: string;
  lastFetchedAt: string | null;
  lastFetchStatus: string;
  listingCount: number;
  bestFitScore: number | null;
};

export default function CompaniesPage() {
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(1440);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/companies")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setRows(data.companies))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          careersUrl: careersUrl.trim() || undefined,
          fetchIntervalMinutes: intervalMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setShowForm(false);
      setName("");
      setWebsiteUrl("");
      setCareersUrl("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Pipeline
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            Companies
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
            Track career pages, refresh job listings, and see skill-fit recommendations against your
            primary resume. Set <code className="text-xs">SERPAPI_API_KEY</code> in .env for careers
            page discovery.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add company"}
        </Button>
      </div>

      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      {showForm ? (
        <section className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-[var(--ink)]">New company</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField label="Company name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField
              label="Website URL (optional)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://company.com"
            />
            <TextField
              label="Careers URL (optional)"
              value={careersUrl}
              onChange={(e) => setCareersUrl(e.target.value)}
              className="sm:col-span-2"
              placeholder="Leave blank to discover via search on company detail"
            />
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                Fetch interval (manual in v1)
              </span>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="h-10 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-sm"
              >
                {FETCH_INTERVAL_OPTIONS.map((o) => (
                  <option key={o.minutes} value={o.minutes}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4">
            <Button variant="primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save company"}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel-muted)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Careers</th>
                <th className="px-4 py-3">Interval</th>
                <th className="px-4 py-3">Last fetch</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Best fit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-[var(--ink-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-[var(--ink-muted)]">
                    No companies yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--line)] hover:bg-[var(--panel-muted)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${row.id}`}
                        className="font-semibold text-[var(--accent)] hover:underline"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {row.careersUrlHasLink ? (
                        <a
                          href={row.careersUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-[var(--ink-muted)]">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{row.fetchIntervalLabel}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {row.lastFetchedAt
                        ? new Date(row.lastFetchedAt).toLocaleString()
                        : "Never"}
                      {row.lastFetchStatus === "error" ? " · error" : ""}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.listingCount}</td>
                    <td className="px-4 py-3 tabular-nums">{row.bestFitScore ?? "—"}</td>
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