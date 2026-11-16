import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiMode, requireUserId } from "@/lib/api";
import { getConfiguredProviders, type AIMode } from "@/lib/ai/providers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const mode = await getAiMode(userId);
    const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
    return NextResponse.json({
      mode,
      primaryResumeId: prefs?.primaryResumeId ?? null,
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

const schema = z
  .object({
    aiMode: z.enum(["online", "local"]).optional(),
    primaryResumeId: z.string().nullable().optional(),
  })
  .refine((b) => b.aiMode !== undefined || b.primaryResumeId !== undefined, {
    message: "No preference fields to update",
  });

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    if (body.primaryResumeId) {
      const owned = await prisma.resume.findFirst({
        where: { id: body.primaryResumeId, userId },
      });
      if (!owned) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        aiMode: body.aiMode ?? "online",
        primaryResumeId: body.primaryResumeId ?? null,
      },
      update: {
        ...(body.aiMode !== undefined ? { aiMode: body.aiMode } : {}),
        ...(body.primaryResumeId !== undefined
          ? { primaryResumeId: body.primaryResumeId }
          : {}),
      },
    });
    return NextResponse.json({
      mode: prefs.aiMode as AIMode,
      primaryResumeId: prefs.primaryResumeId,
      onlineProviders: getConfiguredProviders("online"),
      localProviders: getConfiguredProviders("local"),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
