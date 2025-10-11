// client/src/components/CameraCapture.js
import { useEffect, useRef, useState } from "react";
import { api } from "../api";

export default function CameraCapture({ onUploaded, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [shot, setShot] = useState(null); // dataURL de la foto tomada
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    startCam();
    return () => stopCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCam() {
    setMsg(null);
    setStarting(true);
    try {
      // Pedimos la cámara trasera si existe
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error(e);
      setMsg("No se pudo acceder a la cámara. Revisa permisos del navegador.");
    } finally {
      setStarting(false);
    }
  }

  function stopCam() {
    try { stream?.getTracks()?.forEach(t => t.stop()); } catch {}
  }

  function takeShot() {
    setMsg(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ajustar canvas al tamaño del video
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    const url = canvas.toDataURL("image/jpeg", 0.9); // calidad 90%
    setShot(url);
  }

  function retake() {
    setShot(null);
  }

  async function upload() {
    if (!shot) return;
    setUploading(true);
    setMsg(null);
    try {
      // dataURL -> Blob
      const blob = await (await fetch(shot)).blob();
      const fd = new FormData();
      // Nombre de archivo simple por timestamp
      fd.append("photo", blob, `winner-${Date.now()}.jpg`);

      const { data } = await api.post("/uploads/winner-photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.url) {
        onUploaded?.(data.url); // devolver URL pública /public/winners/...
        onClose?.();            // cerrar cámara si el padre lo desea
      } else {
        setMsg("No se recibió URL al subir la imagen.");
      }
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.error || "Error subiendo la foto.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "grid", placeItems: "center", zIndex: 50, padding: 16
    }}>
      <div style={{ width: "min(720px, 100%)", background: "#fff",
        borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 12px", borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 700 }}>Cámara</div>
          <button onClick={onClose} style={{ border: "1px solid #ddd",
            borderRadius: 10, background: "#fff", padding: "6px 10px" }}>Cerrar</button>
        </div>

        {/* Body */}
        <div style={{ padding: 12, display: "grid", gap: 10 }}>
          {msg && (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10 }}>
              {msg}
            </div>
          )}

          {/* Vista previa o stream */}
          {!shot ? (
            <div style={{ position: "relative", background: "#000", borderRadius: 12, overflow: "hidden" }}>
              <video ref={videoRef} playsInline muted autoPlay
                style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "contain" }} />
              {starting && (
                <div style={{
                  position: "absolute", inset: 0, display: "grid", placeItems: "center",
                  color: "white", background: "rgba(0,0,0,0.3)"
                }}>
                  Iniciando cámara…
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: "#111", borderRadius: 12, overflow: "hidden" }}>
              <img src={shot} alt="captura"
                style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "contain" }} />
            </div>
          )}

          {/* Controles */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {!shot ? (
              <button onClick={takeShot}
                style={{ background: "#2563eb", color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 14px" }}
                disabled={starting}>
                Tomar foto
              </button>
            ) : (
              <>
                <button onClick={retake}
                  style={{ border: "1px solid #ddd", background: "#fff",
                    borderRadius: 10, padding: "10px 14px" }}>
                  Repetir
                </button>
                <button onClick={upload}
                  style={{ background: "#16a34a", color: "#fff", border: "none",
                    borderRadius: 10, padding: "10px 14px" }}
                  disabled={uploading}>
                  {uploading ? "Subiendo..." : "Usar esta foto"}
                </button>
              </>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
}
