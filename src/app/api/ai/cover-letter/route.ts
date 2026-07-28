import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import { generateWithFallback, type AIMode } from "@/lib/ai/providers";
import { buildCoverLetterMessages, extractJson } from "@/lib/ai/prompts";
import type { ResumeData } from "@/types/resume";

const schema = z.object({
  jobDescription: z.string().min(40),
  resume: z.custom<ResumeData>(),
  company: z.string().optional(),
  role: z.string().optional(),
  modeOverride: z.enum(["online", "local"]).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    const mode: AIMode = body.modeOverride ?? (await getAiMode(userId));
    const result = await generateWithFallback(
      mode,
      buildCoverLetterMessages({
        resume: body.resume,
        jobDescription: body.jobDescription,
        company: body.company,
        role: body.role,
      }),
    );
    const letter = extractJson<{ subject: string; body: string }>(result.text);

    return NextResponse.json({
      letter,
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cover letter failed" },
      { status: 502 },
    );
  }
}
