import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  resumeId: z.string(),
  label: z.string().optional(),
  template: z.string().optional(),
  exportType: z.enum(["pdf", "docx", "json", "ai"]),
  snapshot: z.unknown(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = schema.parse(await request.json());
    const resume = await prisma.resume.findFirst({
      where: { id: body.resumeId, userId },
    });
    if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: resume.id,
        label: body.label ?? `${body.exportType.toUpperCase()} export`,
        template: body.template ?? resume.template,
        exportType: body.exportType,
        snapshot: JSON.stringify(body.snapshot),
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to save version" }, { status: 500 });
  }
}
