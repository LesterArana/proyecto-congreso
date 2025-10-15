export default function FAQ() {
  return (
    <div className="min-h-screen bg-umgBlue text-white flex flex-col items-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-3xl w-full bg-white text-slate-800 rounded-2xl shadow-soft p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-umgBlue text-center mb-6">Preguntas Frecuentes</h2>

        <details className="group border border-slate-200 rounded-xl p-4 mb-4 hover:shadow-md transition">
          <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-umgBlue">
            ¿Cómo me inscribo si soy estudiante externo?
            <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
          </summary>
          <p className="mt-2 text-slate-700">Completa el formulario con tus datos y recibirás un correo de confirmación.</p>
        </details>

        <details className="group border border-slate-200 rounded-xl p-4 mb-4 hover:shadow-md transition">
          <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-umgBlue">
            ¿Puedo inscribirme a varios talleres?
            <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
          </summary>
          <p className="mt-2 text-slate-700">Sí, siempre que haya cupo disponible y los horarios no se crucen.</p>
        </details>

        <details className="group border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
          <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-umgBlue">
            ¿Cómo se registra la asistencia?
            <span className="transition-transform duration-200 group-open:rotate-90">▶</span>
          </summary>
          <p className="mt-2 text-slate-700">Se te enviará un código QR; al ingresar al evento lo escaneas para registrar tu asistencia.</p>
        </details>
      </div>
    </div>
  );
}
