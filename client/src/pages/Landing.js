// client/src/pages/Landing.js
import ActivitiesWidget from "../components/ActivitiesWidget";
import FAQ from "../components/FAQ";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-umgBlue text-white">
      {/* HERO */}
      <section className="px-4 py-12 text-center">
        <h1 className="text-4xl font-extrabold">Congreso de Tecnologia</h1>
        <p className="mt-2 text-blue-100 max-w-2xl mx-auto">
          Talleres y competencias para estudiantes. ¡Participa!
        </p>
        <div className="mt-5">
          <Link
            to="/register"
            className="inline-flex items-center rounded-xl bg-white text-umgBlue px-5 py-2.5 font-semibold hover:brightness-95"
          >
            Inscribirme
          </Link>
        </div>
      </section>

      {/* CONTENIDO */}
      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6">
        {/* Panel de actividades */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          <ActivitiesWidget title="Próximas actividades" />
        </div>

        {/* Panel de FAQ (si tu landing ya trae su propio FAQ, puedes quitar este bloque) */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft border border-white/20 p-6">
          <FAQ
            items={[
              {
                q: "¿Cómo me inscribo?",
                a: "Ve a la página Inscribirme, completa el formulario y elige una actividad.",
              },
              {
                q: "¿Recibiré un comprobante?",
                a: "Sí, se genera un QR que verás en pantalla y se envía por correo (en producción).",
              },
              {
                q: "¿Cómo hago el check-in?",
                a: "Presenta tu QR en la entrada; el staff lo escaneará.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
