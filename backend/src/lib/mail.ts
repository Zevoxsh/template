import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.port === 465,
  auth: { user: config.mail.user, pass: config.mail.pass },
});

async function send(to: string, subject: string, html: string) {
  await transporter.sendMail({ from: config.mail.from, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${config.frontendUrl}/verify-email?token=${token}`;
  await send(
    to,
    "Verify your email",
    `<p>Click the link below to verify your email address:</p>
     <p><a href="${url}">${url}</a></p>
     <p>This link expires in 24 hours.</p>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${config.frontendUrl}/reset-password?token=${token}`;
  await send(
    to,
    "Reset your password",
    `<p>Click the link below to reset your password:</p>
     <p><a href="${url}">${url}</a></p>
     <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
  );
}
