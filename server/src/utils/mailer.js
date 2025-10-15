// server/src/utils/mailer.js
import nodemailer from 'nodemailer';

/**
 * Modos soportados:
 * - MAIL_MODE=stream   -> sin red (desarrollo). No envía, genera el mensaje en memoria.
 * - MAIL_MODE=ethereal -> cuenta temporal de pruebas (requiere internet pero NO SMTP real)
 * - MAIL_MODE=smtp     -> SMTP real con variables SMTP_* (recomendado: proveedor transaccional)
 * - MAIL_MODE vacío    -> intenta smtp -> ethereal -> stream
 *
 * Variables esperadas para SMTP REAL:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * OJO: dejamos de usar MAIL_HOST/MAIL_USER/MAIL_PASS para evitar confusiones.
 */
async function buildTransport() {
  const MODE = (process.env.MAIL_MODE || '').toLowerCase();

  // 1) stream (sin red)
  if (MODE === 'stream') {
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return { transporter, from: process.env.SMTP_FROM || 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
  }

  // 2) SMTP real (solo si tenemos credenciales SMTP_*)
  const hasSmtp =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (MODE === 'smtp' || (MODE === '' && hasSmtp)) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true', // 465=true, 587=false
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // timeouts para no colgar el request si el proveedor bloquea SMTP
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        // si tu proveedor hace MITM del certificado, puedes probar:
        // rejectUnauthorized: false,
      },
    });
    return { transporter, from: process.env.SMTP_FROM || process.env.SMTP_USER, mode: 'smtp' };
  }

  // 3) Ethereal (prueba en la nube, sin SMTP propio)
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
      // si falla, cae a stream
    }
  }

  // 4) último recurso: stream
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
  return { transporter, from: 'Congreso Tech <no-reply@dev.local>', mode: 'stream' };
}

export async function sendMail({ to, subject, html, attachments = [] }) {
  try {
    const { transporter, from, mode } = await buildTransport();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || from,
      to,
      subject,
      html,
      attachments,
    });

    let preview = null;
    if (mode === 'ethereal') {
      // URL clickeable para ver el correo en navegador
      preview = nodemailer.getTestMessageUrl(info) || null;
      console.log('📬 Vista previa Ethereal:', preview);
    }

    console.log(`📨 Correo enviado (mode=${mode}) id=${info.messageId}`);
    return { mode, preview, error: null };
  } catch (err) {
    console.error('❌ Error enviando correo:', err?.message || err);
    return { mode: 'error', preview: null, error: err?.message || String(err) };
  }
}
