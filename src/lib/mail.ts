type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends email via Resend, SMTP (nodemailer-compatible fetch to a simple SMTP HTTP bridge is not used),
 * or logs to the server console in development when no provider is configured.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ mode: string }> {
  const from =
    process.env.EMAIL_FROM?.trim() || "portFolio <onboarding@resend.dev>";

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed: ${body || res.statusText}`);
    }
    return { mode: "resend" };
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpHost && smtpUser && smtpPass) {
    // Dynamic import so the app still builds without nodemailer until SMTP is configured
    const nodemailer = await import("nodemailer");
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { mode: "smtp" };
  }

  // Dev fallback — print verification link to server logs
  console.info("\n========== EMAIL (dev console fallback) ==========");
  console.info(`To: ${input.to}`);
  console.info(`Subject: ${input.subject}`);
  console.info(input.text);
  console.info("==================================================\n");
  return { mode: "console" };
}
