import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import {
  generateWithFallback,
  getConfiguredProviders,
  type AIMode,
} from "@/lib/ai/providers";
import { buildTailorMessages, extractJson } from "@/lib/ai/prompts";
import type { ResumeData } from "@/types/resume";

const baseSchema = z.object({
  jobDescription: z.string().min(40),
  resume: z.custom<ResumeData>(),
  modeOverride: z.enum(["online", "local"]).optional(),
});

async function resolveMode(userId: string, override?: AIMode): Promise<AIMode> {
  if (override) return override;
  return getAiMode(userId);
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = baseSchema.parse(await request.json());
    const mode = await resolveMode(userId, body.modeOverride);
    const result = await generateWithFallback(
      mode,
      buildTailorMessages({
        resume: body.resume,
        jobDescription: body.jobDescription,
      }),
    );
    const tailored = extractJson<{
      summary: string;
      experiences: Array<{ id: string; description: string }>;
      skillsHighlight: string[];
      notes: string[];
    }>(result.text);

    return NextResponse.json({
      tailored,
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid tailor request" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI tailor failed" },
      { status: 502 },
    );
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const mode = await getAiMode(userId);
    return NextResponse.json({
      mode,
      onlineProviders: getConfiguredProviders("online"),
      localProviders: getConfiguredProviders("local"),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load AI status" }, { status: 500 });
  }
}
