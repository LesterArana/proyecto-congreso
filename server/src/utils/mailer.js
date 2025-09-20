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
    const ctx = await buildTransport();
    const info = await ctx.transporter.sendMail({ from: ctx.from, to, subject, html, attachments });

    let preview = null;
    if (ctx.mode === 'ethereal') {
      preview = nodemailer.getTestMessageUrl(info) || null;
      if (preview) console.log('📫 Vista previa (Ethereal):', preview);
    }
    if (ctx.mode === 'stream') {
      console.log('📄 Correo simulado (stream). Bytes:', info.message?.length || 0);
    }

    return { messageId: info.messageId || null, preview, mode: ctx.mode, error: null };
  } catch (err) {
    console.error('Mailer error:', err);
    return { messageId: null, preview: null, mode: 'error', error: err?.message || String(err) };
  }
}
