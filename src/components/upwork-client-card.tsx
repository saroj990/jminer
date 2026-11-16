import type { upworkClientSchema } from "@/types/upwork-lead";
import type { z } from "zod";

type Client = z.infer<typeof upworkClientSchema>;

function pickClient(raw: Record<string, unknown>): Client {
  return raw as Client;
}

function displayVal(value: string | number | null | undefined, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function VerdictBadge({ ok, label }: { ok?: boolean; label: string }) {
  const verified = ok === true;
  const unknown = ok === undefined;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
        verified
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "bg-[var(--panel-muted)] text-[var(--ink-muted)]"
      }`}
    >
      {verified ? "✓" : unknown ? "?" : "—"} {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-3 py-2.5">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

type Props = {
  clientName: string;
  clientInfo: Record<string, unknown>;
};

export function UpworkClientCard({ clientName, clientInfo }: Props) {
  const c = pickClient(clientInfo);
  const title =
    c.displayName?.trim() ||
    clientName?.trim() ||
    c.location?.trim() ||
    "Unknown client";
  const rating = c.rating;
  const reviews = c.reviewCount;

  const hasAny =
    title !== "Unknown client" ||
    c.location ||
    c.industry ||
    rating != null ||
    c.paymentVerified != null;

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Client</h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">No client data captured yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">About the client</h2>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]">
            {title}
          </p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {[c.location, c.industry].filter(Boolean).join(" · ") || "Location unknown"}
          </p>
        </div>
        {rating != null ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] px-4 py-2 text-right">
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
              {rating.toFixed(rating % 1 === 0 ? 0 : 1)}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {reviews != null ? `${reviews} reviews` : "Rating"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <VerdictBadge ok={c.paymentVerified} label="Payment verified" />
        <VerdictBadge ok={c.phoneVerified} label="Phone verified" />
      </div>

      {(c.companySize || c.memberSince) && (
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          {[c.companySize, c.memberSince ? `Member since ${c.memberSince}` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Jobs posted" value={displayVal(c.jobsPosted)} />
        <Stat label="Hire rate" value={c.hireRatePercent != null ? `${c.hireRatePercent}%` : "—"} />
        <Stat label="Total spent" value={formatUsd(c.totalSpentUsd)} />
        <Stat label="Hires" value={displayVal(c.hires)} />
        <Stat label="Active now" value={displayVal(c.activeHires)} />
        <Stat
          label="Avg hourly paid"
          value={c.avgHourlyPaid != null ? `$${c.avgHourlyPaid}/hr` : "—"}
        />
      </div>

      {c.recentHistoryNote?.trim() ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--panel-muted)] p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Recent history
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink-soft)]">
            {c.recentHistoryNote.trim()}
          </p>
        </div>
      ) : null}
    </div>
  );
}