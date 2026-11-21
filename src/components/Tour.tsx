import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

export interface PasoTour { target?: string; titulo: string; texto: string }

const PAD = 8;

/** Elemento visible con data-tour (hay duplicados, p. ej. la navegación de celular y la de laptop). */
function buscar(target?: string): HTMLElement | null {
  if (!target) return null;
  const l = [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)];
  return l.find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; }) ?? null;
}

/** Recorrido guiado: oscurece la pantalla, ilumina una parte y explica con una burbuja. */
export default function Tour({ pasos, onFin }: { pasos: PasoTour[]; onFin: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const p = pasos[i];

  const medir = useCallback(() => {
    setVw(window.innerWidth); setVh(window.innerHeight);
    const el = buscar(p?.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [p?.target]);

  useLayoutEffect(() => {
    const el = buscar(p?.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const fuera = r.top < 70 || r.bottom > window.innerHeight - 90;
      if (fuera) el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? "start" : "center", behavior: "smooth" });
    }
    medir();
    const t1 = setTimeout(medir, 380), t2 = setTimeout(medir, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [i, p?.target, medir]);

  useEffect(() => {
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onFin(); if (e.key === "ArrowRight") setI((x) => Math.min(pasos.length - 1, x + 1)); if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1)); };
    window.addEventListener("keydown", tecla);
    return () => { window.removeEventListener("resize", medir); window.removeEventListener("scroll", medir, true); window.removeEventListener("keydown", tecla); };
  }, [medir, onFin, pasos.length]);

  if (!p) return null;
  const ultimo = i === pasos.length - 1;
  const ancho = Math.min(340, vw - 32);
  // Caja iluminada (recortada a la pantalla) y posición de la burbuja
  const caja = rect && {
    top: Math.max(8, rect.top - PAD), left: Math.max(8, rect.left - PAD),
    width: Math.min(vw - 16, rect.width + PAD * 2), height: Math.min(vh - 16, rect.height + PAD * 2),
  };
  const abajo = caja ? caja.top + caja.height + 12 : 0;
  const ponerAbajo = caja ? abajo + 210 < vh || caja.top < 230 : true;
  const burbuja = caja
    ? { left: Math.min(Math.max(16, caja.left + caja.width / 2 - ancho / 2), vw - ancho - 16), top: ponerAbajo ? Math.min(abajo, vh - 220) : undefined, bottom: ponerAbajo ? undefined : vh - caja.top + 12 }
    : { left: (vw - ancho) / 2, top: vh / 2 - 120 };

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Tutorial: ${p.titulo}`}>
      {/* Fondo oscuro con un hueco donde está lo que se explica */}
      <motion.svg className="absolute inset-0 h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} aria-hidden>
        <defs>
          <mask id="brio-tour-hueco">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <motion.rect rx="20" fill="black" initial={false}
              animate={caja ? { x: caja.left, y: caja.top, width: caja.width, height: caja.height } : { x: vw / 2, y: vh / 2, width: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }} />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(8,9,10,0.68)" mask="url(#brio-tour-hueco)" />
      </motion.svg>
      {caja && (
        <motion.div className="pointer-events-none absolute rounded-[20px] border-2 border-lime" initial={false} animate={caja} transition={{ type: "spring", stiffness: 260, damping: 30 }}>
          <motion.span className="absolute -inset-1 rounded-[22px] border-2 border-lime" animate={{ opacity: [0.8, 0], scale: [1, 1.04] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />
        </motion.div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={i} className="absolute rounded-[20px] border border-line bg-bg p-4 shadow-2xl" style={{ width: ancho, ...burbuja }}
          initial={{ opacity: 0, y: ponerAbajo ? 10 : -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}>
          <div className="flex items-center justify-between">
            <span className="lab">{i + 1} de {pasos.length}</span>
            <button onClick={onFin} className="lab hover:underline">Saltar</button>
          </div>
          <h3 className="mt-1.5 font-serif text-xl font-medium leading-tight">{p.titulo}</h3>
          <p className="mt-1.5 text-[15px] leading-snug text-muted">{p.texto}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex flex-1 gap-1">
              {pasos.map((_, k) => <motion.i key={k} className="h-1.5 rounded-full bg-lime" animate={{ width: k === i ? 18 : 6, opacity: k <= i ? 1 : 0.3 }} />)}
            </span>
            {i > 0 && <button onClick={() => setI(i - 1)} className="h-10 rounded-full border border-line px-4 text-sm">Atrás</button>}
            <button onClick={() => (ultimo ? onFin() : setI(i + 1))} className="h-10 rounded-full bg-lime px-5 text-sm font-semibold text-on-lime">{ultimo ? "¡Listo!" : "Siguiente"}</button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/* ---------- Qué recorridos ya vio ---------- */
const K = "brio:tutorial";
export type Recorrido = "hoy" | "comida" | "entreno" | "progreso";
export function tutorialVisto(r: Recorrido) { try { return !!JSON.parse(localStorage.getItem(K) ?? "{}")[r]; } catch { return true; } }
export function marcarTutorial(r: Recorrido) { try { const v = JSON.parse(localStorage.getItem(K) ?? "{}"); localStorage.setItem(K, JSON.stringify({ ...v, [r]: true })); } catch { /* sin storage */ } }
export function reiniciarTutorial() { try { localStorage.removeItem(K); } catch { /* sin storage */ } }

export const RECORRIDOS: Record<Recorrido, PasoTour[]> = {
  hoy: [
    { titulo: "¡Bienvenido a Brío!", texto: "Te enseño lo básico en un minuto. Puedes saltarlo y verlo después desde Perfil." },
    { target: "kcal", titulo: "Lo que te queda hoy", texto: "Tus calorías y macros del día. Se van llenando conforme registras lo que comes." },
    { target: "comidas", titulo: "Registra tu comida", texto: "Búscala (hay fotos y marcas), escanea el código de barras o usa una receta. Si tienes despensa, se descuenta sola." },
    { target: "agua", titulo: "Agua", texto: "Toca un vaso por cada 250 ml. Tu meta sale de tu peso." },
    { target: "habitos", titulo: "Hábitos y racha", texto: "Palomea lo que cumples. Si llegas a la mayoría, ese día cuenta para tu racha." },
    { target: "tudia", titulo: "Tu día y avisos", texto: "Arma tu horario (trabajo, gym, comidas) y activa avisos: pago del gym, despensa, entreno y más." },
    { target: "nav", titulo: "Todo lo demás", texto: "Comida: menú, recetas y despensa. Entreno: rutinas y series. Progreso: tu semana, metas y peso." },
    { titulo: "¡Listo, a darle con brío!", texto: "Cada sección tiene una mini guía la primera vez que entras. Constancia, no perfección." },
  ],
  comida: [
    { target: "comida-tabs", titulo: "Todo lo de tu comida", texto: "Hoy: lo que vas comiendo. Menú: Brío arma tu semana y la lista del súper. Recetas: más de 120 mexicanas y económicas. Despensa: lo que tienes en casa (el puntito rojo avisa si algo se acaba)." },
    { target: "comidas-hoy", titulo: "Registra lo que comes", texto: "Agrega cada comida y Brío lleva la cuenta de calorías y proteína del día." },
  ],
  entreno: [
    { target: "entreno-inicio", titulo: "Tu rutina", texto: "Contesta 3 preguntas, elige tus días y listo. Aquí ves qué te toca hoy y empiezas tu entreno." },
    { target: "mapa", titulo: "Músculos de la semana", texto: "Se pinta según las series que haces. Así sabes qué trabajaste y qué te falta." },
    { target: "entreno-tabs", titulo: "Historial y rutinas", texto: "En Historial ves tus entrenos y récords. En Rutinas cambias de rutina y abres el catálogo de más de 160 ejercicios." },
  ],
  progreso: [
    { target: "progreso-tabs", titulo: "Tu progreso", texto: "Resumen: cómo te fue en la semana y qué mejorar. Metas: aprender, carrera y dinero. Cuerpo: tu peso y medidas." },
  ],
};
