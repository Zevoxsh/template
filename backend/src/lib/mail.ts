import nodemailer from "nodemailer";
import { config } from "../config";

function createTransporter() {
  return nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: {
      type: "LOGIN",
      user: config.mail.user,
      pass: config.mail.pass,
    },
    tls: { rejectUnauthorized: false },
  });
}

async function send(to: string, subject: string, html: string) {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({ from: `"${config.mail.from}" <${config.mail.from}>`, to, subject, html });
  } catch (err) {
    console.error(`[mail] Failed to send to ${to}:`, err);
    throw err;
  }
}

export async function testSmtp(): Promise<void> {
  const transporter = createTransporter();
  await transporter.verify();
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${config.frontendUrl}/verify-email?token=${token}`;
  const siteName = config.mail.from;
  await send(
    to,
    "Vérifiez votre adresse email",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="font-size:20px;color:#1e293b">Vérifiez votre email</h2>
      <p style="color:#64748b">Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:10px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Vérifier mon email
      </a>
      <p style="color:#94a3b8;font-size:12px">Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.</p>
    </div>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${config.frontendUrl}/reset-password?token=${token}`;
  await send(
    to,
    "Réinitialisation de mot de passe",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="font-size:20px;color:#1e293b">Réinitialiser le mot de passe</h2>
      <p style="color:#64748b">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
      <a href="${url}" style="display:inline-block;margin:16px 0;padding:10px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Réinitialiser
      </a>
      <p style="color:#94a3b8;font-size:12px">Ce lien expire dans 1h. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>`
  );
}
