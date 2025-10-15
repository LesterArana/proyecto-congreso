// client/src/components/WinnerCard.js
import { useMemo, useState } from "react";
import { api } from "../api";

function resolvePhotoUrl(raw) {
  if (!raw) return null;
  // Si ya viene absoluta, úsala tal cual
  if (/^https?:\/\//i.test(raw)) return raw;

  try {
    // api.defaults.baseURL normalmente termina en /api
    const base = new URL(api.defaults.baseURL);
    const origin = `${base.protocol}//${base.host}`; // https://proyecto...railway.app
    // Si el backend devuelve /public/..., la servimos desde el mismo host del API
    if (raw.startsWith("/")) return origin + raw;
    return `${origin}/${raw}`;
  } catch {
    // fallback: deja el valor como vino
    return raw;
  }
}

export default function WinnerCard({ w }) {
  const date = useMemo(
    () => new Date(w?.activity?.date || Date.now()),
    [w?.activity?.date]
  );

  const photoUrl = useMemo(() => resolvePhotoUrl(w?.photoUrl), [w?.photoUrl]);
  const [imgOk, setImgOk] = useState(Boolean(photoUrl));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Imagen / placeholder */}
      <div className="relative aspect-video bg-slate-50">
        {photoUrl && imgOk ? (
          <a href={photoUrl} target="_blank" rel="noreferrer" title="Ver foto">
            <img
              src={photoUrl}
              alt={w?.activity?.title || "Ganador"}
              className="w-full h-full object-cover block"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
            />
          </a>
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-400 text-sm">
            Sin foto
          </div>
        )}

        {/* Cinta del lugar */}
        {w?.place != null && (
          <div className="absolute top-2 left-2 rounded-full text-white text-xs px-3 py-1 bg-umgBlue/95">
            {w.place}º lugar
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-3 grid gap-1.5">
        <div className="font-semibold text-slate-900">
          {w?.user?.name || "Participante"}
        </div>
        <div className="text-sm text-slate-700">
          {w?.activity?.title || "Actividad"}{" "}
          <span className="text-slate-500">({date.getFullYear()})</span>
        </div>

        {w?.description && (
          <div className="text-sm text-slate-600 mt-1">{w.description}</div>
        )}
      </div>
    </div>
  );
}
