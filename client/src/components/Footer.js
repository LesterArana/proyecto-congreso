export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #eee", background: "#fafafa", marginTop: 48 }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
          © {new Date().getFullYear()} Congreso de Tecnología
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#777" }}>
          Desarrollado con ❤️ para el área de análisis, diseño y desarrollo
        </p>
      </div>
    </footer>
  );
}
