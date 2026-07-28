"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui";

function PendingContent() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const initialDevUrl = params.get("devUrl");
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(initialDevUrl);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend");
      setMessage(data.message || "Email sent.");
      if (data.devVerifyUrl) setDevUrl(data.devVerifyUrl);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]"
      >
        port<span className="text-[var(--accent)]">Folio</span>
      </Link>
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)]">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          We sent a verification link{email ? ` to ` : "."}
          {email ? <strong className="text-[var(--ink)]">{email}</strong> : null}.
          Open it to activate your account, then sign in.
        </p>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          In local development without Resend/SMTP, the link is also printed in the
          server terminal.
        </p>

        {devUrl ? (
          <p className="mt-4 break-all rounded-lg bg-[var(--panel-muted)] p-3 text-xs text-[var(--ink-soft)]">
            Dev verify link:{" "}
            <a href={devUrl} className="font-semibold text-[var(--accent)]">
              Open verification
            </a>
          </p>
        ) : null}

        {message ? <p className="mt-3 text-sm text-[var(--accent)]">{message}</p> : null}

        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={resend} disabled={loading || !email}>
            {loading ? "Sending…" : "Resend email"}
          </Button>
          <Link href={`/login?email=${encodeURIComponent(email)}`}>
            <Button variant="primary" className="w-full">
              Go to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PendingVerificationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm">Loading…</div>}>
      <PendingContent />
    </Suspense>
  );
}
