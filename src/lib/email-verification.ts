import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function appUrl() {
  return (process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function createAndSendVerificationEmail(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const verifyUrl = `${appUrl()}/verify-email?token=${token}`;
  const greeting = user.name ? `Hi ${user.name},` : "Hi,";

  await sendEmail({
    to: user.email,
    subject: "Verify your portFolio email",
    text: `${greeting}

Thanks for creating a portFolio account. Please verify your email by opening this link:

${verifyUrl}

This link expires in 24 hours. If you did not create an account, you can ignore this email.`,
    html: `
      <p>${greeting}</p>
      <p>Thanks for creating a <strong>portFolio</strong> account. Click the button below to verify your email:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#1f7a6c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a></p>
      <p style="color:#667;font-size:13px;">Or copy this link:<br/>${verifyUrl}</p>
      <p style="color:#667;font-size:13px;">This link expires in 24 hours.</p>
    `,
  });

  return { verifyUrl };
}

export async function verifyEmailToken(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return { ok: false as const, error: "Invalid or already used verification link." };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { ok: false as const, error: "This verification link has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true as const, email: record.user.email };
}
