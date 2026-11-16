import { parsedUpworkJobSchema, type ParsedUpworkJob } from "@/types/upwork-lead";

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function boolOrUndef(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

/** Coerce messy LLM / Ollama JSON before Zod validation. */
export function normalizeUpworkParsed(raw: unknown): ParsedUpworkJob {
  const o =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const clientRaw =
    o.client && typeof o.client === "object" && !Array.isArray(o.client)
      ? (o.client as Record<string, unknown>)
      : null;

  const activityRaw =
    o.activity && typeof o.activity === "object" && !Array.isArray(o.activity)
      ? (o.activity as Record<string, unknown>)
      : null;

  let techStack: string[] = [];
  if (Array.isArray(o.techStack)) {
    techStack = o.techStack.map((t) => str(t)).filter(Boolean);
  } else if (typeof o.techStack === "string") {
    techStack = o.techStack
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const client = clientRaw
    ? {
        displayName: str(clientRaw.displayName) || undefined,
        location: str(clientRaw.location) || undefined,
        rating: numOrNull(clientRaw.rating),
        reviewCount: numOrNull(clientRaw.reviewCount),
        paymentVerified: boolOrUndef(clientRaw.paymentVerified),
        phoneVerified: boolOrUndef(clientRaw.phoneVerified),
        jobsPosted: numOrNull(clientRaw.jobsPosted),
        hireRatePercent: numOrNull(clientRaw.hireRatePercent),
        totalSpentUsd: numOrNull(clientRaw.totalSpentUsd),
        hires: numOrNull(clientRaw.hires),
        activeHires: numOrNull(clientRaw.activeHires),
        avgHourlyPaid: numOrNull(clientRaw.avgHourlyPaid),
        memberSince: str(clientRaw.memberSince) || undefined,
        industry: str(clientRaw.industry) || undefined,
        companySize: str(clientRaw.companySize) || undefined,
        recentHistoryNote: str(clientRaw.recentHistoryNote) || undefined,
      }
    : undefined;

  const activity = activityRaw
    ? {
        proposalsRange: str(activityRaw.proposalsRange) || undefined,
        lastViewedByClient: str(activityRaw.lastViewedByClient) || undefined,
        interviewing: numOrNull(activityRaw.interviewing),
        invitesSent: numOrNull(activityRaw.invitesSent),
        unansweredInvites: numOrNull(activityRaw.unansweredInvites),
      }
    : undefined;

  const candidate = {
    title: str(o.title).trim() || "Untitled Upwork job",
    postedAtText: str(o.postedAtText) || undefined,
    jobUrl: str(o.jobUrl) || undefined,
    description: str(o.description),
    techStack,
    connectsRequired: numOrNull(o.connectsRequired),
    hourlyRateText: str(o.hourlyRateText) || undefined,
    durationText: str(o.durationText) || undefined,
    experienceLevel: str(o.experienceLevel) || undefined,
    projectType: str(o.projectType) || undefined,
    client,
    activity,
  };

  return parsedUpworkJobSchema.parse(candidate);
}