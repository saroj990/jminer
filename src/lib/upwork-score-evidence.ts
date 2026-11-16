import type { UpworkAnalysis } from "@/types/upwork-lead";

export type ScoreEvidenceItem = {
  id: string;
  tone: "positive" | "negative" | "neutral";
  headline: string;
  evidence: string;
  source: "client" | "activity" | "job" | "scores";
};

export type LeadEvidenceContext = {
  description: string;
  connectsRequired: number | null;
  clientInfo: Record<string, unknown>;
  activity: Record<string, unknown>;
  engagementScore: number | null;
  genuinenessScore: number | null;
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
  return typeof v === "string" ? v.trim() : "";
}

function item(
  id: string,
  tone: ScoreEvidenceItem["tone"],
  headline: string,
  evidence: string,
  source: ScoreEvidenceItem["source"],
): ScoreEvidenceItem {
  return { id, tone, headline, evidence, source };
}

export function buildScoreEvidence(
  ctx: LeadEvidenceContext,
  analysis: UpworkAnalysis | null,
): {
  engagement: ScoreEvidenceItem[];
  genuineness: ScoreEvidenceItem[];
  connects: ScoreEvidenceItem[];
} {
  const engagement: ScoreEvidenceItem[] = [];
  const genuineness: ScoreEvidenceItem[] = [];
  const connects: ScoreEvidenceItem[] = [];

  const client = ctx.clientInfo;
  const activity = ctx.activity;

  const lastViewed = str(activity.lastViewedByClient);
  const proposals = str(activity.proposalsRange);
  const interviewing = num(activity.interviewing);
  const invites = num(activity.invitesSent);
  const hireRate = num(client.hireRatePercent);
  const reviews = num(client.reviewCount);
  const spent = num(client.totalSpentUsd);
  const jobsPosted = num(client.jobsPosted);
  const paymentVerified = bool(client.paymentVerified);
  const phoneVerified = bool(client.phoneVerified);
  const descLen = ctx.description.trim().length;
  const connectsReq = ctx.connectsRequired;

  if (lastViewed) {
    const stale = /week|month/i.test(lastViewed) && !/hour|minute|today|yesterday|day/i.test(lastViewed);
    engagement.push(
      item(
        "last-viewed",
        stale ? "negative" : "positive",
        stale ? "Client view looks stale" : "Recent client activity on posting",
        `Last viewed by client: “${lastViewed}”`,
        "activity",
      ),
    );
  } else {
    engagement.push(
      item(
        "last-viewed-missing",
        "negative",
        "No view signal in import",
        "Activity block has no “last viewed by client” value.",
        "activity",
      ),
    );
  }

  if (proposals) {
    const heavy = /50|20\s*to\s*50|20-50/i.test(proposals);
    engagement.push(
      item(
        "proposals",
        heavy ? "negative" : "neutral",
        heavy ? "Crowded applicant pool" : "Proposal competition",
        `Proposals: “${proposals}”`,
        "activity",
      ),
    );
  }

  if (interviewing != null) {
    engagement.push(
      item(
        "interviewing",
        interviewing > 0 ? "positive" : "neutral",
        interviewing > 0 ? "Client is interviewing" : "No interviews started yet",
        `Interviewing: ${interviewing}`,
        "activity",
      ),
    );
  }

  if (invites != null) {
    engagement.push(
      item(
        "invites",
        invites > 0 ? "positive" : "neutral",
        invites > 0 ? "Client sent invites" : "No invites sent (from import)",
        `Invites sent: ${invites}`,
        "activity",
      ),
    );
  }

  if (hireRate != null) {
    engagement.push(
      item(
        "hire-rate",
        hireRate >= 50 ? "positive" : hireRate < 40 ? "negative" : "neutral",
        hireRate >= 50 ? "Healthy hire rate" : hireRate < 40 ? "Low hire rate" : "Moderate hire rate",
        `Hire rate: ${hireRate}%`,
        "client",
      ),
    );
  }

  if (reviews != null) {
    engagement.push(
      item(
        "reviews",
        reviews >= 1 ? "positive" : "negative",
        reviews >= 1 ? "Client has reviews" : "No reviews visible",
        `Review count: ${reviews}`,
        "client",
      ),
    );
  } else if (jobsPosted != null && jobsPosted > 0) {
    engagement.push(
      item(
        "reviews-missing",
        "negative",
        "Jobs posted but no reviews",
        `Jobs posted: ${jobsPosted}; reviews not in import.`,
        "client",
      ),
    );
  }

  if (spent != null && spent >= 10_000) {
    engagement.push(
      item(
        "spend-engagement",
        "positive",
        "Established Upwork spender",
        `Total spent: ~$${Math.round(spent).toLocaleString()}`,
        "client",
      ),
    );
  }

  if (paymentVerified === true) {
    genuineness.push(
      item(
        "payment-yes",
        "positive",
        "Payment method verified",
        "Client info: paymentVerified = true",
        "client",
      ),
    );
  } else if (paymentVerified === false) {
    genuineness.push(
      item(
        "payment-no",
        "negative",
        "Payment not verified",
        "Client info: paymentVerified = false",
        "client",
      ),
    );
  } else {
    genuineness.push(
      item(
        "payment-unknown",
        "negative",
        "Payment verification unknown",
        "Client info: paymentVerified not set in import.",
        "client",
      ),
    );
  }

  if (phoneVerified === true) {
    genuineness.push(
      item("phone", "positive", "Phone verified", "Client info: phoneVerified = true", "client"),
    );
  }

  if (spent != null) {
    genuineness.push(
      item(
        "spend-genuine",
        spent >= 1_000 ? "positive" : "negative",
        spent >= 1_000 ? "Meaningful spend history" : "Low or new spender",
        `Total spent: ~$${Math.round(spent).toLocaleString()}`,
        "client",
      ),
    );
  } else {
    genuineness.push(
      item(
        "spend-missing",
        "negative",
        "Spend not in import",
        "Client info: totalSpentUsd missing.",
        "client",
      ),
    );
  }

  genuineness.push(
    item(
      "description-length",
      descLen >= 280 ? "positive" : descLen >= 120 ? "neutral" : "negative",
      descLen >= 280
        ? "Detailed job description"
        : descLen >= 120
          ? "Moderate description length"
          : "Thin job description",
      `Description length: ${descLen} characters`,
      "job",
    ),
  );

  if (connectsReq != null) {
    connects.push(
      item(
        "connects-cost",
        connectsReq >= 16 ? "negative" : connectsReq <= 6 ? "positive" : "neutral",
        connectsReq >= 16 ? "Higher Connects cost" : "Connects required",
        `This job: ${connectsReq} Connects`,
        "job",
      ),
    );
  } else {
    connects.push(
      item(
        "connects-unknown",
        "neutral",
        "Connects unknown",
        "connectsRequired not set on this lead.",
        "job",
      ),
    );
  }

  if (ctx.engagementScore != null) {
    connects.push(
      item(
        "eng-score",
        ctx.engagementScore >= 55 ? "positive" : ctx.engagementScore < 45 ? "negative" : "neutral",
        "Engagement index (calibrated)",
        `Score: ${ctx.engagementScore}/100 — client response likelihood from activity + client signals.`,
        "scores",
      ),
    );
  }

  if (ctx.genuinenessScore != null) {
    connects.push(
      item(
        "gen-score",
        ctx.genuinenessScore >= 55 ? "positive" : ctx.genuinenessScore < 45 ? "negative" : "neutral",
        "Genuineness (calibrated)",
        `Score: ${ctx.genuinenessScore}/100 — trust in a real job vs weak/spam signals.`,
        "scores",
      ),
    );
  }

  if (proposals) {
    connects.push(
      item(
        "connects-competition",
        /50|20\s*to\s*50/i.test(proposals) ? "negative" : "neutral",
        "Competition vs Connects",
        `Proposals: “${proposals}” — more rivals means each Connect buys less attention.`,
        "activity",
      ),
    );
  }

  if (analysis) {
    for (const [i, factor] of analysis.engagementFactors.slice(0, 3).entries()) {
      engagement.push(
        item(`llm-eng-${i}`, "positive", "AI signal", factor, "scores"),
      );
    }

    const genuinenessRiskPattern =
      /payment|description|sparse|scam|verify|spend|vague|thin/i;
    const engagementRiskPattern =
      /competition|connect|proposal|view|hire|review|interview/i;
    for (const [i, flag] of analysis.riskFlags.entries()) {
      const entry = item(`llm-risk-${i}`, "negative", "Risk flag", flag, "scores");
      if (genuinenessRiskPattern.test(flag)) {
        genuineness.push(entry);
      }
      if (engagementRiskPattern.test(flag)) {
        engagement.push(entry);
      }
      if (/competition|connect|proposal|view/i.test(flag)) {
        connects.push(entry);
      }
    }

    connects.push(
      item(
        "credit-verdict",
        analysis.creditWorthIt === "yes"
          ? "positive"
          : analysis.creditWorthIt === "no"
            ? "negative"
            : "neutral",
        `Verdict: ${analysis.creditWorthIt.toUpperCase()}`,
        creditWorthItReason(analysis, ctx),
        "scores",
      ),
    );
  }

  return { engagement, genuineness, connects };
}

function creditWorthItReason(
  analysis: UpworkAnalysis,
  ctx: LeadEvidenceContext,
): string {
  const parts: string[] = [];
  if (ctx.connectsRequired != null) {
    parts.push(`${ctx.connectsRequired} Connects required`);
  }
  if (ctx.engagementScore != null && ctx.genuinenessScore != null) {
    parts.push(
      `calibrated engagement ${ctx.engagementScore}, genuineness ${ctx.genuinenessScore}`,
    );
  }
  parts.push(`model suggests “${analysis.creditWorthIt}” after rules + calibration`);
  if (analysis.recommendApply) {
    parts.push("recommendApply = yes");
  } else {
    parts.push("recommendApply = no");
  }
  return parts.join("; ") + ".";
}