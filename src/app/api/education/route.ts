import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfile, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  grade: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  achievements: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const items = await prisma.education.findMany({
      where: { profileId: profile.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load education" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const body = itemSchema.parse(await request.json());
    const count = await prisma.education.count({ where: { profileId: profile.id } });
    const item = await prisma.education.create({
      data: { profileId: profile.id, sortOrder: count, ...body },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to create education" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const body = z.object({ id: z.string(), data: itemSchema }).parse(await request.json());
    const existing = await prisma.education.findFirst({
      where: { id: body.id, profileId: profile.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await prisma.education.update({ where: { id: body.id }, data: body.data });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update education" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    await prisma.education.deleteMany({ where: { id, profileId: profile.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete education" }, { status: 500 });
  }
}
