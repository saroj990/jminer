import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

const highlights = [
  {
    title: "One master profile",
    body: "Store experience, education, skills, and projects once — reuse them everywhere.",
  },
  {
    title: "Tailored resumes",
    body: "Create role-specific versions, export PDF or Word, and keep versions organized.",
  },
  {
    title: "AI when you need it",
    body: "Match job descriptions with online providers or run locally with Ollama.",
  },
];

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#0f2924] text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 20% 15%, rgba(47,140,120,0.45), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(196,150,74,0.18), transparent 50%), linear-gradient(160deg, #0f2924 0%, #163a36 48%, #0c1f1c 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight"
          >
            port<span className="text-[#7dcebf]">Folio</span>
          </Link>

          <div className="max-w-lg animate-fade-up">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8fbfb4]">
              Career workspace
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Your professional story, structured once.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#c5ddd7]">
              portFolio turns scattered resume drafts into a single source of truth —
              so every application starts from your best work, not a blank page.
            </p>

            <div className="mt-10 overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm">
              <div className="rounded-xl bg-[#f7fbf9] p-5 text-[#102824] shadow-inner">
                <div className="h-1.5 w-16 rounded-full bg-[#1f7a6c]" />
                <p className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold">
                  Alex Morgan
                </p>
                <p className="text-sm font-medium text-[#1f7a6c]">
                  Senior Software Engineer
                </p>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded bg-[#d8e6e1]" />
                  <div className="h-2 w-5/6 rounded bg-[#d8e6e1]" />
                  <div className="h-2 w-4/5 rounded bg-[#d8e6e1]" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-lg bg-[#e3f2ee]" />
                  <div className="h-12 rounded-lg bg-[#e3f2ee]" />
                  <div className="h-12 rounded-lg bg-[#e3f2ee]" />
                </div>
              </div>
            </div>
          </div>

          <ul className="relative z-10 mt-10 grid gap-4">
            {highlights.map((item) => (
              <li key={item.title} className="border-t border-white/10 pt-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#a8c7c0]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md animate-fade-up">
          <Link
            href="/"
            className="mb-8 inline-block font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)] lg:hidden"
          >
            port<span className="text-[var(--accent)]">Folio</span>
          </Link>

          <div className="mb-6 lg:hidden">
            <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
              Build one master profile, generate tailored resumes, and export with
              confidence.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white/95 p-6 shadow-[var(--shadow)] sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              {subtitle}
            </p>
            <div className="mt-6">{children}</div>
            <div className="mt-5">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
