import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api";
import { serializeListing } from "@/lib/company-db";
import { runSkillFitForListing } from "@/lib/company-skill-fit";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ listingId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { listingId } = await params;

    const listing = await prisma.companyJobListing.findFirst({
      where: { id: listingId, userId },
      include: { company: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { analysis, source, result, mode } = await runSkillFitForListing(
      userId,
      listingId,
      listing.company.name,
    );

    const updated = await prisma.companyJobListing.findUniqueOrThrow({
      where: { id: listingId },
    });

    return NextResponse.json({
      listing: serializeListing(updated),
      analysis,
      resumeSource: source,
      provider: result.provider,
      model: result.model,
      mode,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Skill fit failed" },
      { status: 502 },
    );
  }
}