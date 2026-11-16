import { NextResponse } from "next/server";
import { getAiMode, requireUserId } from "@/lib/api";
import { buildSkillsFitMessages, extractJson } from "@/lib/ai/prompts";
import { generateWithFallback } from "@/lib/ai/providers";
import { applicationJobDescription } from "@/lib/application-job-text";
import { serializeApplication } from "@/lib/application-db";
import {
  getPrimaryResumeForUser,
  resumeHasContent,
} from "@/lib/primary-resume";
import { prisma } from "@/lib/prisma";
import { parseTechStackJson } from "@/lib/upwork-db";
import { skillFitAnalysisSchema } from "@/types/job-application";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await prisma.jobApplication.findFirst({ where: { id, userId } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const jobDescription = applicationJobDescription({
      title: row.title,
      description: row.description,
      techStack: parseTechStackJson(row.techStackJson),
      jobSource: row.jobSource,
    });

    if (jobDescription.trim().length < 40) {
      return NextResponse.json(
        { error: "Add more job description and skills before running skill fit." },
        { status: 400 },
      );
    }

    const { resume, source } = await getPrimaryResumeForUser(userId);
    if (!resumeHasContent(resume)) {
      return NextResponse.json(
        {
          error:
            source.kind === "master-profile"
              ? "No primary resume snapshot found. Save a version in Builder and set it as primary on Resumes."
              : "Primary resume has no content.",
        },
        { status: 400 },
      );
    }

    const mode = await getAiMode(userId);
    const result = await generateWithFallback(
      mode,
      buildSkillsFitMessages({ resume, jobDescription }),
    );

    const analysis = skillFitAnalysisSchema.parse(extractJson(result.text));

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        skillFitScore: Math.round(analysis.score),
        skillFitJson: JSON.stringify(analysis),
        skillFitAt: new Date(),
      },
    });

    return NextResponse.json({
      application: serializeApplication(updated),
      analysis,
      resumeSource: source,
      provider: result.provider,
      model: result.model,
      mode,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Skill fit failed" },
      { status: 502 },
    );
  }
}