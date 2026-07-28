import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import { getConfiguredProviders, type AIMode } from "@/lib/ai/providers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const mode = await getAiMode(userId);
    return NextResponse.json({
      mode,
      onlineProviders: getConfiguredProviders("online"),
      localProviders: getConfiguredProviders("local"),
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      ollamaModel: process.env.OLLAMA_MODEL || "llama3.2",
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
  }
}

const schema = z.object({
  aiMode: z.enum(["online", "local"]),
});

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, aiMode: body.aiMode },
      update: { aiMode: body.aiMode },
    });
    return NextResponse.json({
      mode: prefs.aiMode as AIMode,
      onlineProviders: getConfiguredProviders("online"),
      localProviders: getConfiguredProviders("local"),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
