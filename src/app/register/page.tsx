"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, TextField } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      const params = new URLSearchParams({ email });
      if (data.devVerifyUrl) params.set("devUrl", data.devVerifyUrl);
      router.push(`/verify-email/pending?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start with a verified account. We’ll help you build a master profile you can turn into many tailored resumes."
      footer={
        <p className="text-sm text-[var(--ink-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Work email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 6 characters. We’ll email a verification link next."
        />
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
