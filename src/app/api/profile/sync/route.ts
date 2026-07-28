import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfile, profileInclude, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileToResumeData } from "@/lib/resume-mapper";
import type { ResumeData } from "@/types/resume";

/**
 * Sync guest/local editor data into the authenticated master profile.
 */
const schema = z.object({
  resume: z.custom<ResumeData>(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const { resume } = schema.parse(await request.json());

    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          fullName: resume.personal.fullName,
          headline: resume.personal.title,
          summary: resume.summary,
          email: resume.personal.email,
          phone: resume.personal.phone,
          address: resume.personal.location,
          website: resume.personal.website,
          github: resume.personal.github,
          linkedin: resume.personal.linkedin,
        },
      });

      await tx.experience.deleteMany({ where: { profileId: profile.id } });
      await tx.education.deleteMany({ where: { profileId: profile.id } });
      await tx.project.deleteMany({ where: { profileId: profile.id } });
      await tx.skill.deleteMany({ where: { profileId: profile.id } });

      if (resume.experiences.length) {
        await tx.experience.createMany({
          data: resume.experiences.map((item, index) => ({
            profileId: profile.id,
            company: item.company,
            role: item.role,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            current: item.current,
            description: item.description,
            achievements: item.description,
            sortOrder: index,
          })),
        });
      }

      if (resume.education.length) {
        await tx.education.createMany({
          data: resume.education.map((item, index) => ({
            profileId: profile.id,
            institution: item.school,
            degree: item.degree,
            field: item.field,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            description: item.details,
            sortOrder: index,
          })),
        });
      }

      if (resume.portfolio.length) {
        await tx.project.createMany({
          data: resume.portfolio.map((item, index) => ({
            profileId: profile.id,
            name: item.name,
            description: item.description,
            liveUrl: item.url,
            technologies: item.technologies,
            sortOrder: index,
          })),
        });
      }

      const skillRows = resume.skills.flatMap((group, gIndex) =>
        group.skills
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name, sIndex) => ({
            profileId: profile.id,
            category: group.category || "Skills",
            name,
            sortOrder: gIndex * 100 + sIndex,
          })),
      );
      if (skillRows.length) await tx.skill.createMany({ data: skillRows });
    });

    const updated = await prisma.profile.findUniqueOrThrow({
      where: { id: profile.id },
      include: profileInclude,
    });

    return NextResponse.json({
      profile: updated,
      resumeData: profileToResumeData(updated),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Failed to sync profile" }, { status: 500 });
  }
}
