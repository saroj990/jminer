"use client";

import { useTheme } from "@/components/theme-provider";

type Props = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className = "", compact = false }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light theme" : "Switch to black theme"}
      aria-label={isDark ? "Switch to light theme" : "Switch to black theme"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--ink-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] ${compact ? "" : "sm:w-auto sm:gap-2 sm:px-3"} ${className}`}
    >
      {isDark ? (
        <SunIcon className="h-[18px] w-[18px] shrink-0" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px] shrink-0" />
      )}
      {compact ? null : (
        <span className="hidden sm:inline text-sm font-semibold">
          {isDark ? "Light" : "Black"}
        </span>
      )}
    </button>
  );
}

/** Classic crescent moon — filled, readable at small sizes */
function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

/** Classic sun with rays — filled disc + short rays */
function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  );
}
