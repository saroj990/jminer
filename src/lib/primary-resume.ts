import { ensureProfile, profileInclude } from "@/lib/api";
import { profileToResumeData } from "@/lib/resume-mapper";
import { parseResumeSnapshot } from "@/lib/resume-snapshot";
import { prisma } from "@/lib/prisma";
import type { ResumeData } from "@/types/resume";

export type PrimaryResumeSource = {
  kind: "primary" | "latest-snapshot" | "master-profile";
  resumeId?: string;
  resumeName?: string;
};

export async function loadResumeDataFromResumeId(
  userId: string,
  resumeId: string,
): Promise<{ data: ResumeData; name: string } | null> {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
  if (!resume) return null;

  const version = await prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
  });
  const data = parseResumeSnapshot(version?.snapshot);
  if (!data) return null;
  return { data, name: resume.name };
}

export async function getPrimaryResumeForUser(userId: string): Promise<{
  resume: ResumeData;
  source: PrimaryResumeSource;
}> {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

  if (prefs?.primaryResumeId) {
    const loaded = await loadResumeDataFromResumeId(userId, prefs.primaryResumeId);
    if (loaded) {
      return {
        resume: loaded.data,
        source: {
          kind: "primary",
          resumeId: prefs.primaryResumeId,
          resumeName: loaded.name,
        },
      };
    }
  }

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  for (const row of resumes) {
    const loaded = await loadResumeDataFromResumeId(userId, row.id);
    if (loaded) {
      return {
        resume: loaded.data,
        source: {
          kind: "latest-snapshot",
          resumeId: row.id,
          resumeName: loaded.name,
        },
      };
    }
  }

  await ensureProfile(userId);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: profileInclude,
  });
  if (!profile) {
    throw new Error("No profile found");
  }

  return {
    resume: profileToResumeData(profile),
    source: { kind: "master-profile" },
  };
}

export function resumeHasContent(resume: ResumeData): boolean {
  return Boolean(
    resume.summary.trim() ||
      resume.experiences.some((e) => e.role.trim() || e.description.trim()) ||
      resume.skills.some((s) => s.skills.trim()),
  );
}