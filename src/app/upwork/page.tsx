"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";
import { ocrImageFiles } from "@/lib/upwork-ocr-client";
import type { ParsedUpworkJob } from "@/types/upwork-lead";

type LeadRow = {
  id: string;
  title: string;
  clientName: string;
  connectsRequired: number | null;
  postedAtText: string;
  engagementScore: number | null;
  genuinenessScore: number | null;
  status: string;
};

function scoreBadge(score: number | null) {
  if (score == null) return "—";
  if (score >= 70) return `${score} · high`;
  if (score >= 45) return `${score} · mid`;
  return `${score} · low`;
}

export default function UpworkLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<ParsedUpworkJob | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsePhase, setParsePhase] = useState<"ocr" | "ai" | null>(null);
  const [duplicateExisting, setDuplicateExisting] = useState<{
    id: string;
    title: string;
    clientName: string;
    postedAtText: string;
  } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/upwork/leads")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onParseFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setParsing(true);
    setParseError(null);
    setParsed(null);
    setDuplicateExisting(null);
    try {
      const picked = Array.from(files).slice(0, 3);
      setParsePhase("ocr");
      const ocrText = await ocrImageFiles(picked);
      if (ocrText.trim().length < 80) {
        throw new Error(
          "OCR could not read enough text. Use full-page screenshots at normal zoom.",
        );
      }
      setParsePhase("ai");
      const res = await fetch("/api/upwork/parse-from-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setParsed(data.parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
      setParsePhase(null);
    }
  };

  const saveParsed = async (allowDuplicate = false) => {
    if (!parsed) return;
    setSaving(true);
    if (!allowDuplicate) setError(null);
    try {
      const res = await fetch("/api/upwork/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsed, allowDuplicate }),
      });
      const data = await res.json();
      if (res.status === 409 && data.duplicate) {
        setDuplicateExisting(data.existingLead);
        setParseError(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Save failed");
      setParsed(null);
      setDuplicateExisting(null);
      setParseError(null);
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
            Upwork leads
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
            Upload job screenshots (1–3 images). OCR runs in your browser; structuring uses
            Settings → AI mode (Ollama when local).
          </p>
        </div>
      </div>

      <section className="mb-8 max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
          Import from screenshots
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Tip: one screenshot with title + client sidebar, second with Skills + Activity on this
          job.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={parsing}
          className="mt-4 block w-full text-sm text-[var(--ink-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent)]"
          onChange={(e) => {
            onParseFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {parsing ? (
          <p className="mt-3 text-sm text-[var(--accent)]">
            {parsePhase === "ocr"
              ? "Running OCR in browser (first time may download language data)…"
              : "Structuring fields with AI…"}
          </p>
        ) : null}
        {parseError ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{parseError}</p>
        ) : null}

        {parsed ? (
          <div className="mt-5 space-y-3 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-4">
            <p className="text-sm font-semibold text-[var(--ink)]">{parsed.title}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {parsed.postedAtText || "Posted time unknown"} · Connects:{" "}
              {parsed.connectsRequired ?? "?"} · Client:{" "}
              {parsed.client?.location || parsed.client?.industry || "—"}
            </p>
            <p className="line-clamp-4 text-sm text-[var(--ink-soft)]">{parsed.description}</p>
            {parsed.techStack?.length ? (
              <p className="text-xs text-[var(--ink-muted)]">
                Skills: {parsed.techStack.join(", ")}
              </p>
            ) : null}
            {duplicateExisting ? (
              <div
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-[var(--ink)]"
                role="alert"
              >
                <p className="font-semibold">Duplicate job</p>
                <p className="mt-1 text-[var(--ink-muted)]">
                  A lead already exists for this title, client, and posted time.{" "}
                  <Link
                    href={`/upwork/${duplicateExisting.id}`}
                    className="font-semibold text-[var(--accent)] hover:underline"
                  >
                    View existing
                  </Link>
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveParsed(false)} disabled={saving}>
                {saving ? "Saving…" : "Save to list"}
              </Button>
              {duplicateExisting ? (
                <Button variant="secondary" onClick={() => saveParsed(true)} disabled={saving}>
                  Save anyway
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => {
                  setParsed(null);
                  setDuplicateExisting(null);
                  setParseError(null);
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--panel-muted)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Connects</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3">Engagement</th>
                <th className="px-4 py-3">Genuine</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-[var(--ink-muted)]">
                    Loading…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-[var(--ink-muted)]">
                    No leads yet. Import screenshots above.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--line)] transition hover:bg-[var(--panel-muted)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/upwork/${lead.id}`}
                        className="font-semibold text-[var(--accent)] hover:underline"
                      >
                        {lead.title}
                      </Link>
                      <span className="ml-2 text-xs text-[var(--ink-muted)]">{lead.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{lead.clientName}</td>
                    <td className="px-4 py-3">{lead.connectsRequired ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      {lead.postedAtText || "—"}
                    </td>
                    <td className="px-4 py-3">{scoreBadge(lead.engagementScore)}</td>
                    <td className="px-4 py-3">{scoreBadge(lead.genuinenessScore)}</td>
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