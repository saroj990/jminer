import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithFallback, type AIMode } from "@/lib/ai/providers";
import { buildParseResumeMessages, extractJson } from "@/lib/ai/prompts";

const schema = z.object({
  text: z.string().min(40),
  modeOverride: z.enum(["online", "local"]).optional(),
});

const parsedSchema = z.object({
  personal: z.object({
    fullName: z.string().default(""),
    title: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    website: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
  }),
  summary: z.string().default(""),
  experiences: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        location: z.string().default(""),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        current: z.boolean().default(false),
        description: z.string().default(""),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().default(""),
        degree: z.string().default(""),
        field: z.string().default(""),
        location: z.string().default(""),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        details: z.string().default(""),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string().default(""),
        skills: z.string().default(""),
      }),
    )
    .default([]),
  portfolio: z
    .array(
      z.object({
        name: z.string().default(""),
        url: z.string().default(""),
        description: z.string().default(""),
        technologies: z.string().default(""),
      }),
    )
    .default([]),
});

function defaultAiMode(): AIMode {
  return process.env.AI_DEFAULT_MODE === "local" ? "local" : "online";
}

/** Open endpoint — no auth. Accepts extracted resume text only (never stores files). */
export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const mode: AIMode = body.modeOverride ?? defaultAiMode();

    const result = await generateWithFallback(
      mode,
      buildParseResumeMessages(body.text),
    );
    const raw = extractJson<unknown>(result.text);
    const parsed = parsedSchema.parse(raw);

    return NextResponse.json({
      parsed,
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Could not structure the resume. Try another file or local parse." },
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
