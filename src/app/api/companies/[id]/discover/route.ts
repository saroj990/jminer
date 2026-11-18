import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api";
import { serializeCompany } from "@/lib/company-db";
import { pickBestCareersUrl, serpSearchCareers } from "@/lib/company-search";
import { prisma } from "@/lib/prisma";
import { isUsableJobUrl } from "@/lib/upwork-posted-at";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const company = await prisma.trackedCompany.findFirst({ where: { id, userId } });
    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const results = await serpSearchCareers(company.name, company.websiteUrl);
    const pick = pickBestCareersUrl(results);
    if (!pick) {
      return NextResponse.json(
        {
          error: "No careers page found in search results. Add a careers URL manually.",
          candidates: results.slice(0, 5),
        },
        { status: 404 },
      );
    }

    const row = await prisma.trackedCompany.update({
      where: { id },
      data: {
        careersUrl: pick.url,
        careersUrlSource: pick.source,
        lastFetchError: "",
      },
    });

    const listings = await prisma.companyJobListing.findMany({ where: { companyId: id } });
    return NextResponse.json({
      company: serializeCompany(row, listings),
      suggestedUrl: pick.url,
      source: pick.source,
      candidates: pick.candidates,
      careersUrlReady: isUsableJobUrl(pick.url),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discover failed" },
      { status: 502 },
    );
  }
}