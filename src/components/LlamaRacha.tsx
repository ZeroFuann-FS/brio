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

type FaseR = "sube" | "gira" | "forma" | "va";

/**
 * Celebración de racha (remolino): una bola de fuego sube desde abajo hasta el centro, las brasas giran en espiral,
 * de ahí se forma la llama verde, y la llama vuela al chip de racha y lo enciende.
 */
export default function LlamaRacha({ dias, onPico, onFin }: { dias: number; onPico: () => void; onFin: () => void }) {
  const [fase, setFase] = useState<FaseR>("sube");
  const chip = document.querySelector("[data-racha]")?.getBoundingClientRect();
  const meta = chip ? { x: chip.left + 16, y: chip.top + chip.height / 2 } : { x: innerWidth / 2, y: 44 };
  const centro = { x: innerWidth / 2, y: Math.min(innerHeight * 0.42, 340) };

  useEffect(() => {
    // sube 750 · gira 1000 · forma 1300 · va 550 (al llegar se enciende el chip)
    const t1 = setTimeout(() => setFase("gira"), 750);
    const t2 = setTimeout(() => setFase("forma"), 1750);
    const t3 = setTimeout(() => setFase("va"), 3050);
    const t4 = setTimeout(onPico, 3550);
    const t5 = setTimeout(onFin, 3700);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onPico, onFin]);

  const brasas = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <motion.div className="absolute inset-0 bg-black/25 dark:bg-black/45"
        initial={{ opacity: 0 }} animate={{ opacity: fase === "va" ? 0 : 1 }} transition={{ duration: 0.4 }} />

      {/* 1) Bola de fuego que sube desde abajo hasta el centro, con estela de llama */}
      {fase === "sube" && (
        <motion.div className="absolute" style={{ left: centro.x, top: 0 }}
          initial={{ y: innerHeight + 60 }} animate={{ y: centro.y }} transition={{ duration: 0.75, ease: [0.3, 0, 0.4, 1] }}>
          <div className="absolute left-1/2 top-0 h-[34vh] w-10 -translate-x-1/2 rounded-full bg-gradient-to-b from-lime/90 via-lime/35 to-transparent blur-md" />
          <motion.div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[70%]"
            animate={{ scaleY: [1, 1.2, 0.95, 1.15, 1] }} transition={{ duration: 0.3, repeat: Infinity }}>
            <IconoLlama brillo className="h-16 w-14 drop-shadow-[0_0_18px_rgba(198,244,50,.9)]" />
          </motion.div>
        </motion.div>
      )}

      {/* 2) Remolino: brasas que giran en espiral alrededor del centro y se cierran */}
      {fase === "gira" && (
        <div className="absolute" style={{ left: centro.x, top: centro.y }}>
          <motion.div className="absolute h-0 w-0" animate={{ rotate: 720 }} transition={{ duration: 1, ease: [0.4, 0, 0.6, 1] }}>
            {brasas.map((i) => {
              const ang = (i / brasas.length) * Math.PI * 2;
              return (
                <motion.span key={i} className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eaff9a] shadow-[0_0_14px_5px_rgba(198,244,50,.85)]"
                  initial={{ x: Math.cos(ang) * 30, y: Math.sin(ang) * 30, scale: 0.4 }}
                  animate={{ x: [Math.cos(ang) * 30, Math.cos(ang) * 110, 0], y: [Math.sin(ang) * 30, Math.sin(ang) * 110, 0], scale: [0.4, 1.2, 0.6] }}
                  transition={{ duration: 1, times: [0, 0.45, 1], ease: "easeInOut" }} />
              );
            })}
          </motion.div>
          {/* núcleo que se va calentando */}
          <motion.div className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/70 blur-lg"
            initial={{ scale: 0.3, opacity: 0.4 }} animate={{ scale: 1.6, opacity: 1 }} transition={{ duration: 1 }} />
        </div>
      )}

      {/* 3) Se forma la llama (con destello) y 4) vuela al chip */}
      {(fase === "forma" || fase === "va") && (
        <>
          {fase === "forma" && (
            <div className="absolute" style={{ left: centro.x, top: centro.y }}>
              <motion.div className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4ffd0]"
                initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ boxShadow: "0 0 70px 34px rgba(198,244,50,.8)" }} />
            </div>
          )}
          <motion.div className="absolute left-0 top-0"
            initial={{ x: centro.x, y: centro.y, scale: 0.15, opacity: 0, rotate: -40 }}
            animate={fase === "forma"
              ? { x: centro.x, y: centro.y, scale: 1, opacity: 1, rotate: 0 }
              : { x: meta.x, y: meta.y, scale: 0.13, opacity: 1, rotate: 0 }}
            transition={fase === "forma" ? { type: "spring", stiffness: 240, damping: 14 } : { duration: 0.5, ease: [0.55, 0, 0.75, 0.3] }}>
            <div className="flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <motion.div className="origin-bottom"
                animate={{ scaleY: [1, 1.08, 0.97, 1.05, 1], scaleX: [1, 0.96, 1.03, 0.98, 1], rotate: [0, -2.5, 2, -1.5, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}>
                <IconoLlama brillo className="h-40 w-36 drop-shadow-[0_0_28px_rgba(198,244,50,.75)]" />
              </motion.div>
              <motion.p className="mt-3 whitespace-nowrap rounded-full bg-surface px-4 py-1.5 font-display text-lg font-semibold uppercase tracking-[0.08em] text-ink shadow-lg"
                initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: fase === "va" ? 0 : 1 }} transition={{ delay: fase === "va" ? 0 : 0.3, duration: 0.25 }}>
                ¡Racha de {dias} {dias === 1 ? "día" : "días"}!
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
