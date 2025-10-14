import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function QA({ q, children }) {
  return (
    <details className="group border border-slate-200 rounded-xl p-4 mb-4 hover:shadow-md transition">
      <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-umgBlue">
        {q}
        <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
      </summary>
      <div className="mt-2 text-slate-700">{children}</div>
    </details>
  );
}

export default function FAQ() {
  const [logoError, setLogoError] = useState(false);

  // Base pública robusta para /public (dev/prod)
  const PUBLIC_BASE = useMemo(() => {
    const fromEnv = process.env.REACT_APP_PUBLIC_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const fromApi = api?.defaults?.baseURL || "http://localhost:4000/api";
    return fromApi.replace(/\/api\/?$/, "");
  }, []);

  // Cambia a .png si tu archivo real es PNG
  const logoUrl = `${PUBLIC_BASE}/public/logo-umg.jpg`;

  return (
    <div className="min-h-screen bg-umgBlue text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Encabezado institucional */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-4 md:gap-6">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Escudo UMG"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-slate-200"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs flex items-center justify-center p-2">
                No se pudo cargar<br />/public/logo-umg.jpg
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Universidad Mariano Gálvez de Guatemala
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-umgBlue m-0">
                Preguntas Frecuentes
              </h1>
              <p className="text-slate-600 mt-1 mb-0">
                Información útil sobre inscripciones, asistencia y diplomas del Congreso de Tecnología.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido FAQ */}
        <div className="bg-white text-slate-800 rounded-2xl shadow-soft p-8 border border-white/20">
          <QA q="¿Cómo me inscribo si soy estudiante externo?">
            <p>
              Ve a la página de <Link to="/register" className="text-umgBlue underline">Inscripciones</Link>,
              completa el formulario con tus datos (incluye tu colegio) y recibirás un correo de confirmación con tu QR.
            </p>
          </QA>

          <QA q="¿Cómo me inscribo si soy estudiante UMG (correo institucional)?">
            <p>
              También desde <Link to="/register" className="text-umgBlue underline">Inscripciones</Link>.
              Si tu correo termina en <code>@miumg.edu.gt</code> o <code>@umg.edu.gt</code>, el sistema te
              clasificará automáticamente como <b>INTERNAL</b> y no te pedirá “Colegio”.
            </p>
          </QA>

          <QA q="¿Puedo inscribirme a varios talleres?">
            <p>
              Sí, mientras haya cupo disponible y los horarios no se crucen. El sistema valida el cupo de cada actividad.
            </p>
          </QA>

          <QA q="¿Cómo se registra la asistencia?">
            <p>
              Recibirás un <b>código QR</b> por correo al inscribirte. Al ingresar al evento,
              el equipo de registro escaneará tu QR para marcar tu <b>check-in</b>.
            </p>
          </QA>

          <QA q="¿Cuándo recibo mi diploma?">
            <p>
              Los diplomas se generan por la administración para quienes realizaron el check-in.
              Te llegará por correo y también podrás descargarlo desde <i>Mis inscripciones</i>.
            </p>
          </QA>

          <QA q="No recibí el correo de confirmación / QR">
            <p>
              Revisa tu carpeta de <b>Spam</b> o <b>Promociones</b>. Si no aparece, puedes consultar tu inscripción por correo en{" "}
              <Link to="/my-registrations" className="text-umgBlue underline">Mis inscripciones</Link>.
            </p>
          </QA>

          <QA q="¿Con quién me comunico si tengo problemas?">
            <p>
              Escribe al soporte del evento o visita la coordinación en el campus durante el congreso.
            </p>
          </QA>
        </div>

        {/* Pie institucional */}
        <div className="text-center text-white/80 text-xs mt-6">
          © {new Date().getFullYear()} Universidad Mariano Gálvez de Guatemala — Congreso de Tecnología
        </div>
      </div>
    </div>
  );
}
