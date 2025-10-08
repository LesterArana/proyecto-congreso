// client/src/components/SpeakerCard.js
export default function SpeakerCard({ s }) {
  const card = { border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" };

  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 12 }}>
        {s.photo ? (
          <img
            src={s.photo}
            alt={s.name}
            style={{ width: 90, height: 90, borderRadius: 10, objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: 90, height: 90, borderRadius: 10, background: "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af"
          }}>
            Sin foto
          </div>
        )}

        <div>
          <div style={{ fontWeight: 700 }}>{s.name}</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>{s.role}</div>
          <div style={{ marginTop: 6 }}><b>Charla:</b> {s.talk}</div>
          {s.bio && <div style={{ marginTop: 6, fontSize: 14 }}>{s.bio}</div>}
        </div>
      </div>
    </div>
  );
}
