import { useEffect, useState } from "react";
import { motion } from "motion/react";

/** Evento que dispara la llama: se manda al completar el día con brío. */
export const RACHA_SUBE = "brio:racha-sube";
const K_FECHA = "brio:llama-fecha";
/** "cascada" = fuego que baja y genera la llama (nueva) · "clasica" = destello y llama (anterior). */
export type EstiloLlama = "cascada" | "clasica";
const K_ESTILO = "brio:llama-estilo";
export function estiloLlama(): EstiloLlama {
  try { return localStorage.getItem(K_ESTILO) === "clasica" ? "clasica" : "cascada"; } catch { return "cascada"; }
}

/** Avisa que hoy se completó el día con brío; la animación sale solo una vez por día. */
export function celebrarRacha(fechaHoy: string) {
  try {
    if (localStorage.getItem(K_FECHA) === fechaHoy) return;
    localStorage.setItem(K_FECHA, fechaHoy);
  } catch { /* sin storage: igual celebramos */ }
  window.dispatchEvent(new Event(RACHA_SUBE));
}

/** Ícono de llama de Brío (dibujo propio): llama exterior lima y corazón claro. */
export function IconoLlama({ className = "", brillo = false }: { className?: string; brillo?: boolean }) {
  return (
    <svg viewBox="0 0 64 72" className={className} aria-hidden>
      <defs>
        <linearGradient id="llama-ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4ff7a" />
          <stop offset="0.55" stopColor="#c6f432" />
          <stop offset="1" stopColor="#7cc400" />
        </linearGradient>
        <linearGradient id="llama-int" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#efffc0" />
        </linearGradient>
        {brillo && (
          <filter id="llama-brillo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>
      <g filter={brillo ? "url(#llama-brillo)" : undefined}>
        <path fill="url(#llama-ext)" d="M33 3c3 11 12 16 17 25 4 7 5 15 2 23-3 9-11 16-21 16S13 61 10 52c-3-8-1-16 4-23 2 5 5 8 9 9-2-7-1-15 3-22 2-4 5-8 7-13z" />
        <path fill="url(#llama-int)" d="M32 33c2 6 8 9 10 15 2 7-3 14-10 14s-12-6-10-13c1-3 3-5 5-6 0 3 1 5 3 6-1-6 0-11 2-16z" />
      </g>
    </svg>
  );
}

type Fase = "sube" | "brilla" | "baja" | "llama" | "guarda";

/**
 * Celebración de racha: una luz sube desde abajo hasta el chip, estalla en un destello
 * y aparece una llama verde que titila; luego se encoge y se guarda en el chip.
 */
export default function LlamaRacha({ dias, onPico, onFin, estilo = estiloLlama() }: { dias: number; onPico: () => void; onFin: () => void; estilo?: EstiloLlama }) {
  const [fase, setFase] = useState<Fase>("sube");
  const chip = typeof document !== "undefined" ? document.querySelector("[data-racha]")?.getBoundingClientRect() : undefined;
  const meta = chip ? { x: chip.left + chip.width / 2, y: chip.top + chip.height / 2 } : { x: innerWidth / 2, y: 44 };
  const centro = { x: innerWidth / 2, y: Math.min(innerHeight * 0.36, 300) };

  const cascada = estilo === "cascada";
  useEffect(() => {
    // cascada: sube 650 · brilla 250 · baja el fuego 900 · llama 1600 · se guarda 600
    const tiempos = cascada ? [650, 900, 1800, 3400, 4000] : [650, 900, 900, 2500, 3100];
    const t1 = setTimeout(() => setFase("brilla"), tiempos[0]);
    const t2 = setTimeout(() => setFase(cascada ? "baja" : "llama"), tiempos[1]);
    const t3 = setTimeout(() => { setFase("llama"); onPico(); }, tiempos[2]);
    const t4 = setTimeout(() => setFase("guarda"), tiempos[3]);
    const t5 = setTimeout(onFin, tiempos[4]);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onPico, onFin, cascada]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {/* Velo suave para que resalte */}
      <motion.div className="absolute inset-0 bg-black/25 dark:bg-black/45"
        initial={{ opacity: 0 }} animate={{ opacity: fase === "guarda" ? 0 : 1 }} transition={{ duration: 0.35 }} />

      {/* 1) La luz que sube con su estela */}
      {fase === "sube" && (
        <motion.div className="absolute" style={{ left: meta.x, top: 0 }}
          initial={{ y: innerHeight + 40 }} animate={{ y: meta.y }} transition={{ duration: 0.65, ease: [0.5, 0, 0.75, 0] }}>
          <div className="absolute left-1/2 top-0 h-[38vh] w-[6px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#f4ffd0] via-lime/80 to-transparent blur-[1px]" />
          <div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4ffd0] shadow-[0_0_18px_8px_rgba(198,244,50,.9),0_0_44px_18px_rgba(198,244,50,.45)]" />
        </motion.div>
      )}

      {/* 2) Destello al llegar arriba */}
      {(fase === "brilla" || fase === "llama") && (
        <div className="absolute" style={{ left: meta.x, top: meta.y }}>
          <motion.div className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4ffd0]"
            initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}
            style={{ boxShadow: "0 0 60px 30px rgba(198,244,50,.8)" }} />
          {[0, 0.12].map((d) => (
            <motion.div key={d} className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-lime"
              initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 3.4, opacity: 0 }} transition={{ duration: 0.8, delay: d, ease: "easeOut" }} />
          ))}
        </div>
      )}

      {/* 2b) Cascada: cortina de fuego verde que baja de arriba a abajo */}
      {fase === "baja" && (
        <motion.div className="absolute inset-x-0 top-0 h-screen"
          initial={{ y: "-100%" }} animate={{ y: "100%" }} transition={{ duration: 0.9, ease: [0.45, 0, 0.55, 1] }}>
          {/* rastro de luz que deja el fuego */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lime/25 to-lime/60" />
          {/* frente de llamas */}
          <div className="absolute inset-x-[-6%] bottom-0 flex translate-y-[45%] items-end justify-between">
            {Array.from({ length: 9 }, (_, i) => (
              <motion.div key={i} className="origin-bottom"
                animate={{ scaleY: [1, 1.25, 0.9, 1.15, 1], rotate: [0, i % 2 ? 4 : -4, 0] }}
                transition={{ duration: 0.35 + (i % 3) * 0.08, repeat: Infinity, ease: "easeInOut" }}>
                <IconoLlama className={`${i % 2 ? "h-24 w-20" : "h-32 w-28"} drop-shadow-[0_0_22px_rgba(198,244,50,.85)]`} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Destello al generarse la llama (cascada): sale del centro */}
      {cascada && fase === "llama" && (
        <div className="absolute" style={{ left: centro.x, top: centro.y }}>
          <motion.div className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4ffd0]"
            initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ boxShadow: "0 0 70px 34px rgba(198,244,50,.8)" }} />
        </div>
      )}

      {/* 3) La llama: aparece grande, titila y se guarda en el chip */}
      {(fase === "llama" || fase === "guarda") && (
        <motion.div className="absolute left-0 top-0"
          initial={cascada ? { x: centro.x, y: centro.y + 40, scale: 0.1, opacity: 0 } : { x: meta.x, y: meta.y, scale: 0.2, opacity: 0 }}
          animate={fase === "llama"
            ? { x: centro.x, y: centro.y, scale: 1, opacity: 1 }
            : { x: meta.x, y: meta.y, scale: 0.12, opacity: 0 }}
          transition={fase === "llama" ? { type: "spring", stiffness: 260, damping: 16 } : { duration: 0.55, ease: [0.6, 0, 0.8, 0.4] }}>
          <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <motion.div className="origin-bottom"
            animate={{ scaleY: [1, 1.08, 0.97, 1.05, 1], scaleX: [1, 0.96, 1.03, 0.98, 1], rotate: [0, -2.5, 2, -1.5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}>
            <IconoLlama brillo className="h-40 w-36 drop-shadow-[0_0_28px_rgba(198,244,50,.75)]" />
          </motion.div>
          <motion.p className="mt-3 whitespace-nowrap rounded-full bg-surface px-4 py-1.5 font-display text-lg font-semibold uppercase tracking-[0.08em] text-ink shadow-lg"
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
            ¡Racha de {dias} {dias === 1 ? "día" : "días"}!
          </motion.p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
