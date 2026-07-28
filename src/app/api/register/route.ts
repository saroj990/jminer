import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAndSendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: body.name,
        passwordHash,
        profile: { create: { fullName: body.name, email } },
        preferences: {
          create: {
            aiMode: process.env.AI_DEFAULT_MODE === "local" ? "local" : "online",
          },
        },
        resumes: {
          create: {
            name: "Primary Resume",
            template: "classic",
            config: "{}",
          },
        },
      },
      select: { id: true, email: true, name: true },
    });

    const { verifyUrl } = await createAndSendVerificationEmail(user);

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        requiresVerification: true,
        // Exposed only when using console/dev mailer so local testing is easy
        ...(process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY && !process.env.SMTP_HOST
          ? { devVerifyUrl: verifyUrl }
          : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
