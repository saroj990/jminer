import { NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const normalized = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    // Always return success to avoid email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({
        ok: true,
        message: "If that account needs verification, a new email was sent.",
      });
    }

    const { verifyUrl } = await createAndSendVerificationEmail(user);

    return NextResponse.json({
      ok: true,
      message: "Verification email sent.",
      ...(process.env.NODE_ENV === "development" &&
      !process.env.RESEND_API_KEY &&
      !process.env.SMTP_HOST
        ? { devVerifyUrl: verifyUrl }
        : {}),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Could not resend verification email" }, { status: 500 });
  }
}
