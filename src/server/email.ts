import "server-only";
import { Resend } from "resend";
import { env } from "./env";

export class EmailNotConfiguredError extends Error {}

/**
 * Sends the verification code through Resend. There is deliberately NO
 * fallback that prints codes to logs: if the provider isn't configured,
 * sending fails and the UI says so.
 */
export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  if (!env.resendApiKey) throw new EmailNotConfiguredError("Email sending is not configured.");
  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject: `${code} is your BotleValor verification code`,
    text: [
      `Your BotleValor verification code is ${code}.`,
      "",
      "It expires in 10 minutes. If you didn't create a BotleValor account, you can ignore this email.",
      "",
      "BotleValor — Recycle Today. Earn Tomorrow.",
    ].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#0f1d3a">
      <h2 style="color:#10275f;margin:0 0 8px">Verify your email</h2>
      <p>Your BotleValor verification code is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#148a45;margin:16px 0">${code}</p>
      <p style="color:#5a6782">It expires in 10 minutes. If you didn't create a BotleValor account, you can ignore this email.</p>
      <p style="color:#5a6782;font-size:13px">BotleValor — Recycle Today. Earn Tomorrow.</p>
    </div>`,
  });
  if (error) {
    console.error("[email] provider rejected the message:", error.name);
    throw new Error("Email provider error");
  }
}
