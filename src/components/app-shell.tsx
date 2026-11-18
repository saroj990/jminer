"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ThemeMenuItem } from "@/components/theme-toggle";

const resumeLinks = [
  { href: "/profile", label: "Master profile" },
  { href: "/resumes", label: "Resumes" },
  { href: "/builder", label: "Builder" },
];

const resumePrefixes = ["/profile", "/resumes", "/builder"];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navPillClass(active: boolean) {
  return `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    active
      ? "bg-[var(--accent)] text-white"
      : "text-[var(--ink-muted)] hover:bg-[var(--panel)] hover:text-[var(--ink)]"
  }`;
}

function useCloseOnOutside(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, ref]);
}

function ResumeMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useCloseOnOutside(open, close, ref);

  const groupActive = resumePrefixes.some((p) => isActivePath(pathname, p));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 ${navPillClass(groupActive)}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        Resume
        <span className="text-[0.65rem] opacity-80" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-xl border border-[var(--line)] bg-[var(--panel)] py-1 shadow-[var(--shadow)]"
        >
          {resumeLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                role="menuitem"
                onClick={close}
                className={`block px-3 py-2 text-sm font-semibold ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--panel-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useCloseOnOutside(open, close, ref);

  const settingsActive = isActivePath(pathname, "/settings");
  const initial = (email?.[0] ?? "U").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className="flex max-w-[12rem] items-center gap-2 rounded-lg bg-transparent px-1 py-1 text-left text-sm outline-none transition hover:bg-[var(--panel-muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
          {initial}
        </span>
        <span className="hidden min-w-0 truncate font-semibold text-[var(--ink)] sm:block">
          {email ?? "Account"}
        </span>
        <span className="text-[0.65rem] text-[var(--ink-muted)]" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-[var(--line)] bg-[var(--panel)] py-1 shadow-[var(--shadow)]"
        >
          {email ? (
            <p className="border-b border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-muted)]">
              {email}
            </p>
          ) : null}
          <ThemeMenuItem />
          <Link
            href="/settings"
            role="menuitem"
            onClick={close}
            className={`block px-3 py-2 text-sm font-semibold ${
              settingsActive
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--panel-muted)]"
            }`}
          >
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm font-semibold text-[var(--ink-soft)] hover:bg-[var(--panel-muted)]"
            onClick={() => {
              close();
              signOut({ callbackUrl: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();

  const leadsActive = isActivePath(pathname, "/upwork");
  const applicationsActive = isActivePath(pathname, "/applications");
  const companiesActive = isActivePath(pathname, "/companies");
  const dashboardActive = isActivePath(pathname, "/dashboard");

  const mobileLinks = [
    { href: "/dashboard", label: "Dashboard" },
    ...resumeLinks,
    { href: "/upwork", label: "Project leads" },
    { href: "/applications", label: "Applications" },
    { href: "/companies", label: "Companies" },
  ];

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
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Link href="/dashboard" className={navPillClass(dashboardActive)}>
              Dashboard
            </Link>
            <ResumeMenu pathname={pathname} />
            <Link href="/upwork" className={navPillClass(leadsActive)}>
              Project leads
            </Link>
            <Link href="/applications" className={navPillClass(applicationsActive)}>
              Job applications
            </Link>
            <Link href="/companies" className={navPillClass(companiesActive)}>
              Companies
            </Link>
          </nav>
          <UserMenu email={data?.user?.email} />
        </div>
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden sm:px-6"
          aria-label="Main mobile"
        >
          {mobileLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
                  active
                    ? "bg-[var(--accent)] text-white ring-[var(--accent)]"
                    : "bg-[var(--panel)] text-[var(--ink-soft)] ring-[var(--line)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}