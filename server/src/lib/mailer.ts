import nodemailer from "nodemailer";
import { env, hasSmtp } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!hasSmtp) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

/**
 * Sends an email. If SMTP is not configured, the message is logged to the
 * console so the product remains fully usable in development.
 */
export async function sendMail(options: MailOptions): Promise<{ delivered: boolean }> {
  const tx = getTransporter();
  if (!tx) {
    console.log("\n[mailer] SMTP not configured — email preview:");
    console.log(`  to:      ${options.to}`);
    console.log(`  subject: ${options.subject}`);
    if (options.attachments?.length) {
      console.log(`  attachments: ${options.attachments.map((a) => a.filename).join(", ")}`);
    }
    return { delivered: false };
  }
  await tx.sendMail({
    from: env.mailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  });
  return { delivered: true };
}
