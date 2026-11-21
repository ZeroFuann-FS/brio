import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface Pestana<T extends string> { id: T; t: string; aviso?: boolean }

/**
 * Barra de pestañas de una sección (Comida, Entreno, Progreso).
 * La pestaña elegida se marca con una pastilla que se desliza, y el contenido entra
 * desde el lado hacia donde te moviste.
 */
export function BarraPestanas<T extends string>({ pestanas, actual, onCambiar, grupo, tour }: {
  pestanas: Pestana<T>[]; actual: T; onCambiar: (id: T) => void; grupo: string; tour?: string;
}) {
  const quieto = useReducedMotion();
  const mover = (dir: 1 | -1) => {
    const i = pestanas.findIndex((p) => p.id === actual);
    onCambiar(pestanas[(i + dir + pestanas.length) % pestanas.length].id);
  };
  return (
    <div role="tablist" aria-label="Secciones" data-tour={tour}
      onKeyDown={(e) => { if (e.key === "ArrowRight") mover(1); if (e.key === "ArrowLeft") mover(-1); }}
      className="mt-4 flex max-w-xl gap-1 rounded-[14px] border border-line bg-surface p-1">
      {pestanas.map((p) => {
        const sel = p.id === actual;
        return (
          <button key={p.id} role="tab" id={`tab-${grupo}-${p.id}`} aria-selected={sel} aria-controls={`panel-${grupo}`} tabIndex={sel ? 0 : -1}
            onClick={() => onCambiar(p.id)}
            className={`relative h-10 min-w-0 flex-1 rounded-[10px] px-1 font-display text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors sm:text-sm ${sel ? "text-bg dark:text-on-lime" : "text-muted hover:text-ink"}`}>
            {sel && (
              <motion.span layoutId={`pastilla-${grupo}`} aria-hidden
                className="absolute inset-0 rounded-[10px] bg-ink dark:bg-lime"
                transition={quieto ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }} />
            )}
            <span className="relative truncate">{p.t}</span>
            {p.aviso && !sel && <i aria-hidden className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-ember" />}
          </button>
        );
      })}
    </div>
  );
}

/** Contenido de la pestaña elegida, con transición según la dirección del cambio. */
export function PanelPestana<T extends string>({ pestanas, actual, grupo, children }: {
  pestanas: Pestana<T>[]; actual: T; grupo: string; children: ReactNode;
}) {
  const quieto = useReducedMotion();
  const previo = useRef(actual);
  const i = pestanas.findIndex((p) => p.id === actual);
  const j = pestanas.findIndex((p) => p.id === previo.current);
  const dir = i >= j ? 1 : -1;
  previo.current = actual;
  return (
    <div id={`panel-${grupo}`} role="tabpanel" aria-labelledby={`tab-${grupo}-${actual}`} className="mt-5">
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div key={actual} custom={dir}
          initial={quieto ? false : { opacity: 0, x: 24 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={quieto ? { opacity: 0 } : { opacity: 0, x: -16 * dir }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
