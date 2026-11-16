import type { UpworkAnalysis } from "@/types/upwork-lead";

export type LeadScoreContext = {
  description: string;
  connectsRequired: number | null;
  clientInfo: Record<string, unknown>;
  activity: Record<string, unknown>;
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function proposalCompetitionPenalty(range: string): number {
  const r = range.toLowerCase();
  if (r.includes("50") && (r.includes("+") || r.includes("more"))) return 18;
  if (/20\s*to\s*50|20-50/.test(r)) return 12;
  if (/15\s*to\s*20|15-20/.test(r)) return 6;
  return 0;
}

function clientInfoIsSparse(client: Record<string, unknown>): boolean {
  const meaningful = Object.entries(client).filter(([, val]) => {
    if (val === null || val === undefined || val === "") return false;
    if (typeof val === "number" && !Number.isFinite(val)) return false;
    return true;
  });
  return meaningful.length < 3;
}

/** Conservative caps and penalties on top of LLM scores (missing data = lower trust). */
export function calibrateUpworkAnalysis(
  analysis: UpworkAnalysis,
  ctx: LeadScoreContext,
): UpworkAnalysis {
  let engagement = analysis.engagementScore;
  let genuineness = analysis.genuinenessScore;
  const riskFlags = [...analysis.riskFlags];
  const engagementFactors = [...analysis.engagementFactors];

  const client = ctx.clientInfo;
  const activity = ctx.activity;

  const paymentVerified = bool(client.paymentVerified);
  const totalSpent = num(client.totalSpentUsd);
  const hireRate = num(client.hireRatePercent);
  const reviews = num(client.reviewCount);
  const jobsPosted = num(client.jobsPosted);
  const lastViewed = str(activity.lastViewedByClient);
  const proposals = str(activity.proposalsRange);
  const interviewing = num(activity.interviewing);

  let engagementCap = 88;
  let genuinenessCap = 88;

  if (clientInfoIsSparse(client)) {
    engagementCap = Math.min(engagementCap, 50);
    genuinenessCap = Math.min(genuinenessCap, 48);
    riskFlags.push("Sparse client profile in import — scores capped conservatively.");
  }

  if (paymentVerified === false) {
    genuineness -= 24;
    genuinenessCap = Math.min(genuinenessCap, 55);
    riskFlags.push("Payment method not verified.");
  } else if (paymentVerified !== true) {
    genuineness -= 12;
    genuinenessCap = Math.min(genuinenessCap, 65);
    riskFlags.push("Payment verification not confirmed in data.");
  }

  if (totalSpent != null) {
    if (totalSpent < 1_000) {
      genuineness -= 14;
      genuinenessCap = Math.min(genuinenessCap, 60);
    } else if (totalSpent >= 10_000) {
      engagementFactors.push(
        `Substantial Upwork spend on record (~$${Math.round(totalSpent).toLocaleString()}).`,
      );
    }
  } else {
    genuineness -= 10;
    genuinenessCap = Math.min(genuinenessCap, 62);
  }

  if (hireRate != null && hireRate < 40) {
    engagement -= 14;
    riskFlags.push(`Low hire rate (${hireRate}%).`);
  }

  if ((reviews ?? 0) < 1 && (jobsPosted ?? 0) > 0) {
    engagement -= 12;
    engagementCap = Math.min(engagementCap, 52);
    riskFlags.push("Client has jobs posted but no reviews visible.");
  }

  if (!lastViewed.trim()) {
    engagement -= 14;
    riskFlags.push("No “last viewed by client” signal in import.");
  } else if (/week|month/i.test(lastViewed) && !/hour|minute|today|yesterday|day/i.test(lastViewed)) {
    engagement -= 10;
    riskFlags.push("Client view signal looks stale.");
  }

  engagement -= proposalCompetitionPenalty(proposals);
  if (proposalCompetitionPenalty(proposals) >= 12) {
    riskFlags.push(`High competition (${proposals || "many proposals"}).`);
  }

  if (interviewing != null && interviewing > 0) {
    engagement += Math.min(10, interviewing * 4);
    engagementFactors.push(`Client actively interviewing (${interviewing}).`);
  }

  const descLen = ctx.description.trim().length;
  if (descLen < 120) {
    genuineness -= 20;
    genuinenessCap = Math.min(genuinenessCap, 50);
    riskFlags.push("Very short or thin job description.");
  } else if (descLen < 280) {
    genuineness -= 8;
  }

  const connects = ctx.connectsRequired;
  if (connects != null && connects >= 20) {
    engagement -= 6;
    riskFlags.push(`High Connects cost (${connects}).`);
  }

  engagement = Math.round(engagement * 0.9);
  genuineness = Math.round(genuineness * 0.88);

  engagement = Math.max(0, Math.min(engagementCap, engagement));
  genuineness = Math.max(0, Math.min(genuinenessCap, genuineness));

  let creditWorthIt = analysis.creditWorthIt;
  if (engagement < 38 || genuineness < 42) {
    creditWorthIt = "no";
  } else if (engagement < 52 || genuineness < 52 || (connects ?? 0) >= 16) {
    creditWorthIt = "maybe";
  }

  const recommendApply =
    engagement >= 60 && genuineness >= 58 && creditWorthIt !== "no";

  return {
    ...analysis,
    engagementScore: engagement,
    genuinenessScore: genuineness,
    recommendApply,
    creditWorthIt,
    riskFlags: [...new Set(riskFlags)],
    engagementFactors,
  };
}