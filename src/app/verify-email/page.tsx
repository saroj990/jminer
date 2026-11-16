"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch(`/api/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setStatus("ok");
        setEmail(data.email || "");
        setMessage("Your email is verified. You can sign in now.");
        setTimeout(() => {
          router.push(
            `/login?verified=1&email=${encodeURIComponent(data.email || "")}`,
          );
        }, 1500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [token, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]"
      >
        port<span className="text-[var(--accent)]">Folio</span>
      </Link>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
          {status === "ok"
            ? "Email verified"
            : status === "error"
              ? "Verification failed"
              : "Verifying…"}
        </h1>
        <p
          className={`mt-3 text-sm ${
            status === "error" ? "text-[var(--danger)]" : "text-[var(--ink-muted)]"
          }`}
        >
          {message}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {status === "ok" ? (
            <Link href={`/login?verified=1&email=${encodeURIComponent(email)}`}>
              <Button variant="primary" className="w-full">
                Continue to sign in
              </Button>
            </Link>
          ) : null}
          {status === "error" ? (
            <>
              <Link href="/verify-email/pending">
                <Button className="w-full">Request a new link</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to sign in
                </Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
