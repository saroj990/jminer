import { NextResponse } from "next/server";
import { getAiMode, requireUserId } from "@/lib/api";
import { buildAtsMessages, extractJson } from "@/lib/ai/prompts";
import { generateWithFallback } from "@/lib/ai/providers";
import {
  getPrimaryResumeForUser,
  resumeHasContent,
} from "@/lib/primary-resume";
import { prisma } from "@/lib/prisma";
import { parseTechStackJson, serializeLead } from "@/lib/upwork-db";
import { upworkLeadJobDescription } from "@/lib/upwork-job-text";

type Params = { params: Promise<{ id: string }> };

type AtsAnalysis = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  recommendations: string[];
};

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await prisma.upworkJobLead.findFirst({ where: { id, userId } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const jobDescription = upworkLeadJobDescription({
      title: row.title,
      description: row.description,
      techStack: parseTechStackJson(row.techStackJson),
      experienceLevel: row.experienceLevel,
      projectType: row.projectType,
    });

    if (jobDescription.trim().length < 40) {
      return NextResponse.json(
        {
          error:
            "This lead has too little job text for ATS. Re-import screenshots or edit the description.",
        },
        { status: 400 },
      );
    }

    const { resume, source } = await getPrimaryResumeForUser(userId);
    if (!resumeHasContent(resume)) {
      return NextResponse.json(
        {
          error:
            source.kind === "master-profile"
              ? "No primary resume snapshot found. Open Builder, export/save a version, then set it as primary on Resumes."
              : "Primary resume has no content. Save a version from Builder first.",
        },
        { status: 400 },
      );
    }

    const mode = await getAiMode(userId);
    const result = await generateWithFallback(
      mode,
      buildAtsMessages({ resume, jobDescription }),
    );

    const analysis = extractJson<AtsAnalysis>(result.text);

    const updated = await prisma.upworkJobLead.update({
      where: { id },
      data: {
        atsScore: Math.round(analysis.score),
        atsAnalysisJson: JSON.stringify(analysis),
        atsScoredAt: new Date(),
      },
    });

    return NextResponse.json({
      lead: serializeLead(updated),
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
      { error: err instanceof Error ? err.message : "ATS scoring failed" },
      { status: 502 },
    );
  }
}