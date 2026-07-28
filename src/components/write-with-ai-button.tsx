"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { WriteFieldType } from "@/lib/ai/prompts";

type Props = {
  fieldType: WriteFieldType;
  value: string;
  onApply: (text: string) => void;
  context?: string;
};

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5l1.1 3.4L12.5 6 9.1 7.1 8 10.5 6.9 7.1 3.5 6l3.4-1.1L8 1.5z"
        fill="currentColor"
      />
      <path
        d="M12.5 9.5l.55 1.7 1.7.55-1.7.55-.55 1.7-.55-1.7-1.7-.55 1.7-.55.55-1.7z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export function WriteWithAiButton({ fieldType, value, onApply, context }: Props) {
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated") {
    return (
      <div className="flex justify-end">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-[var(--ink-muted)] transition hover:text-[var(--accent)]"
        >
          <SparkleIcon className="h-3 w-3" />
          Sign in for AI
        </Link>
      </div>
    );
  }

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldType,
          text: value,
          context: context || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Write with AI failed");
      onApply(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Write with AI failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        title="Write with AI"
        aria-label="Write with AI"
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.7rem] font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)] disabled:opacity-60"
      >
        <SparkleIcon className="h-3.5 w-3.5 shrink-0" />
        {loading ? "Writing…" : "Write with AI"}
      </button>
      {error ? (
        <span className="max-w-full text-right text-[0.65rem] text-[var(--danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
