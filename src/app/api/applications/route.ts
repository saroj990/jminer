import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api";
import { applicationFromInput, serializeApplication } from "@/lib/application-db";
import { prisma } from "@/lib/prisma";
import { jobApplicationInputSchema } from "@/types/job-application";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ applications: rows.map(serializeApplication) });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

const createSchema = jobApplicationInputSchema;

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = createSchema.parse(await request.json());

    if (body.upworkLeadId) {
      const lead = await prisma.upworkJobLead.findFirst({
        where: { id: body.upworkLeadId, userId },
      });
      if (!lead) {
        return NextResponse.json({ error: "Upwork lead not found" }, { status: 400 });
      }
    }

    const row = await prisma.jobApplication.create({
      data: { userId, ...applicationFromInput(body) },
    });

    return NextResponse.json({ application: serializeApplication(row) });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid application payload" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}