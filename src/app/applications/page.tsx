import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui";

export default function ApplicationsPage() {
  return (
    <AppShell>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        Pipeline
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
        Job applications
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)]">
        Track applications you send after qualifying Upwork leads — status, follow-ups, and tailored
        resume versions. This section is next on the roadmap.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/upwork">
          <Button variant="primary">Open project leads</Button>
        </Link>
        <Link href="/resumes">
          <Button>Resumes</Button>
        </Link>
      </div>
    </AppShell>
  );
}