import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeLead } from "@/lib/upwork-db";
import {
  derivePostedAtFromRelativeText,
  normalizeJobUrl,
} from "@/lib/upwork-posted-at";
import { upworkLeadInputSchema } from "@/types/upwork-lead";

type Params = { params: Promise<{ id: string }> };

async function ownedLead(userId: string, id: string) {
  const row = await prisma.upworkJobLead.findFirst({ where: { id, userId } });
  if (!row) throw new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return row;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await ownedLead(userId, id);
    return NextResponse.json({ lead: serializeLead(row) });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}

const patchSchema = upworkLeadInputSchema.partial();

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedLead(userId, id);
    const body = patchSchema.parse(await request.json());

    const row = await prisma.upworkJobLead.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.jobUrl !== undefined ? { jobUrl: normalizeJobUrl(body.jobUrl) } : {}),
        ...(body.postedAtText !== undefined
          ? {
              postedAtText: body.postedAtText,
              postedAt:
                derivePostedAtFromRelativeText(body.postedAtText, new Date()) ??
                null,
            }
          : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.techStack !== undefined
          ? { techStackJson: JSON.stringify(body.techStack) }
          : {}),
        ...(body.connectsRequired !== undefined
          ? { connectsRequired: body.connectsRequired }
          : {}),
        ...(body.hourlyRateText !== undefined ? { hourlyRateText: body.hourlyRateText } : {}),
        ...(body.durationText !== undefined ? { durationText: body.durationText } : {}),
        ...(body.experienceLevel !== undefined
          ? { experienceLevel: body.experienceLevel }
          : {}),
        ...(body.projectType !== undefined ? { projectType: body.projectType } : {}),
        ...(body.clientName !== undefined ? { clientName: body.clientName } : {}),
        ...(body.clientInfo !== undefined
          ? { clientInfoJson: JSON.stringify(body.clientInfo) }
          : {}),
        ...(body.activity !== undefined
          ? { activityJson: JSON.stringify(body.activity) }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    return NextResponse.json({ lead: serializeLead(row) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedLead(userId, id);
    await prisma.upworkJobLead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}