"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AiAssistantPanel } from "@/components/ai-assistant-panel";
import { ImportResumeDialog } from "@/components/import-resume-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  EducationSection,
  ExperienceSection,
  PersonalSection,
  PortfolioSection,
  SkillsSection,
  SummarySection,
} from "@/components/sections";
import { LiveResumePreview } from "@/components/live-resume-preview";
import { Button } from "@/components/ui";
import type { ResumeData } from "@/types/resume";
import { exportResumeToDocx } from "@/lib/export-docx";
import { exportResumeToPdf } from "@/lib/export-pdf";
import { useResumeStore } from "@/store/resume-store";

const SECTIONS = [
  { id: "personal", label: "Profile" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "portfolio", label: "Portfolio" },
  { id: "ai", label: "AI" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type MobilePane = "edit" | "preview";

export function ResumeBuilder() {
  const { status } = useSession();
  const loadSample = useResumeStore((s) => s.loadSample);
  const reset = useResumeStore((s) => s.reset);
  const replaceResume = useResumeStore((s) => s.replaceResume);
  const [exporting, setExporting] = useState<"pdf" | "docx" | "json" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("personal");
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [syncing, setSyncing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Do not auto-load master profile into the editor — keep local draft until
  // the user explicitly Saves (or Loads profile from the Load dialog).

  const handlePdf = async () => {
    const resume = useResumeStore.getState().resume;
    setError(null);
    setExporting("pdf");
    try {
      await exportResumeToPdf(resume);
      setMessage("PDF exported.");
    } catch (err) {
      console.error(err);
      setError("Could not export PDF. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const handleDocx = async () => {
    const resume = useResumeStore.getState().resume;
    setError(null);
    setExporting("docx");
    try {
      await exportResumeToDocx(resume);
      setMessage("Word document exported.");
    } catch (err) {
      console.error(err);
      setError("Could not export Word document. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const handleJson = () => {
    const resume = useResumeStore.getState().resume;
    setExporting("json");
    const blob = new Blob([JSON.stringify(resume, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(resume.personal.fullName || "resume").replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
    setMessage("JSON backup downloaded.");
  };

  const syncToProfile = async () => {
    if (status !== "authenticated") {
      setError("Sign in to sync with your master profile.");
      return;
    }
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const resume = useResumeStore.getState().resume;
      const res = await fetch("/api/profile/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.resumeData) replaceResume(data.resumeData);
      setDraftDirty(false);
      setMessage("Saved to master profile.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleImported = (data: ResumeData, sourceLabel: string) => {
    replaceResume(data);
    setDraftDirty(true);
    setError(null);
    setMessage(
      `${sourceLabel}. Draft only — click Save to profile when you’re ready.`,
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ImportResumeDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onLoaded={handleImported}
      />
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--header-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Link
              href={status === "authenticated" ? "/dashboard" : "/"}
              className="font-[family-name:var(--font-display)] text-[1.65rem] font-bold leading-none tracking-tight text-[var(--ink)]"
            >
              port<span className="text-[var(--accent)]">Folio</span>
            </Link>
            <p className="mt-1 truncate text-xs text-[var(--ink-muted)] sm:text-sm">
              {draftDirty
                ? "Unsaved draft · Save to profile when ready"
                : "Master profile · AI · Export"}
            </p>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle compact />
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              Load
            </Button>
            {status === "authenticated" ? (
              <Button variant="ghost" onClick={syncToProfile} disabled={syncing}>
                {syncing ? "Saving…" : "Save to profile"}
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                loadSample();
                setDraftDirty(true);
                setMessage("Sample loaded as draft — Save to profile when ready.");
              }}
            >
              Sample
            </Button>
            <Button onClick={handleJson} disabled={!!exporting}>
              JSON
            </Button>
            <Button onClick={handleDocx} disabled={!!exporting}>
              {exporting === "docx" ? "…" : "Word"}
            </Button>
            <Button variant="primary" onClick={handlePdf} disabled={!!exporting}>
              {exporting === "pdf" ? "Exporting…" : "PDF"}
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle compact />
            <Button onClick={() => setImportOpen(true)}>Load</Button>
            <Button variant="primary" onClick={handlePdf} disabled={!!exporting}>
              PDF
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 pb-3 lg:hidden sm:px-6">
          <Button
            variant={mobilePane === "edit" ? "primary" : "secondary"}
            onClick={() => setMobilePane("edit")}
            className="shrink-0"
          >
            Edit
          </Button>
          <Button
            variant={mobilePane === "preview" ? "primary" : "secondary"}
            onClick={() => setMobilePane("preview")}
            className="shrink-0"
          >
            Preview
          </Button>
          <Button onClick={handleDocx} disabled={!!exporting} className="shrink-0">
            Word
          </Button>
          <Button onClick={handleJson} disabled={!!exporting} className="shrink-0">
            JSON
          </Button>
          {status === "authenticated" ? (
            <Button onClick={syncToProfile} disabled={syncing} className="shrink-0">
              {syncing ? "Saving…" : "Save"}
            </Button>
          ) : (
            <Link href="/login" className="shrink-0">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>

        {error ? (
          <p className="border-t border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-2 text-center text-sm text-[var(--danger)]">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="border-t border-[var(--line)] bg-[var(--accent-soft)] px-4 py-2 text-center text-sm text-[var(--accent-hover)]">
            {message}
          </p>
        ) : null}
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-0 lg:grid-cols-[220px_minmax(0,1fr)_minmax(360px,0.95fr)]">
        <nav className="hidden border-r border-[var(--line)] bg-[var(--panel)]/40 p-4 lg:block">
          <p className="mb-3 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Sections
          </p>
          <ul className="space-y-1">
            {SECTIONS.map((section, index) => {
              const active = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? "bg-[var(--accent)] text-white shadow-[0_10px_24px_-14px_rgba(31,122,108,0.9)]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-md text-[0.7rem] font-bold ${
                        active
                          ? "bg-white/20"
                          : "bg-[var(--accent-soft)] text-[var(--accent)]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
          {status === "authenticated" ? (
            <div className="mt-6 space-y-2 px-1">
              <Link href="/dashboard" className="block text-sm font-semibold text-[var(--accent)]">
                ← Dashboard
              </Link>
              <Link href="/settings" className="block text-sm text-[var(--ink-muted)]">
                AI settings
              </Link>
            </div>
          ) : null}
        </nav>

        <section
          className={`editor-scroll border-r border-[var(--line)] p-4 sm:p-6 ${
            mobilePane === "edit" ? "block" : "hidden"
          } lg:block lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto`}
        >
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {SECTIONS.map((section) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--panel)] text-[var(--ink-muted)] ring-1 ring-[var(--line)]"
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          {activeSection === "personal" ? <PersonalSection /> : null}
          {activeSection === "summary" ? <SummarySection /> : null}
          {activeSection === "experience" ? <ExperienceSection /> : null}
          {activeSection === "education" ? <EducationSection /> : null}
          {activeSection === "skills" ? <SkillsSection /> : null}
          {activeSection === "portfolio" ? <PortfolioSection /> : null}
          {activeSection === "ai" ? <AiAssistantPanel /> : null}

          <div className="mt-5 flex justify-between gap-3">
            <Button
              variant="ghost"
              disabled={activeSection === "personal"}
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                if (idx > 0) setActiveSection(SECTIONS[idx - 1].id);
              }}
            >
              ← Previous
            </Button>
            <Button
              variant="secondary"
              disabled={activeSection === SECTIONS[SECTIONS.length - 1].id}
              onClick={() => {
                const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                if (idx < SECTIONS.length - 1) {
                  setActiveSection(SECTIONS[idx + 1].id);
                }
              }}
            >
              Next →
            </Button>
          </div>
        </section>

        <aside
          className={`preview-scroll bg-[var(--preview-bg)]/55 p-4 sm:p-6 ${
            mobilePane === "preview" ? "block" : "hidden"
          } lg:block lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto`}
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                Preview
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
                Live resume
              </h2>
            </div>
            <Button variant="ghost" onClick={reset} className="text-xs">
              Clear
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--preview-bg)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-4">
            {hydrated ? (
              <LiveResumePreview />
            ) : (
              <div className="flex h-[11in] items-center justify-center rounded-xl bg-[var(--panel)] text-sm text-[var(--ink-muted)]">
                Loading preview…
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
