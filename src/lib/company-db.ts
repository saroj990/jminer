import type { CompanyJobListing, TrackedCompany } from "@prisma/client";
import type { TrackedCompanyInput } from "@/types/company-tracker";
import { intervalLabel } from "@/types/company-tracker";
import type { SkillFitAnalysis } from "@/types/job-application";
import { normalizeJobUrl, isUsableJobUrl } from "@/lib/upwork-posted-at";
import { parseTechStackJson } from "@/lib/upwork-db";

export function companyFromInput(input: TrackedCompanyInput) {
  return {
    name: input.name.trim(),
    websiteUrl: normalizeJobUrl(input.websiteUrl),
    careersUrl: input.careersUrl?.trim() ?? "",
    careersUrlSource: input.careersUrlSource ?? (input.careersUrl?.trim() ? "user" : ""),
    fetchIntervalMinutes: input.fetchIntervalMinutes ?? 1440,
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

export function serializeListing(row: CompanyJobListing) {
  const skillFitRaw = parseJsonRecord(row.skillFitJson);
  return {
    id: row.id,
    companyId: row.companyId,
    title: row.title,
    jobUrl: normalizeJobUrl(row.jobUrl),
    locationText: row.locationText,
    descriptionSnippet: row.descriptionSnippet,
    techStack: parseTechStackJson(row.techStackJson),
    active: row.active,
    skillFitScore: row.skillFitScore,
    skillFit: Object.keys(skillFitRaw).length
      ? (skillFitRaw as Partial<SkillFitAnalysis>)
      : null,
    skillFitAt: row.skillFitAt?.toISOString() ?? null,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}

export function serializeCompany(
  row: TrackedCompany,
  listings: CompanyJobListing[] = [],
) {
  const active = listings.filter((l) => l.active);
  const bestFit = active.reduce<number | null>((best, l) => {
    if (l.skillFitScore == null) return best;
    if (best == null) return l.skillFitScore;
    return Math.max(best, l.skillFitScore);
  }, null);

  return {
    id: row.id,
    name: row.name,
    websiteUrl: normalizeJobUrl(row.websiteUrl),
    careersUrl: row.careersUrl,
    careersUrlHasLink: isUsableJobUrl(row.careersUrl),
    careersUrlSource: row.careersUrlSource,
    fetchIntervalMinutes: row.fetchIntervalMinutes,
    fetchIntervalLabel: intervalLabel(row.fetchIntervalMinutes),
    lastFetchedAt: row.lastFetchedAt?.toISOString() ?? null,
    lastFetchStatus: row.lastFetchStatus,
    lastFetchError: row.lastFetchError,
    listingCount: active.length,
    bestFitScore: bestFit,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    listings: listings.map(serializeListing),
  };
}