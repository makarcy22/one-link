import nodemailer from "nodemailer";

// Generic SMTP sender. Configure via .env (see SMTP section).
// When unconfigured, emails print to the server console (local dev mode).
const configured = Boolean(process.env.SMTP_HOST);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
        : undefined,
    })
  : null;

const FROM = process.env.SMTP_FROM || "One Link <noreply@localhost>";

export function isEmailConfigured(): boolean {
  return configured;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    console.log(`[dev] email to ${to} | ${subject}\n${html}`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}
