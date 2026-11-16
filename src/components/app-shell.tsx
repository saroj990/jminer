"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Master Profile" },
  { href: "/resumes", label: "Resumes" },
  { href: "/builder", label: "Builder" },
  { href: "/upwork", label: "Upwork" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--header-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-[1.45rem] font-bold tracking-tight text-[var(--ink)]"
          >
            port<span className="text-[var(--accent)]">Folio</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--ink-muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <span className="hidden text-sm text-[var(--ink-muted)] sm:inline">
              {data?.user?.email}
            </span>
            <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
              Sign out
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden sm:px-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full bg-[var(--panel)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
