// client/src/components/WinnerCard.js
import { useState, useMemo } from "react";

export default function WinnerCard({ w }) {
  const [imgOk, setImgOk] = useState(Boolean(w?.photoUrl));
  const date = useMemo(
    () => new Date(w?.activity?.date || Date.now()),
    [w?.activity?.date]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Imagen / placeholder */}
      <div className="relative h-44 bg-slate-50">
        {w?.photoUrl && imgOk ? (
          <a href={w.photoUrl} target="_blank" rel="noreferrer" title="Ver foto">
            <img
              src={w.photoUrl}
              alt={w?.activity?.title || "Ganador"}
              className="w-full h-44 object-cover block"
              onError={() => setImgOk(false)}
            />
          </a>
        ) : (
          <div className="w-full h-full grid place-items-center text-slate-400 text-sm">
            Sin foto
          </div>
        )}

        {/* Cinta del lugar */}
        <div className="absolute top-2 left-2 rounded-full text-white text-xs px-3 py-1 bg-umgBlue/95">
          {w?.place}º lugar
        </div>
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
          <div className="text-sm text-slate-600 mt-1">
            {w.description}
          </div>
        )}
      </div>
    </div>
  );
}
