// server/src/emails/buildConfirmationHtml.js
export function buildConfirmationHtml({ fullName, activity, link, hasLogo }) {
  const year = new Date().getFullYear();
  const title    = activity?.title    ?? "Actividad";
  const dateStr  = activity?.dateStr  ?? "-";
  const timeStr  = activity?.timeStr  ?? "-";
  const location = activity?.location ?? "Por confirmar";

  return `
  <div style="background:#f1f5f9;padding:24px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.08);overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 8px;text-align:center;background:#f8fafc;">
                ${hasLogo ? '<img src="cid:umglogo" width="92" height="92" alt="UMG" style="display:block;margin:0 auto 8px;border-radius:8px;" />' : ''}
                <h1 style="margin:0;color:#0a3a82;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;">Universidad Mariano Gálvez de Guatemala</h1>
                <p style="margin:6px 0 0;color:#0a3a82;font-family:Arial,Helvetica,sans-serif;font-size:14px;">Congreso de Tecnología UMG 2025</p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:0 0 12px;">
                      <h2 style="margin:0;color:#0a3a82;font-family:Arial,Helvetica,sans-serif;font-size:18px;">🎓 Confirmación de inscripción</h2>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:1.6;">
                      <p style="margin:0 0 10px;">Hola <b>${esc(fullName)}</b>,</p>
                      <p style="margin:0 0 10px;">Gracias por registrarte en la siguiente actividad:</p>
                      <p style="margin:0 0 14px;">
                        <span style="color:#004aad;font-weight:700;text-decoration:none;">${esc(title)}</span>
                      </p>

                      <p style="margin:0 0 10px;">
                        📅 <b>${esc(dateStr)}</b><br/>
                        ⏰ <b>${esc(timeStr)}</b><br/>
                        📍 <b>${esc(location)}</b>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:12px 0;">
                      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/>
                    </td>
                  </tr>

                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;">
                      <p style="margin:0 0 8px;">🎟 <b>Tu código QR de asistencia:</b></p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:6px 0 0;">
                      <img src="cid:qrimage" alt="QR" width="220" height="220" style="display:block;border:1px solid #e5e7eb;border-radius:6px;" />
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;color:#64748b;font-size:12px;padding-top:8px;text-align:center;">
                      Escanea este código al ingresar al evento para registrar tu asistencia.
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:18px 0 0;">
                      <a href="${link}" style="background:#0a3a82;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;display:inline-block;">
                        Confirmar asistencia
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc;padding:16px;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
                  © ${year} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}
