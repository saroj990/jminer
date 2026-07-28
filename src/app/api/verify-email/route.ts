import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/lib/email-verification";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, email: result.email });
}

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(request: Request) {
  try {
    const { token } = bodySchema.parse(await request.json());
    const result = await verifyEmailToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, email: result.email });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
