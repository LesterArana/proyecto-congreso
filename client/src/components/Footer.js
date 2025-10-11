// src/components/Footer.js
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-umgBlue text-white border-t border-white/20">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center text-center gap-2">
        <p className="m-0 text-sm">
          © {year} <b>Congreso de Tecnología</b> — Universidad Mariano Gálvez
        </p>
        <p className="m-0 text-xs text-white/80">
          Desarrollado con ❤️ para el área de Análisis, Diseño y Desarrollo
        </p>
      </div>
    </footer>
  );
}
