import { useState } from "react";
import { api } from "../api";

/**
 * Vista del usuario final:
 * - Solo permite DESCARGAR el diploma si ya existe (no lo genera).
 * - Los datos vienen de /registrations/by-email (incluye: qr, attended, diplomaUrl, activity, etc.)
 */
export default function MyRegistrations() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null);          // { registrations: [...] }
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setData(null);
    if (!email.trim()) {
      setMsg({ ok: false, text: "Ingresa tu correo" });
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/registrations/by-email", { params: { email } });
      const regs = res?.data?.registrations || [];

      if (!regs.length) {
        setData({ registrations: [] });
        setMsg({ ok: true, text: "No encontramos inscripciones con ese correo." });
        return;
      }

      setData({ registrations: regs });
    } catch (err) {
      setMsg({ ok: false, text: err?.response?.data?.message || "Error consultando inscripciones." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>Mis inscripciones</h2>

      <form onSubmit={submit} style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#2563eb", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 8 }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {msg && (
        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: msg.ok ? "#dcfce7" : "#fee2e2",
            color: msg.ok ? "#065f46" : "#991b1b",
            marginTop: 8,
          }}
        >
          {msg.text}
        </div>
      )}

      {data?.registrations?.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {data.registrations.map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {r.activity.kind}: {r.activity.title}
                  </div>
                  <div style={{ color: "#555" }}>
                    {new Date(r.activity.date).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Estado: <b>{r.status}</b> — Reg. #{r.id}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: r.attended ? "#065f46" : "#6b7280" }}>
                    Asistencia: <b>{r.attended ? `Sí${r.attendedAt ? ` — ${new Date(r.attendedAt).toLocaleString()}` : ""}` : "No"}</b>
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {/* QR */}
                  {r.qr ? (
                    <a
                      href={r.qr}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "none",
                        background: "#059669",
                        color: "#fff",
                        padding: "6px 10px",
                        borderRadius: 8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ver QR
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Sin QR</span>
                  )}

                  {/* Diploma: SOLO DESCARGA (no generar aquí) */}
                  {r.diplomaUrl ? (
                    <a
                      href={r.diplomaUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "none",
                        background: "#7c3aed",
                        color: "#fff",
                        padding: "6px 10px",
                        borderRadius: 8,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Descargar diploma
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Sin diploma aún</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
