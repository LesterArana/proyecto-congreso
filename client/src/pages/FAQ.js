// src/pages/FAQ.js
export default function FAQ() {
  return (
    <div>
      <h2>Preguntas frecuentes</h2>
      <details style={{ marginTop: 12 }}>
        <summary>¿Cómo me inscribo si soy estudiante externo?</summary>
        <p>Completa el formulario con tus datos y recibirás un correo de confirmación.</p>
      </details>
      <details>
        <summary>¿Puedo inscribirme a varios talleres?</summary>
        <p>Sí, siempre que haya cupo disponible y los horarios no se crucen.</p>
      </details>
      <details>
        <summary>¿Cómo se registra la asistencia?</summary>
        <p>Se te enviará un código QR; al ingresar al evento lo escaneas para registrar tu asistencia.</p>
      </details>
    </div>
  );
}
