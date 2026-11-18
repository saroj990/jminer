import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { companyFromInput, serializeCompany } from "@/lib/company-db";
import { prisma } from "@/lib/prisma";
import { trackedCompanyInputSchema } from "@/types/company-tracker";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.trackedCompany.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    const withCounts = await Promise.all(
      rows.map(async (row) => {
        const listings = await prisma.companyJobListing.findMany({
          where: { companyId: row.id },
        });
        return serializeCompany(row, listings);
      }),
    );
    return NextResponse.json({ companies: withCounts });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = trackedCompanyInputSchema.parse(await request.json());
    const row = await prisma.trackedCompany.create({
      data: { userId, ...companyFromInput(body) },
    });
    return NextResponse.json({ company: serializeCompany(row, []) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid company payload" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}