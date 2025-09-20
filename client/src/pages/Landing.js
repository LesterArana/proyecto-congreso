import ActivitiesWidget from "../components/ActivitiesWidget";
import FAQ from "../components/FAQ";

export default function Landing() {
  return (
    <div>
      {/* ========= PEGAR TU LANDING ANTERIOR AQUÍ ========= */}
      {/* Ejemplo de cabecera/hero (borra si no lo necesitas) */}
      <section style={{ padding: "48px 16px", textAlign: "center", background: "#f8fafc" }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Congreso Tech</h1>
        <p style={{ color: "#475569", marginTop: 8 }}>
          Talleres y competencias para estudiantes. ¡Participa!
        </p>
        <a href="/register"
           style={{ display: "inline-block", marginTop: 16, background: "#2563eb", color: "#fff",
                    padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}>
          Inscribirme
        </a>
      </section>
      {/* ========= FIN PEGA TU LANDING ========= */}

      {/* Bloque de actividades */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 16 }}>
        <ActivitiesWidget title="Próximas actividades" />

        {/* Preguntas frecuentes (si tu landing ya trae su propio FAQ, quita esto) */}
        <FAQ
          items={[
            { q: "¿Cómo me inscribo?", a: "Ve a la página Inscribirme, completa el formulario y elige una actividad." },
            { q: "¿Recibiré un comprobante?", a: "Sí, se genera un QR que verás en pantalla y se envía por correo (en producción)." },
            { q: "¿Cómo hago el check-in?", a: "Presenta tu QR en la entrada; el staff lo escaneará." },
          ]}
        />
      </div>
    </div>
  );
}
