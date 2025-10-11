// client/src/pages/Checkin.js
import { useState } from "react";
import { api } from "../api";
import QrScanner from "../components/QrScanner";

function ResultCard({ data }) {
  if (!data) return null;
  const { message, alreadyChecked, checkinAt, registrationId, user, activity } = data;
  return (
    <div className="mt-4 border border-slate-200 rounded-2xl p-4 bg-slate-50">
      <div className="font-bold text-slate-800 mb-2">{message}</div>
      <div className="grid gap-1 text-slate-700 text-sm">
        <div>
          <b>Registro:</b> #{registrationId}
        </div>
        <div>
          <b>Usuario:</b> {user?.name} ({user?.email})
        </div>
        <div>
          <b>Actividad:</b> {activity?.title} —{" "}
          {new Date(activity?.date).toLocaleString()}
        </div>
        <div>
          <b>Check-in:</b>{" "}
          {checkinAt ? new Date(checkinAt).toLocaleString() : "N/A"}
        </div>
        {alreadyChecked && (
          <div className="text-amber-700 font-medium">
            ⚠ Ya estaba chequeado anteriormente
          </div>
        )}
      </div>
    </div>
  );
}

export default function Checkin() {
  const [tab, setTab] = useState("regId");
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
      setMsg({ ok: true, text: "✅ Check-in procesado." });
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

  const handleScan = (text) => {
    if (!text) return;
    doCheckin({ qrPayload: text });
  };

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-umgBlue">Check-in (Staff)</h2>
          <p className="text-slate-600 mb-4">
            Usa cualquiera de los tres métodos: por ID, pegando JSON o usando
            cámara.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "regId", label: "Por regId" },
              { key: "qr", label: "Pegar JSON" },
              { key: "cam", label: "Cámara" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl border font-medium ${
                  tab === t.key
                    ? "bg-umgBlue text-white border-umgBlue"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* REG ID */}
          {tab === "regId" && (
            <form onSubmit={submitRegId} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-slate-700 font-medium">RegId</span>
                <input
                  type="number"
                  min={1}
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="Ej: 11"
                  className="rounded-xl border-slate-300 focus:ring-umgBlue focus:border-umgBlue"
                  autoFocus
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    loading
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:brightness-105"
                  }`}
                >
                  {loading ? "Procesando..." : "Marcar asistencia"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegId("");
                    setResult(null);
                    setMsg(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Limpiar
                </button>
              </div>
            </form>
          )}

          {/* JSON */}
          {tab === "qr" && (
            <form onSubmit={submitQr} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-slate-700 font-medium">
                  Contenido del QR (JSON)
                </span>
                <textarea
                  rows={6}
                  value={qrPayload}
                  onChange={(e) => setQrPayload(e.target.value)}
                  placeholder='{"regId":11,"user":{...},"activity":{...},"issuedAt":"..."}'
                  className="rounded-xl border-slate-300 font-mono focus:ring-umgBlue focus:border-umgBlue"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    loading
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-emerald-600 text-white hover:brightness-105"
                  }`}
                >
                  {loading ? "Procesando..." : "Marcar asistencia"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrPayload("");
                    setResult(null);
                    setMsg(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Limpiar
                </button>
              </div>
            </form>
          )}

          {/* CAM */}
          {tab === "cam" && (
            <div>
              <QrScanner
                onResult={handleScan}
                onError={(e) =>
                  setMsg({ ok: false, text: e?.message || "Error de cámara" })
                }
              />
              <p className="text-sm text-slate-500 mt-2">
                Consejo: usa la cámara trasera si estás en móvil para mejor
                enfoque.
              </p>
            </div>
          )}

          {/* Mensajes */}
          {msg && (
            <div
              className={`mt-4 rounded-xl px-3 py-2 ${
                msg.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          {/* Resultado */}
          <ResultCard data={result} />
        </div>
      </div>
    </div>
  );
}
