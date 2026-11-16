import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { leadFromParsed, serializeLead } from "@/lib/upwork-db";
import { parsedUpworkJobSchema, upworkLeadInputSchema } from "@/types/upwork-lead";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.upworkJobLead.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({
      leads: rows.map(serializeLead),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

const createSchema = upworkLeadInputSchema.or(
  z.object({ parsed: parsedUpworkJobSchema }),
);

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await request.json());

    const data =
      "parsed" in body
        ? leadFromParsed(body.parsed)
        : {
            title: body.title,
            jobUrl: body.jobUrl?.trim() || "",
            postedAtText: body.postedAtText?.trim() || "",
            description: body.description?.trim() || "",
            techStackJson: JSON.stringify(body.techStack ?? []),
            connectsRequired: body.connectsRequired ?? null,
            hourlyRateText: body.hourlyRateText?.trim() || "",
            durationText: body.durationText?.trim() || "",
            experienceLevel: body.experienceLevel?.trim() || "",
            projectType: body.projectType?.trim() || "",
            clientName: body.clientName?.trim() || "",
            clientInfoJson: JSON.stringify(body.clientInfo ?? {}),
            activityJson: JSON.stringify(body.activity ?? {}),
            notes: body.notes?.trim() || "",
            status: body.status ?? "interested",
          };

    if (!data.clientName && "clientInfoJson" in data) {
      try {
        const c = JSON.parse(data.clientInfoJson) as { location?: string; industry?: string };
        data.clientName =
          [c.location, c.industry].filter(Boolean).join(" · ") || "Unknown client";
      } catch {
        data.clientName = "Unknown client";
      }
    }

    const row = await prisma.upworkJobLead.create({
      data: { userId, ...data },
    });

    return NextResponse.json({ lead: serializeLead(row) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}