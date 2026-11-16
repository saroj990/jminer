import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAiMode } from "@/lib/api";
import { generateWithFallback, type AIMode } from "@/lib/ai/providers";
import { buildParseResumeMessages, extractJson } from "@/lib/ai/prompts";
import {
  normalizeParsedResume,
  parsedResumeSchema,
} from "@/lib/normalize-parsed-resume";

const schema = z.object({
  text: z.string().min(40),
  modeOverride: z.enum(["online", "local"]).optional(),
});

function envDefaultMode(): AIMode {
  return process.env.AI_DEFAULT_MODE === "local" ? "local" : "online";
}

async function resolveMode(override?: AIMode): Promise<AIMode> {
  if (override) return override;
  try {
    const session = await auth();
    if (session?.user?.id) return getAiMode(session.user.id);
  } catch {
    // open endpoint — fall through to env default
  }
  return envDefaultMode();
}

/** Open endpoint — no auth required. Accepts extracted resume text only (never stores files). */
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const mode = await resolveMode(body.modeOverride);

    const result = await generateWithFallback(
      mode,
      buildParseResumeMessages(body.text),
    );

    let raw: unknown;
    try {
      raw = extractJson<unknown>(result.text);
    } catch (err) {
      console.error("parse-resume JSON extract failed", {
        provider: result.provider,
        model: result.model,
        preview: result.text.slice(0, 500),
      });
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `${err.message}. Try Local extract, or a stronger local model (llama3.1:8b).`
              : "AI returned invalid JSON",
        },
        { status: 502 },
      );
    }

    const normalized = normalizeParsedResume(raw);
    const parsed = parsedResumeSchema.parse(normalized);

    return NextResponse.json({
      parsed,
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error("parse-resume schema failed", err.issues.slice(0, 8));
      return NextResponse.json(
        {
          error:
            "AI JSON shape was incomplete. Try again, use Local extract, or switch to llama3.1:8b.",
        },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resume parse failed" },
      { status: 502 },
    );
  }
}
