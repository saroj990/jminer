import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { companyFromInput, serializeCompany } from "@/lib/company-db";
import { normalizeJobUrl } from "@/lib/upwork-posted-at";
import { prisma } from "@/lib/prisma";
import { trackedCompanyInputSchema } from "@/types/company-tracker";

type Params = { params: Promise<{ id: string }> };

async function ownedCompany(userId: string, id: string) {
  const row = await prisma.trackedCompany.findFirst({ where: { id, userId } });
  if (!row) throw new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  return row;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const row = await ownedCompany(userId, id);
    const listings = await prisma.companyJobListing.findMany({
      where: { companyId: id },
      orderBy: [{ active: "desc" }, { skillFitScore: "desc" }, { lastSeenAt: "desc" }],
    });
    return NextResponse.json({ company: serializeCompany(row, listings) });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load company" }, { status: 500 });
  }
}

const patchSchema = trackedCompanyInputSchema.partial();

export async function PATCH(request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedCompany(userId, id);
    const body = patchSchema.parse(await request.json());

    const row = await prisma.trackedCompany.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.websiteUrl !== undefined
          ? { websiteUrl: normalizeJobUrl(body.websiteUrl) }
          : {}),
        ...(body.careersUrl !== undefined
          ? {
              careersUrl: body.careersUrl.trim(),
              careersUrlSource: body.careersUrlSource ?? "user",
            }
          : {}),
        ...(body.careersUrlSource !== undefined
          ? { careersUrlSource: body.careersUrlSource }
          : {}),
        ...(body.fetchIntervalMinutes !== undefined
          ? { fetchIntervalMinutes: body.fetchIntervalMinutes }
          : {}),
      },
    });

    const listings = await prisma.companyJobListing.findMany({ where: { companyId: id } });
    return NextResponse.json({ company: serializeCompany(row, listings) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await ownedCompany(userId, id);
    await prisma.trackedCompany.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}