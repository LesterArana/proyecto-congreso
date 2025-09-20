import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const emptyForm = {
  activityId: "",
  userId: "",
  place: 1,
  description: "",
  photoUrl: "",
  onlyAttended: true, // filtrar lista de usuarios por asistencias
};

export default function AdminWinners() {
  const [activities, setActivities] = useState([]);
  const [regs, setRegs] = useState([]); // inscripciones de la actividad elegida
  const [items, setItems] = useState([]); // ganadores listados
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // ======= Helpers de estilo mínimos
  const input = { padding: 10, border: "1px solid #ddd", borderRadius: 10, width: "100%" };
  const btn = (bg = "#2563eb") => ({
    background: bg,
    color: "#fff",
    padding: "10px 14px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  });
  const chip = (active) => ({
    padding: "10px 14px",
    borderRadius: 10,
    border: active ? "2px solid #2563eb" : "1px solid #ddd",
    background: active ? "#eff6ff" : "#fff",
    cursor: "pointer",
    fontWeight: 600,
    minWidth: 60,
    textAlign: "center",
  });

  // ======= Cargar actividades y winners al entrar
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [actsRes, winnersRes] = await Promise.all([
          api.get("/activities"),          // lista pública
          api.get("/winners"),             // lista pública
        ]);
        setActivities(actsRes.data || []);
        setItems(winnersRes.data?.items || []);
      } catch (e) {
        setMsg({ ok: false, text: e?.response?.data?.error || "Error inicial cargando datos." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ======= Cargar inscripciones cuando cambie actividad
  useEffect(() => {
    if (!form.activityId) { setRegs([]); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg(null);
        const res = await api.get(`/activities/${form.activityId}/registrations`); // requiere admin (x-admin-key via interceptor)
        // normalizamos datos que usaremos en el selector de usuarios
        const rows = (res.data || []).map(r => ({
          regId: r.id,
          userId: r.user?.id,
          name: r.user?.name,
          email: r.user?.email,
          attended: r.status === "CHECKED_IN",
          status: r.status,
        })).filter(r => !!r.userId);
        setRegs(rows);
        // si venimos de editar y el user no pertenece a esta actividad, reset
        if (form.userId && !rows.some(x => String(x.userId) === String(form.userId))) {
          setForm(f => ({ ...f, userId: "" }));
        }
      } catch (e) {
        setMsg({ ok: false, text: e?.response?.data?.error || "No se pudieron cargar inscripciones de la actividad." });
        setRegs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [form.activityId]);

  // ======= Lista de usuarios para el selector, con filtro "solo asistentes"
  const userOptions = useMemo(() => {
    let list = regs;
    if (form.onlyAttended) list = list.filter(r => r.attended);
    // evitar duplicados por userId si se inscribió dos veces (raro)
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
      const url = form.activityId ? `/winners?activityId=${form.activityId}` : "/winners";
      const res = await api.get(url);
      setItems(res?.data?.items || []);
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "Error cargando ganadores." });
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
      setForm(f => ({ ...emptyForm, activityId: f.activityId })); // mantenemos actividad seleccionada
      await loadWinners();
    } catch (e) {
      setMsg({ ok: false, text: e?.response?.data?.error || "No se pudo guardar." });
    } finally {
      setLoading(false);
    }
  }

  // ======= Editar/Eliminar
  function edit(w) {
    setEditingId(w.id);
    setForm(f => ({
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
      setMsg({ ok: false, text: e?.response?.data?.error || "No se pudo eliminar." });
    } finally {
      setLoading(false);
    }
  }

  // ======= UI
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Resultados (Admin)</h2>

      {/* Mensajes */}
      {msg && (
        <div style={{
          padding: 10, borderRadius: 10,
          background: msg.ok ? "#dcfce7" : "#fee2e2",
          color: msg.ok ? "#065f46" : "#991b1b",
          margin: "8px 0"
        }}>
          {msg.text || msg}
        </div>
      )}

      {/* Formulario de carga intuitivo */}
      <form onSubmit={submit} style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        {/* 1) Selección de actividad */}
        <div>
          <label style={{ fontWeight: 600 }}>Actividad</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={form.activityId}
              onChange={(e) => setForm(f => ({ ...f, activityId: e.target.value }))}
              style={input}
              required
            >
              <option value="">— Selecciona actividad —</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {a.title} ({new Date(a.date).toLocaleDateString()})
                </option>
              ))}
            </select>

            <button type="button" onClick={loadWinners} style={btn("#6b7280")}>
              Refrescar lista
            </button>
          </div>
        </div>

        {/* 2) Filtro de asistentes y selección de usuario */}
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.onlyAttended}
                onChange={(e) => setForm(f => ({ ...f, onlyAttended: e.target.checked }))}
              />
              Mostrar solo asistentes
            </label>
            <small style={{ color: "#6b7280" }}>
              {regs.length
                ? `Registros cargados: ${regs.length} — disponibles: ${userOptions.length}`
                : (form.activityId ? "Cargando/registros…" : "Elige una actividad")}
            </small>
          </div>

          <div>
            <label style={{ fontWeight: 600 }}>Ganador (usuario)</label>
            <select
              value={form.userId}
              onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))}
              style={input}
              disabled={!form.activityId}
              required
            >
              <option value="">— Selecciona usuario —</option>
              {userOptions.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name} — {u.email} {u.attended ? "✅ asistió" : "⚠️ no asistió"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3) Selección de lugar con “chips” */}
        <div>
          <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Lugar</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3].map(n => (
              <div
                key={n}
                style={chip(form.place === n)}
                onClick={() => setForm(f => ({ ...f, place: n }))}
              >
                {n}°
              </div>
            ))}
            {/* Permite más lugares si lo necesitas */}
            <input
              type="number"
              value={form.place}
              min={1}
              onChange={(e) => setForm(f => ({ ...f, place: Number(e.target.value) }))}
              style={{ ...input, maxWidth: 100, marginLeft: 8 }}
            />
          </div>
        </div>

        {/* 4) Foto y descripción */}
        <div>
          <label style={{ fontWeight: 600 }}>Foto (URL o ruta pública)</label>
          <input
            type="text"
            placeholder="https://…  o  /winners/fotos/alguien.jpg"
            value={form.photoUrl}
            onChange={(e) => setForm(f => ({ ...f, photoUrl: e.target.value }))}
            style={input}
          />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Descripción (opcional)</label>
          <textarea
            rows={3}
            placeholder="Motivo, categoría, equipo, etc."
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            style={input}
          />
        </div>

        {/* 5) Vista previa */}
        {form.userId && (
          <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Vista previa</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 8, background: "#f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
              }}>
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#6b7280" }}>Sin foto</span>
                )}
              </div>
              <div>
                <div><b>Lugar:</b> {form.place}°</div>
                <div><b>Actividad:</b> {activities.find(a => String(a.id) === String(form.activityId))?.title || "-"}</div>
                <div>
                  <b>Usuario:</b>{" "}
                  {userOptions.find(u => String(u.userId) === String(form.userId))?.name || "-"}
                </div>
                {form.description && <div style={{ color: "#374151" }}>{form.description}</div>}
              </div>
            </div>
          </div>
        )}

        {/* 6) Acciones */}
        <div>
          <button type="submit" disabled={loading} style={btn("#16a34a")}>
            {editingId ? "Guardar cambios" : "Crear ganador"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(f => ({ ...emptyForm, activityId: f.activityId })); }}
              style={{ ...btn("#fff"), color: "#111", border: "1px solid #ddd", marginLeft: 8 }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla de ganadores */}
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
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
            <tr key={w.id}>
              <Td>{w.id}</Td>
              <Td>#{w.activity?.id} — {w.activity?.title}</Td>
              <Td>#{w.user?.id} — {w.user?.name}</Td>
              <Td>{w.place}°</Td>
              <Td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{w.description || "-"}</Td>
              <Td>{w.photoUrl ? <a href={w.photoUrl} target="_blank" rel="noreferrer">ver</a> : "-"}</Td>
              <Td>
                <button onClick={() => edit(w)} style={btn("#2563eb")}>Editar</button>{" "}
                <button onClick={() => del(w.id)} style={btn("#ef4444")}>Eliminar</button>
              </Td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><Td colSpan={7}>Sin ganadores</Td></tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// Pequeños helpers para celdas
function Th({ children }) {
  return <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" }}>{children}</th>;
}
function Td({ children, colSpan }) {
  return <td colSpan={colSpan} style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>{children}</td>;
}
