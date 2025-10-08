// client/src/components/AgendaWidget.js
export default function AgendaWidget({ agenda = [] }) {
  const card = { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" };
  const th = { textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb", fontWeight: 600 };
  const td = { padding: 8, borderBottom: "1px solid #f3f4f6" };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {agenda.map((day, idx) => (
        <div key={idx} style={card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {day.day} · {new Date(day.date).toLocaleDateString()}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Hora</th>
                  <th style={th}>Actividad</th>
                  <th style={th}>Lugar</th>
                </tr>
              </thead>
              <tbody>
                {day.items.map((it, i) => (
                  <tr key={i}>
                    <td style={td}>{it.time}</td>
                    <td style={td}>{it.title}</td>
                    <td style={td}>{it.place}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
