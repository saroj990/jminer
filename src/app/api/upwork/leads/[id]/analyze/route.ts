import { NextResponse } from "next/server";
import { requireUserId, getAiMode } from "@/lib/api";
import { extractJson } from "@/lib/ai/prompts";
import { generateWithFallback } from "@/lib/ai/providers";
import { buildUpworkAnalyzeMessages } from "@/lib/ai/upwork";
import { prisma } from "@/lib/prisma";
import { parseJsonObject, parseTechStackJson, serializeLead } from "@/lib/upwork-db";
import { upworkAnalysisSchema } from "@/types/upwork-lead";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await prisma.upworkJobLead.findFirst({ where: { id, userId } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const mode = await getAiMode(userId);
    const result = await generateWithFallback(
      mode,
      buildUpworkAnalyzeMessages({
        title: row.title,
        description: row.description,
        techStack: parseTechStackJson(row.techStackJson),
        connectsRequired: row.connectsRequired,
        hourlyRateText: row.hourlyRateText,
        durationText: row.durationText,
        experienceLevel: row.experienceLevel,
        projectType: row.projectType,
        postedAtText: row.postedAtText,
        clientInfo: parseJsonObject(row.clientInfoJson),
        activity: parseJsonObject(row.activityJson),
      }),
    );

    const analysis = upworkAnalysisSchema.parse(extractJson(result.text));

    const updated = await prisma.upworkJobLead.update({
      where: { id },
      data: {
        engagementScore: Math.round(analysis.engagementScore),
        genuinenessScore: Math.round(analysis.genuinenessScore),
        aiAnalysisJson: JSON.stringify(analysis),
        analyzedAt: new Date(),
      },
    });

    return NextResponse.json({
      lead: serializeLead(updated),
      provider: result.provider,
      model: result.model,
      mode,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 502 },
    );
  }
}