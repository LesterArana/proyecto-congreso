// server/src/utils/mailer.js
import nodemailer from 'nodemailer';

async function buildTransport() {
  const MODE = (process.env.MAIL_MODE || '').toLowerCase();

  if (MODE === 'stream') {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return { transporter, from: 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
  }

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (MODE === 'smtp' || (MODE === '' && hasSmtp)) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return { transporter, from: process.env.SMTP_FROM || process.env.SMTP_USER, mode: 'smtp' };
  }

  // ethereal (testing con preview URL)
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
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return { transporter, from: 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
  }
}

export async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const { transporter, from, mode } = await buildTransport();

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || from,
      to,
      subject,
      html,
      attachments,
    });

    const preview = (mode === 'ethereal') ? (nodemailer.getTestMessageUrl?.(info) || null) : null;

    console.log(`📨 Correo enviado [${mode}]`, info.messageId, preview || '');
    return { mode, preview, error: null };
  } catch (err) {
    console.error("❌ Error enviando correo:", err?.message || err);
    return { mode: "error", preview: null, error: err?.message || String(err) };
  }
}
