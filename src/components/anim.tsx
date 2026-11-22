import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/** Chispitas lima que salen de un punto cuando `disparo` cambia (por ejemplo, al marcar un hábito). */
export function Chispas({ disparo, n = 7 }: { disparo: number; n?: number }) {
  const quieto = useReducedMotion();
  if (!disparo || quieto) return null;
  return (
    <span key={disparo} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (i % 2 ? 0.25 : 0);
        const d = 24 + (i % 3) * 8;
        return (
          <motion.i key={i} className={`absolute rounded-full bg-lime ring-[1.5px] ring-lime-ink/60 shadow-[0_0_8px_2px_rgba(198,244,50,.8)] ${i % 2 ? "h-[6px] w-[6px]" : "h-[8px] w-[8px]"}`}
            initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, scale: [0.6, 1.2, 0.4], opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.4, 1], ease: [0.2, 0.8, 0.4, 1] }} />
        );
      })}
    </span>
  );
}

/** Palomita que se dibuja con trazo. */
export function Palomita({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-[13px] w-[13px]" aria-hidden>
      <motion.path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"
        initial={false} animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 1 : 0 }} transition={{ duration: 0.28, ease: "easeOut" }} />
    </svg>
  );
}

/**
 * Vaso de agua que se llena con una ola. `meta` = es el vaso con el que se llega a la meta;
 * `cadena` = índice para la ola en cadena cuando se completa la meta.
 */
export function Vaso({ lleno, extra, celebrar, i, onClick, etiqueta }: {
  lleno: boolean; extra: boolean; celebrar: number; i: number; onClick: () => void; etiqueta: string;
}) {
  const quieto = useReducedMotion();
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={etiqueta}
      className={`relative h-[30px] overflow-hidden rounded-[5px_5px_9px_9px] border transition-colors ${lleno ? (extra ? "border-lime" : "border-water") : "border-line-strong/60"}`}>
      <motion.span aria-hidden className="absolute inset-x-0 bottom-0 bg-water"
        initial={false} animate={{ height: lleno ? "100%" : "0%" }}
        transition={quieto ? { duration: 0 } : { duration: 0.45, ease: [0.3, 0.9, 0.4, 1] }}>
        {/* la ola en la superficie */}
        {!quieto && (
          <motion.svg viewBox="0 0 40 8" preserveAspectRatio="none" className="absolute -top-[5px] left-0 h-[6px] w-[200%] text-water"
            animate={{ x: ["0%", "-50%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
            <path d="M0 4 Q5 0 10 4 T20 4 T30 4 T40 4 V8 H0 Z" fill="currentColor" />
          </motion.svg>
        )}
      </motion.span>
      {/* ola en cadena al cumplir la meta */}
      {celebrar > 0 && lleno && !quieto && (
        <motion.span key={celebrar} aria-hidden className="absolute inset-0 bg-white/70"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0] }} transition={{ duration: 0.45, delay: i * 0.06 }} />
      )}
    </motion.button>
  );
}

/** "−390 kcal" que sube y se desvanece cuando cambia un valor (por ejemplo, al registrar una comida). */
export function DeltaFlotante({ valor, unidad }: { valor: number; unidad: string }) {
  const previo = useRef(valor);
  const quieto = useReducedMotion();
  const [delta, setDelta] = useState<{ n: number; k: number } | null>(null);
  useEffect(() => {
    const d = valor - previo.current;
    previo.current = valor;
    if (d && !quieto) setDelta({ n: d, k: Date.now() });
  }, [valor, quieto]);
  return (
    <AnimatePresence>
      {delta && (
        <motion.span key={delta.k} aria-hidden onAnimationComplete={() => setDelta(null)}
          className={`pointer-events-none absolute right-2 top-1 font-display text-lg font-semibold ${delta.n > 0 ? "text-ember" : "text-lime-ink"}`}
          initial={{ y: 8, opacity: 0 }} animate={{ y: -22, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.3, times: [0, 0.15, 0.7, 1] }}>
          {delta.n > 0 ? "+" : "−"}{Math.abs(delta.n).toLocaleString("es-MX")} {unidad}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Confeti lima y crema que cae desde arriba cuando `disparo` cambia (meta cumplida). */
export function Confeti({ disparo }: { disparo: number }) {
  const quieto = useReducedMotion();
  if (!disparo || quieto) return null;
  const colores = ["#c6f432", "#f4ffd0", "#17191c", "#9ed0ff", "#c6f432"];
  return (
    <div key={disparo} aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 60 }, (_, i) => {
        const x = Math.random() * 100, giro = (Math.random() - 0.5) * 720, lado = (Math.random() - 0.5) * 120;
        const dur = 1.8 + Math.random() * 1.4, retraso = Math.random() * 0.35;
        return (
          <motion.i key={i} className="absolute top-0 block rounded-[2px]"
            style={{ left: `${x}%`, width: i % 3 ? 8 : 6, height: i % 3 ? 14 : 6, background: colores[i % colores.length] }}
            initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: innerHeight + 40, x: lado, rotate: giro, opacity: [1, 1, 0.9, 0] }}
            transition={{ duration: dur, delay: retraso, ease: [0.25, 0.4, 0.5, 1] }} />
        );
      })}
    </div>
  );
}

/**
 * Palomita de ejercicio terminado. Con `celebrar`: entra con rebote, se dibuja,
 * sale un anillo lima y chispas alrededor.
 */
export function CheckListo({ celebrar }: { celebrar: boolean }) {
  const quieto = useReducedMotion();
  const anima = celebrar && !quieto;
  return (
    <span className="relative grid h-7 w-7 shrink-0 place-items-center">
      {anima && (
        <motion.span aria-hidden className="absolute inset-0 rounded-full border-2 border-lime"
          initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 0.75, ease: "easeOut" }} />
      )}
      <motion.span className="grid h-7 w-7 place-items-center rounded-full bg-lime text-on-lime"
        initial={anima ? { scale: 0, rotate: -40 } : false} animate={{ scale: [anima ? 0 : 1, anima ? 1.25 : 1, 1], rotate: 0 }}
        transition={{ duration: 0.5, times: [0, 0.6, 1], ease: [0.2, 0.9, 0.3, 1.2] }}>
        <svg viewBox="0 0 16 16" className="h-[15px] w-[15px]" aria-hidden>
          <motion.path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"
            initial={anima ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ delay: anima ? 0.25 : 0, duration: 0.3, ease: "easeOut" }} />
        </svg>
      </motion.span>
      {anima && <Chispas disparo={1} n={9} />}
    </span>
  );
}
