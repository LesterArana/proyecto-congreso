// server/src/utils/mailer.js
import nodemailer from 'nodemailer';

/**
 * Modo de envío:
 * - MAIL_MODE=stream  -> sin red, simula envío (desarrollo 100% offline)
 * - MAIL_MODE=ethereal -> usa cuenta de prueba (requiere internet)
 * - MAIL_MODE=smtp     -> usa SMTP de variables .env
 * - sin MAIL_MODE: intenta smtp -> ethereal -> stream
 */
async function buildTransport() {
  const MODE = (process.env.MAIL_MODE || '').toLowerCase();

  // 1) Forzar STREAM (desarrollo sin red)
  if (MODE === 'stream') {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return { transporter, from: 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
  }

  // 2) SMTP real si se fuerza o hay credenciales
  const hasSmtp =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (MODE === 'smtp' || (MODE === '' && hasSmtp)) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return { transporter, from: process.env.SMTP_FROM || process.env.SMTP_USER, mode: 'smtp' };
  }

  // 3) Ethereal (prueba en la nube)
  if (MODE === 'ethereal' || MODE === '') {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      return { transporter, from: 'Congreso Tech <no-reply@ethereal.email>', mode: 'ethereal' };
    } catch {
      // cae a stream si falla
    }
  }

  // 4) Último recurso: stream
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
  return { transporter, from: 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
}

export async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // true para puerto 465, false para 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      attachments,
    });

    console.log("📨 Correo enviado:", info.messageId);
    return { mode: "smtp", preview: null, error: null };
  } catch (err) {
    console.error("❌ Error enviando correo:", err.message);
    return { mode: "error", preview: null, error: err.message };
  }
}
