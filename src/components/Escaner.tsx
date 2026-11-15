import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { btnSecundario } from "./ui";

/** Lector de código de barras con la cámara (ZXing, funciona también en iPhone). */
export default function Escaner({ onCodigo, onCerrar }: { onCodigo: (codigo: string) => void; onCerrar: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let parar: (() => void) | null = null;
    let vivo = true;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const lector = new BrowserMultiFormatReader();
        const controles = await lector.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          video.current!,
          (resultado) => {
            if (!resultado || !vivo) return;
            const texto = resultado.getText();
            if (/^\d{6,14}$/.test(texto)) { vivo = false; controles.stop(); onCodigo(texto); }
          },
        );
        if (!vivo) controles.stop(); else parar = () => controles.stop();
      } catch (e) {
        const n = (e as Error).name;
        setError(n === "NotAllowedError" ? "Necesitamos permiso para usar la cámara. Actívalo en la configuración del navegador." : "No se pudo abrir la cámara en este dispositivo.");
      }
    })();
    return () => { vivo = false; parar?.(); };
  }, [onCodigo]);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-line bg-black">
        <video ref={video} className="h-full w-full object-cover" muted playsInline />
        {!error && (
          <>
            <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-[38%] -translate-y-1/2 rounded-[12px] border-2 border-lime" />
            <motion.div className="pointer-events-none absolute inset-x-[14%] h-0.5 bg-lime" animate={{ top: ["34%", "66%", "34%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
          </>
        )}
        {error && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white">{error}</p>}
      </div>
      <p className="lab mt-2 text-center">Apunta al código de barras del empaque</p>
      <button onClick={onCerrar} className={`${btnSecundario} mt-3 w-full`}>Cancelar</button>
    </div>
  );
}
