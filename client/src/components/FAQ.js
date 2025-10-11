// src/components/FAQ.js
export default function FAQ({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-umgBlue mb-4 text-center">
        Preguntas frecuentes
      </h2>

      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        {items.map((it, i) => (
          <details
            key={i}
            className="group border border-slate-200 bg-white rounded-2xl shadow-sm p-4 transition-all duration-200 hover:shadow-md"
          >
            <summary className="cursor-pointer font-semibold text-slate-800 list-none flex justify-between items-center">
              {it.q}
              <span className="ml-2 text-umgBlue transition-transform duration-200 group-open:rotate-180">
                ▼
              </span>
            </summary>

            <div className="mt-2 text-slate-600 leading-relaxed">
              {it.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
