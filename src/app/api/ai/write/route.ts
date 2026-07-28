import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import { generateWithFallback, type AIMode } from "@/lib/ai/providers";
import {
  buildWriteMessages,
  extractJson,
  type WriteFieldType,
} from "@/lib/ai/prompts";

const schema = z.object({
  fieldType: z.enum([
    "summary",
    "experience_bullets",
    "education_details",
    "portfolio_description",
  ]),
  text: z.string(),
  context: z.string().optional(),
  modeOverride: z.enum(["online", "local"]).optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    const mode: AIMode = body.modeOverride ?? (await getAiMode(userId));

    if (!body.text.trim() && !body.context?.trim()) {
      return NextResponse.json(
        { error: "Add some text or context before using Write with AI." },
        { status: 400 },
      );
    }

    const result = await generateWithFallback(
      mode,
      buildWriteMessages({
        fieldType: body.fieldType as WriteFieldType,
        text: body.text,
        context: body.context,
      }),
    );

    const parsed = extractJson<{ text: string }>(result.text);
    if (!parsed.text?.trim()) {
      throw new Error("AI returned empty text");
    }

    return NextResponse.json({
      text: parsed.text.trim(),
      provider: result.provider,
      model: result.model,
      mode,
      attempts: result.attempts,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid write request" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Write with AI failed" },
      { status: 502 },
    );
  }
}
