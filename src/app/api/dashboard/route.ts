import { NextResponse } from "next/server";
import { ensureProfile, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);

    const [
      resumes,
      experiences,
      projects,
      skills,
      education,
      recentVersions,
    ] = await Promise.all([
      prisma.resume.count({ where: { userId } }),
      prisma.experience.count({ where: { profileId: profile.id } }),
      prisma.project.count({ where: { profileId: profile.id } }),
      prisma.skill.count({ where: { profileId: profile.id } }),
      prisma.education.count({ where: { profileId: profile.id } }),
      prisma.resumeVersion.findMany({
        where: { resume: { userId } },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { resume: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        resumes,
        experiences,
        projects,
        skills,
        education,
      },
      recentActivity: recentVersions.map((v) => ({
        id: v.id,
        resumeName: v.resume.name,
        exportType: v.exportType,
        template: v.template,
        label: v.label,
        createdAt: v.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
