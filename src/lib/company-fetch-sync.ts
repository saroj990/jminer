import type { ParsedCareersJob } from "@/types/company-tracker";
import { listingExternalKey } from "@/lib/company-listing-key";
import { resolveJobUrl } from "@/lib/company-html";
import { prisma } from "@/lib/prisma";

export async function syncListingsFromParsedJobs(
  userId: string,
  companyId: string,
  careersUrl: string,
  jobs: ParsedCareersJob[],
): Promise<{ added: number; updated: number; removed: number; newIds: string[] }> {
  const now = new Date();
  const seen = new Set<string>();
  const newIds: string[] = [];
  let added = 0;
  let updated = 0;

  for (const job of jobs) {
    const jobUrl = resolveJobUrl(job.jobUrl ?? "", careersUrl);
    const title = job.title.trim() || "Untitled role";
    const key = listingExternalKey(title, jobUrl);
    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await prisma.companyJobListing.findUnique({
      where: { companyId_externalKey: { companyId, externalKey: key } },
    });

    const data = {
      title,
      jobUrl,
      locationText: job.locationText?.trim() ?? "",
      descriptionSnippet: job.snippet?.trim() ?? "",
      techStackJson: JSON.stringify(job.techStack ?? []),
      active: true,
      lastSeenAt: now,
    };

    if (!existing) {
      const created = await prisma.companyJobListing.create({
        data: {
          userId,
          companyId,
          externalKey: key,
          firstSeenAt: now,
          ...data,
        },
      });
      newIds.push(created.id);
      added += 1;
    } else {
      await prisma.companyJobListing.update({
        where: { id: existing.id },
        data,
      });
      if (!existing.skillFitScore) newIds.push(existing.id);
      updated += 1;
    }
  }

  const stale = await prisma.companyJobListing.findMany({
    where: { companyId, active: true },
  });
  let removed = 0;
  for (const row of stale) {
    if (!seen.has(row.externalKey)) {
      await prisma.companyJobListing.update({
        where: { id: row.id },
        data: { active: false },
      });
      removed += 1;
    }
  }

  return { added, updated, removed, newIds };
}