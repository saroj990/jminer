import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { serializeApplication } from "@/lib/application-db";
import { normalizeJobUrl } from "@/lib/upwork-posted-at";
import { prisma } from "@/lib/prisma";
import { jobApplicationInputSchema, jobApplicationStatusSchema } from "@/types/job-application";

type Params = { params: Promise<{ id: string }> };

async function ownedApplication(userId: string, id: string) {
  const row = await prisma.jobApplication.findFirst({ where: { id, userId } });
  if (!row) throw new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return row;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await ownedApplication(userId, id);
    return NextResponse.json({ application: serializeApplication(row) });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load application" }, { status: 500 });
  }
}

const patchSchema = jobApplicationInputSchema.partial();

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedApplication(userId, id);
    const body = patchSchema.parse(await request.json());

    if (body.upworkLeadId) {
      const lead = await prisma.upworkJobLead.findFirst({
        where: { id: body.upworkLeadId, userId },
      });
      if (!lead) {
        return NextResponse.json({ error: "Upwork lead not found" }, { status: 400 });
      }
    }

    await prisma.jobApplication.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.jobUrl !== undefined ? { jobUrl: normalizeJobUrl(body.jobUrl) } : {}),
        ...(body.jobSource !== undefined ? { jobSource: body.jobSource } : {}),
        ...(body.techStack !== undefined
          ? { techStackJson: JSON.stringify(body.techStack) }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.appliedAt !== undefined
          ? { appliedAt: body.appliedAt ? new Date(body.appliedAt) : null }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes.trim() } : {}),
        ...(body.upworkLeadId !== undefined
          ? { upworkLeadId: body.upworkLeadId }
          : {}),
      },
    });

    if (
      body.status &&
      jobApplicationStatusSchema.safeParse(body.status).success &&
      body.status === "applied" &&
      body.appliedAt === undefined
    ) {
      const current = await prisma.jobApplication.findUnique({ where: { id } });
      if (current && !current.appliedAt) {
        await prisma.jobApplication.update({
          where: { id },
          data: { appliedAt: new Date() },
        });
      }
    }

    const updated = await prisma.jobApplication.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ application: serializeApplication(updated) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedApplication(userId, id);
    await prisma.jobApplication.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}