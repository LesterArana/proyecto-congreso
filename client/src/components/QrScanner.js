import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function QrScanner({ onResult, onError }) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState("");
  const [running, setRunning] = useState(false);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    // Intenta permisos y luego lista
    detectDevices();

    return () => {
      stop();
      codeReaderRef.current = null;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function stopStream() {
    try {
      streamRef.current?.getTracks()?.forEach(t => t.stop());
    } catch {}
    streamRef.current = null;
  }

  async function ensurePermission() {
    try {
      // Pide permiso genérico de video para que el navegador exponga device labels
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      // no mostramos este stream; solo para permiso
      stopStream(); // lo cerramos de una vez
      return true;
    } catch (e) {
      setErrMsg("No se pudo obtener permiso de cámara. Revísalo en el candado de la barra de direcciones.");
      onError?.(e);
      return false;
    }
  }

  async function detectDevices() {
    setErrMsg(null);
    try {
      // Asegura permiso primero (sin esto, muchos navegadores listan vacío o sin labels)
      const ok = await ensurePermission();
      if (!ok) return;

      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);
      if (!cams.length) {
        setErrMsg("No se detectaron cámaras. Si usas una cámara virtual, asegúrate de que esté activa y reconocida por el sistema.");
        setSelected("");
        return;
      }
      const back = cams.find(d => /back|trasera|rear|environment/i.test(d.label));
      const firstId = (back || cams[0])?.deviceId || "";
      setSelected(prev => prev || firstId);
    } catch (e) {
      setErrMsg("No se pudieron listar cámaras. Revisa permisos o vuelve a intentar.");
      onError?.(e);
    }
  }

  const start = async () => {
    setErrMsg(null);
    if (!selected) {
      setErrMsg("No hay cámara seleccionada.");
      return;
    }
    try {
      await codeReaderRef.current.decodeFromVideoDevice(
        selected,
        videoRef.current,
        (result, err, controls) => {
          if (result) {
            onResult?.(result.getText());
            // Si quieres detener tras primer lectura: descomenta
            // controls.stop();
            // setRunning(false);
          }
          // err NotFoundException es normal entre frames
        }
      );
      setRunning(true);
    } catch (e) {
      setErrMsg("No se pudo iniciar la cámara seleccionada. Prueba otra y revisa permisos.");
      onError?.(e);
      setRunning(false);
    }
  };

  const stop = () => {
    try { codeReaderRef.current?.reset(); } catch {}
    setRunning(false);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", minWidth: 220 }}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Cámara ${d.deviceId.slice(0, 6)}...`}
            </option>
          ))}
        </select>

        <button
          onClick={detectDevices}
          style={{ border: "1px solid #ddd", background: "#fff", borderRadius: 8, padding: "8px 12px" }}
          type="button"
        >
          Detectar cámaras
        </button>

        {!running ? (
          <button
            onClick={start}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px" }}
            type="button"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={stop}
            style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px" }}
            type="button"
          >
            Detener
          </button>
        )}
      </div>

      {errMsg && (
        <div style={{ padding: 8, borderRadius: 8, background: "#fee2e2", color: "#991b1b" }}>{errMsg}</div>
      )}

      <div style={{ position: "relative", width: "100%", maxWidth: 520, borderRadius: 8, overflow: "hidden" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", display: "block", background: "#000" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "2px dashed rgba(255,255,255,0.6)",
            borderRadius: 12,
            margin: 16,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
