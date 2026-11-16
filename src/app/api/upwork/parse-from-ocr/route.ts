import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import {
  buildUpworkParseFromOcrMessages,
  parseUpworkExtractJson,
} from "@/lib/ai/upwork";
import { generateWithFallback } from "@/lib/ai/providers";
import { normalizeUpworkParsed } from "@/lib/normalize-upwork-parsed";

const schema = z.object({
  ocrText: z.string().min(80),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());

    const mode = await getAiMode(userId);
    const result = await generateWithFallback(
      mode,
      buildUpworkParseFromOcrMessages(body.ocrText),
    );

    let parsed;
    try {
      parsed = normalizeUpworkParsed(parseUpworkExtractJson(result.text));
    } catch (shapeErr) {
      const message =
        shapeErr instanceof z.ZodError
          ? `AI JSON did not match expected fields: ${shapeErr.issues.map((i) => i.path.join(".")).join(", ")}`
          : shapeErr instanceof Error
            ? shapeErr.message
            : "Could not parse AI response";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json({
      parsed,
      ocrCharCount: body.ocrText.length,
      provider: result.provider,
      model: result.model,
      mode,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error:
            "Request invalid: OCR text must be at least 80 characters after browser OCR.",
        },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 502 },
    );
  }
}