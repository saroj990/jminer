"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, TextField } from "@/components/ui";
import { isUsableJobUrl } from "@/lib/upwork-posted-at";
import { FETCH_INTERVAL_OPTIONS } from "@/types/company-tracker";
import type { SkillFitAnalysis } from "@/types/job-application";

type ListingRow = {
  id: string;
  title: string;
  jobUrl: string;
  locationText: string;
  descriptionSnippet: string;
  active: boolean;
  skillFitScore: number | null;
  skillFit: SkillFitAnalysis | null;
};

type CompanyDetail = {
  id: string;
  name: string;
  websiteUrl: string;
  careersUrl: string;
  careersUrlHasLink: boolean;
  fetchIntervalMinutes: number;
  lastFetchedAt: string | null;
  lastFetchStatus: string;
  lastFetchError: string;
  listings: ListingRow[];
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(1440);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/companies/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const c = data.company as CompanyDetail;
        setCompany(c);
        setName(c.name);
        setWebsiteUrl(c.websiteUrl === "N/A" ? "" : c.websiteUrl);
        setCareersUrl(c.careersUrl);
        setIntervalMinutes(c.fetchIntervalMinutes);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      const res = await fetch(`/api/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          careersUrl: careersUrl.trim(),
          careersUrlSource: careersUrl.trim() ? "user" : undefined,
          fetchIntervalMinutes: intervalMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setCompany(data.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const discover = async () => {
    setBusy("discover");
    setError(null);
    try {
      const res = await fetch(`/api/companies/${id}/discover`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discover failed");
      setCompany(data.company);
      setCareersUrl(data.suggestedUrl ?? data.company.careersUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discover failed");
    } finally {
      setBusy(null);
    }
  };

  const fetchJobs = async () => {
    setBusy("fetch");
    setError(null);
    try {
      const res = await fetch(`/api/companies/${id}/fetch`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fetch failed");
      setCompany(data.company);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setBusy(null);
    }
  };

  const scoreListing = async (listingId: string) => {
    setBusy(`score-${listingId}`);
    setError(null);
    try {
      const res = await fetch(`/api/companies/listings/${listingId}/skills`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Skill fit failed");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill fit failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this company and all listings?")) return;
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    router.push("/companies");
  };

  if (error && !company) {
    return (
      <AppShell>
        <p className="text-[var(--danger)]">{error}</p>
        <Link href="/companies" className="mt-4 inline-block text-[var(--accent)]">
          ← Back
        </Link>
      </AppShell>
    );
  }

  if (!company) {
    return (
      <AppShell>
        <p className="text-[var(--ink-muted)]">Loading…</p>
      </AppShell>
    );
  }

  const activeListings = company.listings.filter((l) => l.active);

  return (
    <AppShell>
      <Link href="/companies" className="text-sm font-semibold text-[var(--accent)]">
        ← Companies
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
            {company.name}
          </h1>
          {company.lastFetchError ? (
            <p className="mt-2 text-sm text-[var(--danger)]">{company.lastFetchError}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={discover} disabled={busy !== null}>
            {busy === "discover" ? "Searching…" : "Discover careers URL"}
          </Button>
          <Button variant="primary" onClick={fetchJobs} disabled={busy !== null}>
            {busy === "fetch" ? "Fetching…" : "Fetch now"}
          </Button>
          <Button variant="secondary" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Company settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Website"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <TextField
            label="Careers URL"
            value={careersUrl}
            onChange={(e) => setCareersUrl(e.target.value)}
            className="sm:col-span-2"
          />
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Fetch interval (stored for future cron)
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
          <Button onClick={save} disabled={busy === "save"}>
            {busy === "save" ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--ink)]">
          Job listings ({activeListings.length} active)
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Sorted by skill fit. New listings are scored automatically after fetch when your primary
          resume is set.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel-muted)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Skill fit</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {activeListings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-[var(--ink-muted)]">
                    No listings yet. Set careers URL and click Fetch now.
                  </td>
                </tr>
              ) : (
                [...activeListings]
                  .sort((a, b) => (b.skillFitScore ?? -1) - (a.skillFitScore ?? -1))
                  .map((row) => (
                    <tr key={row.id} className="border-b border-[var(--line)]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--ink)]">{row.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-muted)]">
                          {row.descriptionSnippet}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        {row.locationText || "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-[var(--accent)]">
                        {row.skillFitScore ?? "—"}
                      </td>
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
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => scoreListing(row.id)}
                          className="rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                        >
                          {busy === `score-${row.id}` ? "…" : "Score"}
                        </button>
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