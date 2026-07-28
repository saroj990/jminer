import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import { generateWithFallback, type AIMode } from "@/lib/ai/providers";
import { buildAtsMessages, extractJson } from "@/lib/ai/prompts";
import type { ResumeData } from "@/types/resume";

const schema = z.object({
  jobDescription: z.string().min(40),
  resume: z.custom<ResumeData>(),
  modeOverride: z.enum(["online", "local"]).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    const mode: AIMode = body.modeOverride ?? (await getAiMode(userId));
    const result = await generateWithFallback(
      mode,
      buildAtsMessages({
        resume: body.resume,
        jobDescription: body.jobDescription,
      }),
    );
    const analysis = extractJson<{
      score: number;
      matchedKeywords: string[];
      missingKeywords: string[];
      strengths: string[];
      recommendations: string[];
    }>(result.text);

    return NextResponse.json({
      analysis,
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ATS analysis failed" },
      { status: 502 },
    );
  }
}
