import { NextResponse } from "next/server";
import { getAiMode, requireUserId } from "@/lib/api";
import {
  buildCompanyCareersParseMessages,
  parseCareersPageJson,
} from "@/lib/ai/company";
import { generateWithFallback } from "@/lib/ai/providers";
import { serializeCompany } from "@/lib/company-db";
import { syncListingsFromParsedJobs } from "@/lib/company-fetch-sync";
import { fetchJobsViaAts, JS_HEAVY_FETCH_HINT } from "@/lib/company-ats";
import { extractLinks, fetchCareersHtml, stripHtmlToText } from "@/lib/company-html";
import { runSkillFitForListing } from "@/lib/company-skill-fit";
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
    if (!isUsableJobUrl(company.careersUrl)) {
      return NextResponse.json(
        { error: "Set or discover a careers URL before fetching." },
        { status: 400 },
      );
    }

    try {
      const html = await fetchCareersHtml(company.careersUrl);
      const ats = await fetchJobsViaAts(company.careersUrl, html);

      let jobs = ats?.jobs ?? [];
      let provider = ats ? `ats-${ats.source}` : "";
      let model = "";
      let mode = await getAiMode(userId);

      if (!jobs.length) {
        const text = stripHtmlToText(html);
        const links = extractLinks(html, company.careersUrl);

        if (text.length < 80) {
          throw new Error(JS_HEAVY_FETCH_HINT);
        }

        const result = await generateWithFallback(
          mode,
          buildCompanyCareersParseMessages({
            companyName: company.name,
            careersUrl: company.careersUrl,
            pageText: text,
            links,
          }),
        );
        provider = result.provider;
        model = result.model;
        jobs = parseCareersPageJson(result.text);
      }
      const sync = await syncListingsFromParsedJobs(
        userId,
        id,
        company.careersUrl,
        jobs,
      );

      let scored = 0;
      const scoreErrors: string[] = [];
      for (const listingId of sync.newIds) {
        try {
          await runSkillFitForListing(userId, listingId, company.name);
          scored += 1;
        } catch (e) {
          if (e instanceof Response) {
            scoreErrors.push("Primary resume not ready — skill fit skipped for new listings.");
            break;
          }
          scoreErrors.push(e instanceof Error ? e.message : "Skill fit failed");
        }
      }

      await prisma.trackedCompany.update({
        where: { id },
        data: {
          lastFetchedAt: new Date(),
          lastFetchStatus: "ok",
          lastFetchError: scoreErrors[0] ?? "",
        },
      });

      const listings = await prisma.companyJobListing.findMany({ where: { companyId: id } });
      const row = await prisma.trackedCompany.findUniqueOrThrow({ where: { id } });

      return NextResponse.json({
        company: serializeCompany(row, listings),
        sync: { ...sync, skillFitScored: scored },
        provider,
        model,
        mode,
        jobCount: jobs.length,
      });
    } catch (inner) {
      const fetchError = inner instanceof Error ? inner.message : "Fetch failed";
      await prisma.trackedCompany.update({
        where: { id },
        data: {
          lastFetchedAt: new Date(),
          lastFetchStatus: "error",
          lastFetchError: fetchError,
        },
      });
      return NextResponse.json({ error: fetchError }, { status: 502 });
    }
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 502 },
    );
  }
}