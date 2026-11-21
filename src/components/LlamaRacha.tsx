import { useEffect, useState } from "react";
import { motion } from "motion/react";

/** Evento que dispara la llama: se manda al completar el día con brío. */
export const RACHA_SUBE = "brio:racha-sube";
const K_FECHA = "brio:llama-fecha";

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

type Fase = "sube" | "brilla" | "llama" | "guarda";

/**
 * Celebración de racha: una luz sube desde abajo hasta el chip, estalla en un destello
 * y aparece una llama verde que titila; luego se encoge y se guarda en el chip.
 */
export default function LlamaRacha({ dias, onPico, onFin }: { dias: number; onPico: () => void; onFin: () => void }) {
  const [fase, setFase] = useState<Fase>("sube");
  const chip = typeof document !== "undefined" ? document.querySelector("[data-racha]")?.getBoundingClientRect() : undefined;
  const meta = chip ? { x: chip.left + chip.width / 2, y: chip.top + chip.height / 2 } : { x: innerWidth / 2, y: 44 };
  const centro = { x: innerWidth / 2, y: Math.min(innerHeight * 0.36, 300) };

  useEffect(() => {
    const t1 = setTimeout(() => setFase("brilla"), 650);
    const t2 = setTimeout(() => { setFase("llama"); onPico(); }, 900);
    const t3 = setTimeout(() => setFase("guarda"), 2500);
    const t4 = setTimeout(onFin, 3100);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onPico, onFin]);

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

      {/* 3) La llama: aparece grande, titila y se guarda en el chip */}
      {(fase === "llama" || fase === "guarda") && (
        <motion.div className="absolute left-0 top-0"
          initial={{ x: meta.x, y: meta.y, scale: 0.2, opacity: 0 }}
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
