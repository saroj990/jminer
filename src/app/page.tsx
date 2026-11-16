import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-5xl flex-col px-6 pb-20 pt-10">
        <header className="flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
            port<span className="text-[var(--accent)]">Folio</span>
          </p>
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="mt-24 max-w-3xl animate-fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Resume CMS
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl">
            portFolio
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--ink-muted)]">
            One master professional profile. Multiple resumes. Templates, PDF/Word export,
            and AI tailoring with online or local providers.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(31,122,108,0.8)]"
            >
              Create account
            </Link>
            <Link
              href="/builder"
              className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
            >
              Try guest builder
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            ["Master profile", "Store experience, skills, and projects once."],
            ["AI ready", "Gemini → Cerebras → Groq, or local Ollama."],
            ["Export", "Download PDF, Word, or JSON backups."],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]/80 p-5 shadow-[var(--shadow)]"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ink)]">
                {title}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
