import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";

export const ease = [0.22, 1, 0.36, 1] as const;

export function Numero({ valor, decimales = 0, duracion = 0.9 }: { valor: number; decimales?: number; duracion?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? valor : 0);
  const ultimo = useRef(reduce ? valor : 0);
  useEffect(() => {
    if (reduce) { ultimo.current = valor; setV(valor); return; }
    const c = animate(ultimo.current, valor, {
      duration: duracion, ease: "easeOut",
      onUpdate: (x) => { ultimo.current = x; setV(x); },
    });
    return () => c.stop();
  }, [valor, reduce, duracion]);
  return <>{v.toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}</>;
}

export function Anillo({ progreso, size = 150, grosor = 12, color = "var(--color-lime)", children }: {
  progreso: number; size?: number; grosor?: number; color?: string; children?: ReactNode;
}) {
  const r = (size - grosor) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progreso));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-line)" strokeWidth={grosor} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} stroke={progreso > 1.05 ? "var(--color-ember)" : color}
          strokeWidth={grosor} fill="none" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ duration: 1, ease }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Barra({ progreso, color = "bg-ink dark:bg-lime", alto = "h-[3px]" }: { progreso: number; color?: string; alto?: string }) {
  return (
    <div className={`${alto} overflow-hidden rounded-full bg-track`}>
      <motion.div
        className={`h-full rounded-full ${progreso > 1.05 ? "bg-ember" : color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, progreso * 100)}%` }}
        transition={{ duration: 0.8, ease }}
      />
    </div>
  );
}

const TONOS = { base: "bg-surface", food: "bg-t-food", water: "bg-t-water", habit: "bg-t-habit" } as const;

export function Tarjeta({ children, className = "", delay = 0, tono = "base", tour }: { children: ReactNode; className?: string; delay?: number; tono?: keyof typeof TONOS; tour?: string }) {
  return (
    <motion.section
      data-tour={tour}
      className={`rounded-[20px] border border-line ${TONOS[tono]} p-5 ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
    >
      {children}
    </motion.section>
  );
}

/* Bloquea el scroll de la página mientras hay una hoja abierta (también en iPhone). */
let hojasAbiertas = 0;
let scrollGuardado = 0;
function bloquearScroll() {
  if (hojasAbiertas++ === 0) {
    scrollGuardado = window.scrollY;
    const b = document.body.style;
    b.position = "fixed"; b.top = `-${scrollGuardado}px`; b.left = "0"; b.right = "0"; b.overflow = "hidden";
  }
  return () => {
    if (--hojasAbiertas === 0) {
      const b = document.body.style;
      b.position = ""; b.top = ""; b.left = ""; b.right = ""; b.overflow = "";
      window.scrollTo(0, scrollGuardado);
    }
  };
}

export function Hoja({ abierta, onClose, titulo, children, ancha = false }: { abierta: boolean; onClose: () => void; titulo: string; children: ReactNode; ancha?: boolean }) {
  useEffect(() => (abierta ? bloquearScroll() : undefined), [abierta]);
  return (
    <AnimatePresence>
      {abierta && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 touch-none bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={titulo}
            className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain ${ancha ? "max-w-md md:max-w-4xl" : "max-w-md"} rounded-t-[24px] border border-line bg-bg p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] md:mb-[4vh] md:rounded-[24px]`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line md:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium">{titulo}</h2>
              <button onClick={onClose} className="text-sm text-muted hover:text-ink">Cerrar</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const inputCls =
  "w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-line-strong dark:focus:border-lime";

export const btnPrimario =
  "h-12 rounded-[14px] bg-lime px-5 font-display text-[17px] font-bold uppercase tracking-[0.1em] text-on-lime transition active:scale-[0.98] disabled:opacity-40";

export const btnSecundario =
  "h-12 rounded-[14px] border border-line bg-surface px-5 font-medium text-ink transition hover:border-line-strong active:scale-[0.98]";

export function Toast({ texto }: { texto: string | null }) {
  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-sm shadow-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
        >
          {texto}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToast() {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    if (!texto) return;
    const t = setTimeout(() => setTexto(null), 2200);
    return () => clearTimeout(t);
  }, [texto]);
  return [texto, setTexto] as const;
}

/** Barra segmentada estilo marcador deportivo. */
export function Segmentos({ progreso, n = 24 }: { progreso: number; n?: number }) {
  const llenos = Math.round(Math.min(1, Math.max(0, progreso)) * n);
  const pasado = progreso > 1.05;
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
      {Array.from({ length: n }, (_, i) => (
        <motion.i
          key={i}
          className={`block h-3 rounded-[2px] ${i < llenos ? (pasado ? "bg-ember" : "bg-ink dark:bg-lime") : "bg-track"}`}
          initial={{ scaleY: 0.3, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: i * 0.015, duration: 0.3 }}
        />
      ))}
    </div>
  );
}
