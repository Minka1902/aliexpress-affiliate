import nodemailer from "nodemailer";

// If SMTP is not configured, fall back to logging emails to the console (dev-friendly).
function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: Mail): Promise<void> {
  const from = process.env.MAIL_FROM || "no-reply@example.com";
  const transport = getTransport();
  if (!transport) {
    console.log(`[mailer:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await transport.sendMail({ from, to, subject, text, html: html ?? text });
  } catch (err) {
    console.error("[mailer] failed to send", err);
  }
}

export async function notifyAdminOfSignup(userEmail: string, userName: string): Promise<void> {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin) return;
  await sendMail({
    to: admin,
    subject: "New signup awaiting approval",
    text: `${userName} (${userEmail}) just signed up and is awaiting your approval. Visit /admin to approve and assign a tracking ID.`,
  });
}

export async function notifyUserApproved(userEmail: string, userName: string): Promise<void> {
  await sendMail({
    to: userEmail,
    subject: "Your account is approved 🎉",
    text: `Hi ${userName}, your account has been approved. You can now sign in and start creating affiliate links.`,
  });
}
