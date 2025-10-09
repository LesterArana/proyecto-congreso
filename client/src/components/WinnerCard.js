// client/src/components/WinnerCard.js
export default function WinnerCard({ w }) {
  const d = new Date(w.activity?.date || Date.now());
  return (
    <div style={{
      border: "1px solid #eee", borderRadius: 12, overflow: "hidden",
      display: "grid", gridTemplateRows: "180px 1fr"
    }}>
      <div style={{ background: "#f9fafb", position: "relative" }}>
        {w.photoUrl ? (
          <a href={w.photoUrl} target="_blank" rel="noreferrer" title="Ver foto">
            <img
              src={w.photoUrl}
              alt={w.activity?.title || "Ganador"}
              style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </a>
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "grid", placeItems: "center",
            color: "#9ca3af", fontSize: 13
          }}>
            Sin foto
          </div>
        )}
        <div style={{
          position: "absolute", top: 8, left: 8, background: "#111827", color: "#fff",
          fontSize: 12, padding: "2px 8px", borderRadius: 999
        }}>
          {w.place}º lugar
        </div>
      </div>

      <div style={{ padding: 12, display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 700 }}>{w.user?.name}</div>
        <div style={{ color: "#374151", fontSize: 14 }}>
          {w.activity?.title} <span style={{ color: "#6b7280" }}>({d.getFullYear()})</span>
        </div>
        {w.description && (
          <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
            {w.description}
          </div>
        )}
      </div>
    </div>
  );
}
