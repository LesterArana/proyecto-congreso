// server/src/utils/mailer.js
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

// 1) SendGrid (HTTP API) — sin SMTP
function canUseSendGrid() {
  return !!process.env.SENDGRID_API_KEY;
}

/**
 * sendMail({ to, subject, html, attachments })
 * attachments: [{ filename, path|content, contentType, cid? }]
 */
export async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    // ========= Opción A: SendGrid =========
    if (canUseSendGrid()) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const from =
        process.env.SMTP_FROM ||
        process.env.MAIL_FROM ||
        process.env.SENDGRID_FROM ||
        "no-reply@onboarding.sendgrid.net"; // se reemplaza si seteas SENDGRID_FROM

      // Mapear adjuntos (cid opcional para inline)
      const sgAttachments = await Promise.all(
        attachments.map(async (a) => {
          // a.content (Buffer) o a.path (ruta absoluta)
          if (a.content) {
            return {
              filename: a.filename,
              type: a.contentType || undefined,
              content: Buffer.isBuffer(a.content)
                ? a.content.toString("base64")
                : Buffer.from(String(a.content)).toString("base64"),
              disposition: a.cid ? "inline" : "attachment",
              content_id: a.cid || undefined,
            };
          } else if (a.path) {
            const fs = await import("fs/promises");
            const data = await fs.readFile(a.path);
            return {
              filename: a.filename,
              type: a.contentType || undefined,
              content: data.toString("base64"),
              disposition: a.cid ? "inline" : "attachment",
              content_id: a.cid || undefined,
            };
          }
          return null;
        })
      );

      const msg = {
        to,
        from, // DEBE ser un sender verificado en SendGrid (Single Sender) o un dominio autenticado
        subject,
        html,
        attachments: sgAttachments.filter(Boolean),
      };

      const [resp] = await sgMail.send(msg);
      // 2xx esperado
      return { mode: "sendgrid", preview: null, error: null, status: resp?.statusCode };
    }

    // ========= Opción B: Ethereal (preview) =========
    if ((process.env.MAIL_MODE || "").toLowerCase() === "ethereal") {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await transporter.sendMail({
        from: "Congreso Tech <no-reply@ethereal.email>",
        to,
        subject,
        html,
        attachments,
      });
      const preview = nodemailer.getTestMessageUrl(info);
      console.log("📨 Ethereal preview:", preview);
      return { mode: "ethereal", preview, error: null };
    }

    // ========= Opción C: Stream (no envía, útil para logs) =========
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
    const info = await transporter.sendMail({
      from: "Congreso Tech <no-reply@dev.local>",
      to,
      subject,
      html,
      attachments,
    });
    console.log("📨 STREAM (no real):", info.message?.toString()?.slice(0, 200) || "");
    return { mode: "stream", preview: null, error: null };
  } catch (err) {
    console.error("❌ Error enviando correo:", err?.message || err);
    return { mode: "error", preview: null, error: err?.message || String(err) };
  }
}
