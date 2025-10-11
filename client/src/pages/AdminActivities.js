// client/src/pages/AdminActivities.js
import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

function toLocalInputValue(dateStr) {
  // Convierte ISO -> valor compatible con <input type="datetime-local">
  const d = new Date(dateStr || Date.now());
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function AdminActivities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // form state
  const [editing, setEditing] = useState(null); // actividad en edición (obj) o null
  const [form, setForm] = useState({
    kind: "",
    title: "",
    description: "",
    date: toLocalInputValue(new Date().toISOString()),
    capacity: 20,
  });

  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setMsg(null);
    api
      .get("/activities")
      .then((res) => setItems(res.data || []))
      .catch((err) => {
        const st = err?.response?.status;
        const text =
          err?.response?.data?.message || "Error cargando actividades";
        setMsg(text);
        if (st === 401) navigate("/admin-login", { replace: true });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      kind: "",
      title: "",
      description: "",
      date: toLocalInputValue(new Date().toISOString()),
      capacity: 20,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // convertir datetime-local a ISO
    const isoDate = new Date(form.date).toISOString();
    const payload = {
      kind: form.kind.trim(), // "TALLER" | "COMPETENCIA"
      title: form.title.trim(),
      description: form.description?.trim() || "",
      date: isoDate,
      capacity: Number(form.capacity), // 👈 asegurar número
    };

    try {
      if (editing) {
        await api.put(`/admin/activities/${editing.id}`, payload);
        setMsg("Actividad actualizada.");
      } else {
        await api.post(`/admin/activities`, payload);
        setMsg("Actividad creada.");
      }
      resetForm();
      load();
    } catch (err) {
      console.log(
        "ERROR GUARDANDO:",
        err?.response?.status,
        err?.response?.data
      );
      const st = err?.response?.status;
      const text = err?.response?.data?.message || "Error guardando actividad";
      setMsg(text);
      if (st === 401) navigate("/admin-login", { replace: true });
    }
  };

  const onEdit = (a) => {
    setEditing(a);
    setForm({
      kind: a.kind || "",
      title: a.title || "",
      description: a.description || "",
      date: toLocalInputValue(a.date),
      capacity: a.capacity || 20,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (a) => {
    if (!window.confirm(`¿Eliminar actividad "${a.title}"?`)) return;
    try {
      await api.delete(`/admin/activities/${a.id}`); // <- consistente con POST/PUT
      setMsg("Actividad eliminada.");
      if (editing?.id === a.id) resetForm();
      load();
    } catch (err) {
      const st = err?.response?.status;
      const text = err?.response?.data?.message || "No se pudo eliminar";
      setMsg(text);
      if (st === 401) navigate("/admin-login", { replace: true });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4">
        Cargando…
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-umgBlue">
            Administrar actividades
          </h2>
          <p className="text-slate-600">Crea, edita y elimina talleres o competencias.</p>

          {msg && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2">
              {msg}
            </div>
          )}

          {/* Formulario crear/editar */}
          <form
  onSubmit={onSubmit}
  className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-soft p-5 space-y-4"
>
  {/* Tipo */}
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <label className="block text-sm font-semibold text-slate-700">Tipo</label>
    <select
      className="mt-2 block w-full rounded-xl border-slate-300 bg-white focus:border-umgBlue focus:ring-umgBlue"
      value={form.kind}
      onChange={(e) => setForm({ ...form, kind: e.target.value })}
      required
    >
      <option value="">-- Selecciona --</option>
      <option value="TALLER">Taller</option>
      <option value="COMPETENCIA">Competencia</option>
    </select>
  </div>

  {/* Título */}
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <label className="block text-sm font-semibold text-slate-700">Título</label>
    <input
      className="mt-2 block w-full rounded-xl border-slate-300 bg-white focus:border-umgBlue focus:ring-umgBlue"
      value={form.title}
      onChange={(e) => setForm({ ...form, title: e.target.value })}
      required
    />
  </div>

  {/* Descripción */}
  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
    <label className="block text-sm font-semibold text-slate-700">Descripción</label>
    <textarea
      rows={3}
      className="mt-2 block w-full rounded-xl border-slate-300 bg-white focus:border-umgBlue focus:ring-umgBlue"
      value={form.description}
      onChange={(e) => setForm({ ...form, description: e.target.value })}
    />
  </div>

  {/* Fecha y cupos (dos columnas) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <label className="block text-sm font-semibold text-slate-700">Fecha y hora</label>
      <input
        type="datetime-local"
        className="mt-2 block w-full rounded-xl border-slate-300 bg-white focus:border-umgBlue focus:ring-umgBlue"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        required
      />
    </div>

    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <label className="block text-sm font-semibold text-slate-700">Cupos</label>
      <input
        type="number"
        min={1}
        className="mt-2 block w-full rounded-xl border-slate-300 bg-white focus:border-umgBlue focus:ring-umgBlue"
        value={form.capacity}
        onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
        required
      />
    </div>
  </div>

  {/* Acciones */}
  <div className="flex flex-wrap gap-3">
    <button
      type="submit"
      className="inline-flex items-center rounded-xl bg-umgBlue text-white px-4 py-2 font-semibold hover:brightness-105"
    >
      {editing ? "Guardar cambios" : "Crear actividad"}
    </button>
    {editing && (
      <button
        type="button"
        onClick={resetForm}
        className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-slate-50"
      >
        Cancelar edición
      </button>
    )}
  </div>
</form>

          {/* Lista */}
          <h3 className="text-xl font-bold mt-8">Lista de actividades</h3>
          <div className="mt-3 bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Título</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Cupos</th>
                  <th className="px-4 py-2 text-left">Inscritos</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const inscritos =
                    a._count?.registration ?? a._count?.registrations ?? 0; // 👈 fallback seguro
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-2">{a.id}</td>
                      <td className="px-4 py-2">{a.kind}</td>
                      <td className="px-4 py-2">{a.title}</td>
                      <td className="px-4 py-2">
                        {new Date(a.date).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{a.capacity}</td>
                      <td className="px-4 py-2">{inscritos}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onEdit(a)}
                            className="inline-flex items-center rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => onDelete(a)}
                            className="inline-flex items-center rounded-xl bg-red-600 text-white px-3 py-1.5 hover:brightness-105"
                          >
                            Eliminar
                          </button>
                          <Link
                            to={`/admin/activity/${a.id}`}
                            className="inline-flex items-center rounded-xl border px-3 py-1.5 hover:bg-slate-50"
                          >
                            Ver inscripciones
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-slate-500 text-center"
                    >
                      No hay actividades
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Si aparece error 401, confirma que el interceptor de Axios envíe el
            header <code>x-admin-key</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
