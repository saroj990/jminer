import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfile, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({
  category: z.string().optional(),
  name: z.string().optional(),
  level: z.string().optional(),
  sortOrder: z.number().optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const items = await prisma.skill.findMany({
      where: { profileId: profile.id },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load skills" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const body = itemSchema.parse(await request.json());
    const count = await prisma.skill.count({ where: { profileId: profile.id } });
    const item = await prisma.skill.create({
      data: { profileId: profile.id, sortOrder: count, ...body },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const body = z.object({ id: z.string(), data: itemSchema }).parse(await request.json());
    const existing = await prisma.skill.findFirst({
      where: { id: body.id, profileId: profile.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = await prisma.skill.update({ where: { id: body.id }, data: body.data });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to update skill" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    const profile = await ensureProfile(userId);
    const { id } = z.object({ id: z.string() }).parse(await request.json());
    await prisma.skill.deleteMany({ where: { id, profileId: profile.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete skill" }, { status: 500 });
  }
}
