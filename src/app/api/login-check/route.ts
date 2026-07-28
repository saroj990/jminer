import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * Pre-check used by the login form to distinguish bad credentials vs unverified email.
 */
export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { passwordHash: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, reason: "invalid" as const });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, reason: "invalid" as const });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ ok: false, reason: "unverified" as const });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" as const }, { status: 400 });
  }
}
