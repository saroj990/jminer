import type { JobApplication } from "@prisma/client";
import type { JobApplicationInput, SkillFitAnalysis } from "@/types/job-application";
import { normalizeJobUrl } from "@/lib/upwork-posted-at";
import { parseTechStackJson } from "@/lib/upwork-db";

export function techStackFromInput(stack?: string[]): string {
  return JSON.stringify(stack ?? []);
}

export function applicationFromInput(input: JobApplicationInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    jobUrl: normalizeJobUrl(input.jobUrl),
    jobSource: input.jobSource ?? "other",
    techStackJson: techStackFromInput(input.techStack),
    status: input.status ?? "draft",
    appliedAt: input.appliedAt ? new Date(input.appliedAt) : null,
    notes: input.notes?.trim() ?? "",
    upworkLeadId: input.upworkLeadId ?? null,
  };
}

function parseJsonRecord(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function serializeApplication(row: JobApplication) {
  const skillFitRaw = parseJsonRecord(row.skillFitJson);
  const atsRaw = parseJsonRecord(row.atsAnalysisJson);

  return {
    id: row.id,
    upworkLeadId: row.upworkLeadId,
    title: row.title,
    description: row.description,
    jobUrl: normalizeJobUrl(row.jobUrl),
    jobSource: row.jobSource,
    techStack: parseTechStackJson(row.techStackJson),
    status: row.status,
    appliedAt: row.appliedAt?.toISOString() ?? null,
    notes: row.notes,
    skillFitScore: row.skillFitScore,
    skillFit: Object.keys(skillFitRaw).length ? (skillFitRaw as Partial<SkillFitAnalysis>) : null,
    skillFitAt: row.skillFitAt?.toISOString() ?? null,
    atsScore: row.atsScore,
    atsAnalysis: Object.keys(atsRaw).length ? atsRaw : null,
    atsScoredAt: row.atsScoredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}