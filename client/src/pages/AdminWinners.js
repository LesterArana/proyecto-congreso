// client/src/pages/AdminWinners.js
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import CameraCapture from "../components/CameraCapture";

const emptyForm = {
  activityId: "",
  userId: "",
  place: 1,
  description: "",
  photoUrl: "",
  onlyAttended: true,
};

export default function AdminWinners() {
  const [activities, setActivities] = useState([]);
  const [regs, setRegs] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showCam, setShowCam] = useState(false);

  // subida de imagen
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function uploadPhoto() {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await api.post("/uploads/winner-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.url) {
        setForm((f) => ({ ...f, photoUrl: data.url }));
        setMsg({ ok: true, text: "📸 Foto subida y vinculada." });
        setFile(null);
      } else {
        setMsg({ ok: false, text: "No se recibió URL de la imagen." });
      }
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "Error subiendo imagen.",
      });
    } finally {
      setUploading(false);
    }
  }

  // ======= Cargar actividades y winners al entrar
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [actsRes, winnersRes] = await Promise.all([
          api.get("/activities"),
          api.get("/winners"),
        ]);
        setActivities(actsRes.data || []);
        setItems(winnersRes.data?.items || []);
      } catch (e) {
        setMsg({
          ok: false,
          text: e?.response?.data?.error || "Error inicial cargando datos.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ======= Cargar inscripciones cuando cambie actividad
  useEffect(() => {
    if (!form.activityId) {
      setRegs([]);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setMsg(null);
        const res = await api.get(`/activities/${form.activityId}/registrations`);
        const rows =
          (res.data || [])
            .map((r) => ({
              regId: r.id,
              userId: r.user?.id,
              name: r.user?.name,
              email: r.user?.email,
              attended: r.status === "CHECKED_IN",
              status: r.status,
            }))
            .filter((r) => !!r.userId) || [];
        setRegs(rows);
        if (
          form.userId &&
          !rows.some((x) => String(x.userId) === String(form.userId))
        ) {
          setForm((f) => ({ ...f, userId: "" }));
        }
      } catch (e) {
        setMsg({
          ok: false,
          text:
            e?.response?.data?.error ||
            "No se pudieron cargar inscripciones de la actividad.",
        });
        setRegs([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.activityId]);

  // ======= Lista de usuarios para el selector, con filtro "solo asistentes"
  const userOptions = useMemo(() => {
    let list = regs;
    if (form.onlyAttended) list = list.filter((r) => r.attended);
    const seen = new Set();
    const unique = [];
    for (const r of list) {
      if (seen.has(r.userId)) continue;
      seen.add(r.userId);
      unique.push(r);
    }
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [regs, form.onlyAttended]);

  // ======= Cargar winners (lista)
  async function loadWinners() {
    try {
      setLoading(true);
      const url = form.activityId
        ? `/winners?activityId=${form.activityId}`
        : "/winners";
      const res = await api.get(url);
      setItems(res?.data?.items || []);
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "Error cargando ganadores.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ======= Guardar (crear/editar)
  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.activityId || !form.userId || !form.place) {
      setMsg({ ok: false, text: "Completa actividad, ganador y lugar." });
      return;
    }
    const payload = {
      activityId: Number(form.activityId),
      userId: Number(form.userId),
      place: Number(form.place),
      description: form.description?.trim() || null,
      photoUrl: form.photoUrl?.trim() || null,
    };
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/winners/${editingId}`, payload);
        setMsg({ ok: true, text: "Ganador actualizado." });
      } else {
        await api.post(`/winners`, payload);
        setMsg({ ok: true, text: "Ganador creado." });
      }
      setEditingId(null);
      setForm((f) => ({ ...emptyForm, activityId: f.activityId }));
      await loadWinners();
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "No se pudo guardar.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ======= Editar/Eliminar
  function edit(w) {
    setEditingId(w.id);
    setForm((f) => ({
      ...f,
      activityId: String(w.activity.id),
      userId: String(w.user.id),
      place: Number(w.place),
      description: w.description || "",
      photoUrl: w.photoUrl || "",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function del(id) {
    if (!window.confirm("¿Eliminar este ganador?")) return;
    try {
      setLoading(true);
      await api.delete(`/winners/${id}`);
      setMsg({ ok: true, text: "Ganador eliminado." });
      await loadWinners();
    } catch (e) {
      setMsg({
        ok: false,
        text: e?.response?.data?.error || "No se pudo eliminar.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
            <div>
              <h2 className="text-balance text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold text-umgBlue">
                Resultados (Admin)
              </h2>
              <p className="text-slate-600 text-sm">
                Crea, edita y publica ganadores por actividad.
              </p>
            </div>
            <button
              type="button"
              onClick={loadWinners}
              className="rounded-xl border px-4 py-2 hover:bg-slate-50 w-full sm:w-auto"
            >
              Refrescar lista
            </button>
          </div>

          {/* Mensajes */}
          {msg && (
            <div
              className={`rounded-xl px-3 py-2 mb-4 ${
                msg.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {msg.text || msg}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={submit} className="grid gap-4 mb-6">
            {/* 1) Actividad */}
            <div className="grid gap-2">
              <label className="font-semibold">Actividad</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={form.activityId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, activityId: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 w-full sm:w-80 focus:ring-umgBlue focus:border-umgBlue outline-none"
                  required
                >
                  <option value="">— Selecciona actividad —</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.title} ({new Date(a.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2) Filtro y usuario */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.onlyAttended}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, onlyAttended: e.target.checked }))
                    }
                    className="rounded border-slate-300"
                  />
                  Mostrar solo asistentes
                </label>
                <small className="text-slate-500">
                  {regs.length
                    ? `Registros: ${regs.length} — disponibles: ${userOptions.length}`
                    : form.activityId
                    ? "Cargando registros…"
                    : "Elige una actividad"}
                </small>
              </div>

              <div className="grid gap-1">
                <label className="font-semibold">Ganador (usuario)</label>
                <select
                  value={form.userId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, userId: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 w-full focus:ring-umgBlue focus:border-umgBlue outline-none"
                  disabled={!form.activityId}
                  required
                >
                  <option value="">— Selecciona usuario —</option>
                  {userOptions.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.name} — {u.email} {u.attended ? "✅ asistió" : "⚠️ no asistió"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3) Lugar */}
            <div className="grid gap-2">
              <label className="font-semibold">Lugar</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((n) => {
                  const active = form.place === n;
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setForm((f) => ({ ...f, place: n }))}
                      className={`min-w-12 px-4 py-2 rounded-xl font-semibold transition ${
                        active
                          ? "border-2 border-umgBlue bg-blue-50"
                          : "border border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      {n}°
                    </button>
                  );
                })}
                <input
                  type="number"
                  value={form.place}
                  min={1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, place: Number(e.target.value) }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 w-28 focus:ring-umgBlue focus:border-umgBlue outline-none"
                />
              </div>
            </div>

            {/* 4) Foto y descripción */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="font-semibold">Foto (URL o subida)</label>
                <input
                  type="text"
                  placeholder="https://…  o  /public/winners/archivo.jpg"
                  value={form.photoUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, photoUrl: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 w-full focus:ring-umgBlue focus:border-umgBlue outline-none"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block"
                  />
                  <button
                    type="button"
                    onClick={uploadPhoto}
                    disabled={!file || uploading}
                    className={`rounded-xl px-3 py-2 text-white ${
                      uploading ? "bg-slate-400" : "bg-sky-500 hover:brightness-105"
                    }`}
                    title="Subir imagen al servidor"
                  >
                    {uploading ? "Subiendo..." : "Subir foto"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCam(true)}
                    className="rounded-xl px-3 py-2 border hover:bg-slate-50"
                  >
                    Usar cámara
                  </button>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-slate-600 mb-1">Vista previa:</div>
                  <div className="w-40 h-40 bg-slate-100 rounded-lg overflow-hidden grid place-items-center">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-500 text-xs">Sin foto</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="font-semibold">Descripción (opcional)</label>
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 w-full focus:ring-umgBlue focus:border-umgBlue outline-none"
                  placeholder="Detalle del logro, proyecto, etc."
                />
              </div>
            </div>

            {/* Modal de cámara */}
            {showCam && (
              <CameraCapture
                onUploaded={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
                onClose={() => setShowCam(false)}
              />
            )}

            {/* 6) Acciones */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-xl px-4 py-2 font-semibold text-white ${
                  loading ? "bg-slate-400 cursor-not-allowed" : "bg-umgBlue hover:brightness-105"
                } w-full sm:w-auto`}
              >
                {editingId ? "Guardar cambios" : "Crear ganador"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm((f) => ({ ...emptyForm, activityId: f.activityId }));
                  }}
                  className="rounded-xl px-4 py-2 border hover:bg-slate-50 w-full sm:w-auto"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Listado responsive: Cards en móvil, tabla en desktop */}
          {/* Cards (mobile) */}
          <div className="grid gap-3 md:hidden">
            {items.map((w) => (
              <article key={w.id} className="border border-slate-200 rounded-2xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    {w.photoUrl ? (
                      <img
                        src={w.photoUrl}
                        alt={w.activity?.title || "Ganador"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-slate-400 text-xs">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">ID #{w.id}</div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {w.user?.name} — <span className="text-slate-600">{w.place}° lugar</span>
                    </div>
                    <div className="text-sm text-slate-700 truncate">
                      #{w.activity?.id} — {w.activity?.title}
                    </div>
                    {w.description && (
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                        {w.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => edit(w)}
                        className="rounded-lg px-3 py-1.5 bg-umgBlue text-white text-sm hover:brightness-105"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => del(w.id)}
                        className="rounded-lg px-3 py-1.5 bg-rose-600 text-white text-sm hover:brightness-105"
                      >
                        Eliminar
                      </button>
                      {w.photoUrl && (
                        <a
                          href={w.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg px-3 py-1.5 border text-sm hover:bg-slate-50"
                        >
                          Ver foto
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {items.length === 0 && (
              <div className="text-center text-slate-500 border rounded-xl py-6">
                Sin ganadores
              </div>
            )}
          </div>

          {/* Tabla (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <Th>ID</Th>
                  <Th>Actividad</Th>
                  <Th>Usuario</Th>
                  <Th>Lugar</Th>
                  <Th>Descripción</Th>
                  <Th>Foto</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b">
                    <Td>{w.id}</Td>
                    <Td>#{w.activity?.id} — {w.activity?.title}</Td>
                    <Td>#{w.user?.id} — {w.user?.name}</Td>
                    <Td>{w.place}°</Td>
                    <Td className="max-w-[520px] whitespace-pre-wrap">{w.description || "-"}</Td>
                    <Td>
                      {w.photoUrl ? (
                        <a
                          href={w.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-umgBlue hover:underline"
                        >
                          ver
                        </a>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => edit(w)}
                          className="rounded-xl px-3 py-1.5 bg-umgBlue text-white hover:brightness-105"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => del(w.id)}
                          className="rounded-xl px-3 py-1.5 bg-rose-600 text-white hover:brightness-105"
                        >
                          Eliminar
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <Td colSpan={7} className="text-center text-slate-500">
                      Sin ganadores
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && <p className="text-slate-500 mt-3">Procesando…</p>}
        </div>
      </div>
    </div>
  );
}

// Helpers de celdas con clases coherentes
function Th({ children }) {
  return <th className="text-left px-3 py-2 border-b">{children}</th>;
}
function Td({ children, colSpan, className = "" }) {
  return <td colSpan={colSpan} className={`px-3 py-2 ${className}`}>{children}</td>;
}
