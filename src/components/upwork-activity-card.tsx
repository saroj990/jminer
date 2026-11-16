import type { upworkActivitySchema } from "@/types/upwork-lead";
import type { z } from "zod";

type Activity = z.infer<typeof upworkActivitySchema>;

function pickActivity(raw: Record<string, unknown>): Activity {
  return raw as Activity;
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        highlight
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "border-[var(--line)] bg-[var(--panel-muted)]"
      }`}
    >
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

type Props = {
  activity: Record<string, unknown>;
};

export function UpworkActivityCard({ activity }: Props) {
  const a = pickActivity(activity);

  const hasAny =
    a.proposalsRange ||
    a.lastViewedByClient ||
    a.interviewing != null ||
    a.invitesSent != null;

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Activity on this job</h2>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Import the skills / activity screenshot to see proposal stats.
        </p>
      </div>
    );
  }

  const interviewing = a.interviewing ?? 0;
  const hot = interviewing > 0;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
      <h2 className="text-lg font-semibold text-[var(--ink)]">Activity on this job</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Competition and client engagement signals from the posting.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Metric
          label="Proposals"
          value={a.proposalsRange?.trim() || "—"}
          highlight={Boolean(a.proposalsRange?.includes("to"))}
        />
        <Metric
          label="Last viewed by client"
          value={a.lastViewedByClient?.trim() || "—"}
          highlight={Boolean(
            a.lastViewedByClient &&
              /minute|second|hour|ago/i.test(a.lastViewedByClient),
          )}
        />
        <Metric
          label="Interviewing"
          value={a.interviewing != null ? String(a.interviewing) : "—"}
          highlight={hot}
        />
        <Metric
          label="Invites sent"
          value={a.invitesSent != null ? String(a.invitesSent) : "—"}
        />
      </div>

      {a.unansweredInvites != null ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">
          Unanswered invites: <span className="font-semibold text-[var(--ink)]">{a.unansweredInvites}</span>
        </p>
      ) : null}
    </div>
  );
}