export default function FAQ({ items = [] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Preguntas frecuentes</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it, i) => (
          <details key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>{it.q}</summary>
            <div style={{ marginTop: 8, color: "#475569" }}>{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
