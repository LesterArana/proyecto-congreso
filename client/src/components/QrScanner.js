// client/src/components/QrScanner.js
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
  const [torchOn, setTorchOn] = useState(false);

  // Inicializa lector + detecta cámaras
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    detectDevices();

    return () => {
      stop();
      stopStream();
      codeReaderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si cambia el dispositivo mientras está corriendo, reinicia
  useEffect(() => {
    if (running) {
      stop();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function stopStream() {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
  }

  async function ensurePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      // no mostramos este stream; solo para desbloquear labels
      stopStream();
      return true;
    } catch (e) {
      const msg =
        "No se pudo obtener permiso de cámara. Revisa el candado en la barra del navegador.";
      setErrMsg(msg);
      onError?.(e || new Error(msg));
      return false;
    }
  }

  async function detectDevices() {
    setErrMsg(null);
    try {
      const ok = await ensurePermission();
      if (!ok) return;

      const cams = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(cams);

      if (!cams.length) {
        setSelected("");
        setErrMsg(
          "No se detectaron cámaras. Verifica permisos o conecta una cámara."
        );
        return;
      }

      const back = cams.find((d) =>
        /back|trasera|rear|environment/i.test(d.label)
      );
      const firstId = (back || cams[0])?.deviceId || "";
      setSelected((prev) => prev || firstId);
    } catch (e) {
      const msg = "No se pudieron listar cámaras. Intenta de nuevo.";
      setErrMsg(msg);
      onError?.(e || new Error(msg));
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
            // Si quieres detener tras la primera lectura, descomenta:
            // controls.stop(); setRunning(false);
          }
          // NotFoundException entre frames es normal → no mostrar error
        }
      );
      setRunning(true);
    } catch (e) {
      const msg =
        "No se pudo iniciar la cámara seleccionada. Revisa permisos o prueba otra cámara.";
      setErrMsg(msg);
      onError?.(e || new Error(msg));
      setRunning(false);
    }
  };

  const stop = () => {
    try {
      codeReaderRef.current?.reset();
    } catch {}
    setRunning(false);
    // apagar linterna si estaba encendida
    if (torchOn) toggleTorch(false);
  };

  async function toggleTorch(on) {
    try {
      const track = videoRef.current?.srcObject
        ?.getVideoTracks?.()
        ?.at(0);
      if (!track) return;

      // Soporte de torch es opcional según navegador
      const caps = track.getCapabilities?.();
      if (!caps || !("torch" in caps)) {
        setErrMsg("La linterna no es compatible en este dispositivo/navegador.");
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: on }] });
      setTorchOn(on);
    } catch {
      setErrMsg("No se pudo cambiar el estado de la linterna.");
    }
  }

  return (
    <div className="grid gap-3">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-w-[220px] rounded-xl border border-slate-300 px-3 py-2 focus:border-umgBlue focus:ring-umgBlue"
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Cámara ${d.deviceId.slice(0, 6)}…`}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={detectDevices}
          className="rounded-xl border px-3 py-2 hover:bg-slate-50"
        >
          Detectar cámaras
        </button>

        {!running ? (
          <button
            type="button"
            onClick={start}
            className="rounded-xl bg-umgBlue text-white px-3 py-2 hover:brightness-105"
          >
            Iniciar
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-xl bg-[--umg-red] text-white px-3 py-2 hover:brightness-105"
          >
            Detener
          </button>
        )}

        <button
          type="button"
          disabled={!running}
          onClick={() => toggleTorch(!torchOn)}
          className={`rounded-xl px-3 py-2 ${
            torchOn
              ? "bg-amber-500 text-white"
              : "border hover:bg-slate-50"
          } disabled:opacity-50`}
          title="Linterna (si está disponible)"
        >
          {torchOn ? "Linterna: ON" : "Linterna"}
        </button>
      </div>

      {/* Mensajes */}
      {errMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-3 py-2">
          {errMsg}
        </div>
      )}

      {/* Vista de cámara */}
      <div className="relative w-full max-w-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-soft">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full block bg-black"
        />
        {/* Marco de guía */}
        <div className="pointer-events-none absolute inset-0 m-4 rounded-2xl border-2 border-dashed border-white/70" />
      </div>

      <p className="text-xs text-slate-500">
        Tip: en móviles, usa la cámara trasera para mejor enfoque.
      </p>
    </div>
  );
}
