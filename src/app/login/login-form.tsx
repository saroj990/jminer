"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, TextField } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";
  const verified = params.get("verified") === "1";
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverified(false);
    setResendMessage(null);
    setDevUrl(null);

    try {
      const checkRes = await fetch("/api/login-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const check = await checkRes.json();

      if (!check.ok) {
        if (check.reason === "unverified") {
          setUnverified(true);
          setError("Please verify your email before signing in.");
        } else {
          setError("Invalid email or password.");
        }
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setError("Could not sign in. Please try again.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setLoading(false);
      setError("Could not sign in. Please try again.");
    }
  };

  const resend = async () => {
    if (!email) {
      setError("Enter your email to resend verification.");
      return;
    }
    setResendMessage(null);
    setDevUrl(null);
    const res = await fetch("/api/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not resend email");
      return;
    }
    setResendMessage(data.message || "Verification email sent.");
    if (data.devVerifyUrl) setDevUrl(data.devVerifyUrl);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your career workspace — master profile, resumes, and AI tools in one place."
      footer={
        <p className="text-sm text-[var(--ink-muted)]">
          New to portFolio?{" "}
          <Link href="/register" className="font-semibold text-[var(--accent)]">
            Create an account
          </Link>
        </p>
      }
    >
      {verified ? (
        <p className="mb-4 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--accent-hover)]">
          Email verified. You can sign in now.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {resendMessage ? (
          <p className="text-sm text-[var(--accent)]">{resendMessage}</p>
        ) : null}
        {devUrl ? (
          <p className="break-all text-xs text-[var(--ink-muted)]">
            Dev link:{" "}
            <a href={devUrl} className="font-semibold text-[var(--accent)]">
              {devUrl}
            </a>
          </p>
        ) : null}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {unverified ? (
        <Button className="mt-3 w-full" onClick={resend}>
          Resend verification email
        </Button>
      ) : null}
    </AuthShell>
  );
}
