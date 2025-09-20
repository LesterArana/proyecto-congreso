// client/src/pages/Checkin.js
import { useState } from "react";
import { api } from "../api";
import QrScanner from "../components/QrScanner"; // 👈 importa el escáner

function ResultCard({ data }) {
  if (!data) return null;
  const { message, alreadyChecked, checkinAt, registrationId, user, activity } = data;
  return (
    <div style={{ marginTop: 12, border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{message}</div>
      <div style={{ display: "grid", gap: 6 }}>
        <div><b>Registro:</b> #{registrationId}</div>
        <div><b>Usuario:</b> {user?.name} ({user?.email})</div>
        <div><b>Actividad:</b> {activity?.title} — {new Date(activity?.date).toLocaleString()}</div>
        <div><b>Check-in:</b> {checkinAt ? new Date(checkinAt).toLocaleString() : "N/A"}</div>
        {alreadyChecked && <div style={{ color: "#b45309" }}>⚠ Ya estaba chequeado anteriormente</div>}
      </div>
    </div>
  );
}

export default function Checkin() {
  const [tab, setTab] = useState("regId"); // "regId" | "qr" | "cam"
  const [regId, setRegId] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(null);

  const doCheckin = async (body) => {
    setMsg(null);
    setResult(null);
    try {
      setLoading(true);
      const { data } = await api.post("/checkin", body);
      setResult(data);
      setMsg({ ok: true, text: "Check-in procesado." });
    } catch (err) {
      const text = err?.response?.data?.message || "Error realizando check-in";
      setMsg({ ok: false, text });
    } finally {
      setLoading(false);
    }
  };

  const submitRegId = (e) => {
    e.preventDefault();
    const idNum = Number(regId);
    if (!idNum || idNum <= 0) {
      setMsg({ ok: false, text: "Ingresa un regId válido (número > 0)" });
      return;
    }
    doCheckin({ regId: idNum });
  };

  const submitQr = (e) => {
    e.preventDefault();
    const txt = qrPayload.trim();
    if (!txt) {
      setMsg({ ok: false, text: "Pega el contenido del QR" });
      return;
    }
    doCheckin({ qrPayload: txt });
  };

  // 👇 llamado desde el escáner
  const handleScan = (text) => {
    // puedes validar mínimo que contenga { o "regId":
    if (!text) return;
    doCheckin({ qrPayload: text });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h2>Check-in (Staff)</h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        {["regId", "qr", "cam"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: tab === t ? "#2563eb" : "#fff",
              color: tab === t ? "#fff" : "#111",
              cursor: "pointer",
            }}
          >
            {t === "regId" ? "Por regId" : t === "qr" ? "Pegar JSON" : "Cámara"}
          </button>
        ))}
      </div>

      {/* Form por regId */}
      {tab === "regId" && (
        <form onSubmit={submitRegId} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <label style={{ display: "grid", gap: 6 }}>
            regId
            <input
              type="number"
              min={1}
              value={regId}
              onChange={(e) => setRegId(e.target.value)}
              placeholder="Ej: 11"
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
              autoFocus
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#059669", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 8 }}
            >
              {loading ? "Procesando..." : "Marcar asistencia"}
            </button>
            <button
              type="button"
              onClick={() => { setRegId(""); setResult(null); setMsg(null); }}
              style={{ border: "1px solid #ddd", background: "#fff", padding: "8px 14px", borderRadius: 8 }}
            >
              Limpiar
            </button>
          </div>
        </form>
      )}

      {/* Form pegando JSON del QR */}
      {tab === "qr" && (
        <form onSubmit={submitQr} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Contenido del QR (JSON)
            <textarea
              rows={6}
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder='{"regId":11,"user":{...},"activity":{...},"issuedAt":"..."}'
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", fontFamily: "monospace" }}
            />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{ background: "#059669", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 8 }}
            >
              {loading ? "Procesando..." : "Marcar asistencia"}
            </button>
            <button
              type="button"
              onClick={() => { setQrPayload(""); setResult(null); setMsg(null); }}
              style={{ border: "1px solid #ddd", background: "#fff", padding: "8px 14px", borderRadius: 8 }}
            >
              Limpiar
            </button>
          </div>
        </form>
      )}

      {/* Cámara */}
      {tab === "cam" && (
        <div style={{ marginTop: 8 }}>
          <QrScanner
            onResult={handleScan}
            onError={(e) => setMsg({ ok: false, text: e?.message || "Error de cámara" })}
          />
          <p style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
            Consejo: usa la cámara trasera si estás en móvil para mejor enfoque.
          </p>
        </div>
      )}

      {/* Mensaje */}
      {msg && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: msg.ok ? "#dcfce7" : "#fee2e2",
            color: msg.ok ? "#065f46" : "#991b1b",
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Resultado */}
      <ResultCard data={result} />
    </div>
  );
}
