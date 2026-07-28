import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureProfile,
  getAiMode,
  profileInclude,
  requireUserId,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileToResumeData } from "@/lib/resume-mapper";

export async function GET() {
  try {
    const userId = await requireUserId();
    await ensureProfile(userId);
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: profileInclude,
    });
    return NextResponse.json({
      profile,
      resumeData: profileToResumeData(profile),
      aiMode: await getAiMode(userId),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

const updateSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    await ensureProfile(userId);
    const body = updateSchema.parse(await request.json());
    const profile = await prisma.profile.update({
      where: { userId },
      data: body,
      include: profileInclude,
    });
    return NextResponse.json({
      profile,
      resumeData: profileToResumeData(profile),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
