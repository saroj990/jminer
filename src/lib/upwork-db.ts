import type { UpworkJobLead } from "@prisma/client";
import type { ParsedUpworkJob, UpworkAnalysis } from "@/types/upwork-lead";
import { clientDisplayName } from "@/types/upwork-lead";

export function parseTechStackJson(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function leadFromParsed(parsed: ParsedUpworkJob) {
  const client = parsed.client;
  return {
    title: parsed.title.trim() || "Untitled job",
    jobUrl: parsed.jobUrl?.trim() || "",
    postedAtText: parsed.postedAtText?.trim() || "",
    description: parsed.description.trim(),
    techStackJson: JSON.stringify(parsed.techStack ?? []),
    connectsRequired: parsed.connectsRequired ?? null,
    hourlyRateText: parsed.hourlyRateText?.trim() || "",
    durationText: parsed.durationText?.trim() || "",
    experienceLevel: parsed.experienceLevel?.trim() || "",
    projectType: parsed.projectType?.trim() || "",
    clientName: clientDisplayName(client),
    clientInfoJson: JSON.stringify(client ?? {}),
    activityJson: JSON.stringify(parsed.activity ?? {}),
  };
}

export function serializeLead(row: UpworkJobLead) {
  const analysis = parseJsonObject(row.aiAnalysisJson) as Partial<UpworkAnalysis>;
  return {
    id: row.id,
    title: row.title,
    jobUrl: row.jobUrl,
    postedAtText: row.postedAtText,
    description: row.description,
    techStack: parseTechStackJson(row.techStackJson),
    connectsRequired: row.connectsRequired,
    hourlyRateText: row.hourlyRateText,
    durationText: row.durationText,
    experienceLevel: row.experienceLevel,
    projectType: row.projectType,
    clientName: row.clientName,
    clientInfo: parseJsonObject(row.clientInfoJson),
    activity: parseJsonObject(row.activityJson),
    engagementScore: row.engagementScore,
    genuinenessScore: row.genuinenessScore,
    atsScore: row.atsScore,
    atsAnalysis: (() => {
      try {
        const v = JSON.parse(row.atsAnalysisJson) as Record<string, unknown>;
        return Object.keys(v).length ? v : null;
      } catch {
        return null;
      }
    })(),
    atsScoredAt: row.atsScoredAt?.toISOString() ?? null,
    analysis: Object.keys(analysis).length ? analysis : null,
    analyzedAt: row.analyzedAt?.toISOString() ?? null,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}