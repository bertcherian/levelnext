import nodemailer from "nodemailer";

/**
 * Send a transactional email via Brevo SMTP (or any SMTP provider).
 * Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars.
 * Falls back gracefully if not configured — logs a warning and returns false.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@levelnext.coach",
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured — skipping email to", to);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"LevelNext" <${from}>`,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]*>/g, ""),
    });

    console.log(`[Email] Sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}
