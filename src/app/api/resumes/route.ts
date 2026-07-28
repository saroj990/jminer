import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { defaultResumeConfig } from "@/lib/templates";

export async function GET() {
  try {
    const userId = await requireUserId();
    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            label: true,
            exportType: true,
            createdAt: true,
            snapshot: true,
            template: true,
          },
        },
      },
    });
    return NextResponse.json({ resumes });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load resumes" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  template: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await request.json());
    const resume = await prisma.resume.create({
      data: {
        userId,
        name: body.name,
        template: body.template ?? "classic",
        config: JSON.stringify(defaultResumeConfig()),
      },
    });
    return NextResponse.json({ resume }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to create resume" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  template: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  pageSize: z.string().optional(),
  config: z.unknown().optional(),
});

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = updateSchema.parse(await request.json());
    const existing = await prisma.resume.findFirst({
      where: { id: body.id, userId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const resume = await prisma.resume.update({
      where: { id: body.id },
      data: {
        name: body.name,
        template: body.template,
        accentColor: body.accentColor,
        fontFamily: body.fontFamily,
        fontSize: body.fontSize,
        pageSize: body.pageSize,
        config:
          body.config !== undefined ? JSON.stringify(body.config) : undefined,
      },
    });
    return NextResponse.json({ resume });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    await prisma.resume.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
