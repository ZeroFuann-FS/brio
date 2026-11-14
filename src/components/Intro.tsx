import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "motion/react";
import Logo from "./Logo";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease },
});

/* ---------- Paso 1: el logo se enciende ---------- */
function Splash() {
  return (
    <div className="flex flex-col items-center text-center">
      <Logo className="text-[clamp(5rem,26vw,8.5rem)]" animate delay={0.2} />
      <motion.p className="mt-8 font-display text-xl font-semibold text-ink/90" {...fadeUp(1.5)}>
        Ponle brío a tu vida.
      </motion.p>
      <motion.p className="mt-2 text-sm text-muted" {...fadeUp(1.8)}>
        Comida · Gym · Hábitos · Metas
      </motion.p>
    </div>
  );
}

/* ---------- Paso 2: qué significa ---------- */
const SIGNIFICADOS = ["pujanza", "espíritu", "valor", "resolución"];

function Definicion() {
  return (
    <div className="w-full">
      <motion.p className="text-sm font-medium uppercase tracking-[0.2em] text-lime" {...fadeUp(0)}>
        ¿Por qué Brío?
      </motion.p>
      <motion.div
        className="mt-5 rounded-3xl border border-line bg-surface p-6"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.6, ease }}
      >
        <div className="flex items-baseline gap-3">
          <span className="font-display text-4xl font-bold">brío</span>
          <span className="text-sm italic text-muted">sustantivo masculino</span>
        </div>
        <ul className="mt-5 space-y-3">
          {SIGNIFICADOS.map((s, i) => (
            <motion.li
              key={s}
              className="relative w-fit font-display text-2xl font-semibold"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.35, duration: 0.5, ease }}
            >
              <span className="mr-2 text-base text-muted">{i + 1}.</span>
              {s}
              <motion.span
                className="absolute -bottom-1 left-6 right-0 h-[3px] origin-left rounded-full bg-lime"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.75 + i * 0.35, duration: 0.45, ease }}
              />
            </motion.li>
          ))}
        </ul>
        <motion.p className="mt-5 text-xs text-muted" {...fadeUp(2.1)}>
          — Diccionario de la lengua española (RAE)
        </motion.p>
      </motion.div>
      <motion.p className="mt-6 text-lg leading-relaxed text-ink/90" {...fadeUp(2.3)}>
        Es la <span className="font-semibold text-lime">fuerza con la que haces las cosas</span>: con ganas, con decisión y sin rendirte.
      </motion.p>
    </div>
  );
}

/* ---------- Paso 3: constancia, no motivación ---------- */
function Constancia() {
  const reduce = useReducedMotion();
  const [dias, setDias] = useState(reduce ? 23 : 0);

  useEffect(() => {
    if (reduce) return;
    const c = animate(0, 23, { delay: 1.6, duration: 1.6, ease: "easeOut", onUpdate: (v) => setDias(Math.round(v)) });
    return () => c.stop();
  }, [reduce]);

  return (
    <div className="w-full">
      <motion.p className="font-display text-[clamp(1.25rem,6vw,1.6rem)] font-bold leading-tight text-muted" {...fadeUp(0)}>
        <span className="relative inline-block whitespace-nowrap">
          No es motivación de un día.
          <motion.span
            className="absolute left-0 right-0 top-1/2 h-[3px] origin-left rounded-full bg-ember"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.5, ease }}
          />
        </span>
      </motion.p>
      <motion.p className="mt-3 font-display text-5xl font-extrabold text-ink" {...fadeUp(1.2)}>
        Es <span className="text-lime">constancia</span>.
      </motion.p>

      <motion.div
        className="mt-10 flex items-center gap-4 rounded-3xl border border-line bg-surface p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6, ease }}
      >
        <motion.span
          className="text-5xl"
          animate={reduce ? undefined : { scale: [1, 1.15, 1], rotate: [0, -4, 4, 0] }}
          transition={{ delay: 1.8, duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
        >
          🔥
        </motion.span>
        <div>
          <p className="font-display text-4xl font-extrabold tabular-nums">{dias}</p>
          <p className="text-sm text-muted">días con brío</p>
        </div>
      </motion.div>

      <motion.p className="mt-6 text-lg leading-relaxed text-ink/90" {...fadeUp(3.2)}>
        Cada comida registrada, cada serie, cada página leída y cada peso ahorrado <span className="font-semibold text-lime">le suma a tu brío</span>.
      </motion.p>
    </div>
  );
}

/* ---------- Paso 4: las formas de brío ---------- */
const PILARES = [
  { e: "🍳", t: "Brío para cuidarte", d: "Comer bien sin dejar de disfrutar" },
  { e: "🏋️", t: "Brío físico", d: "La fuerza que construyes serie tras serie" },
  { e: "✅", t: "Brío diario", d: "Lo pequeño que repites hasta que eres tú" },
  { e: "🎯", t: "Brío para crecer", d: "Carrera, aprendizaje y dinero" },
  { e: "🔥", t: "Tu nivel de brío", d: "Cuántos días seguidos lo has mantenido" },
];

function Pilares() {
  return (
    <div className="w-full">
      <motion.p className="text-sm font-medium uppercase tracking-[0.2em] text-lime" {...fadeUp(0)}>
        Todo lo que harás aquí
      </motion.p>
      <motion.h2 className="mt-3 font-display text-3xl font-bold leading-tight" {...fadeUp(0.1)}>
        Cada sección es una forma de brío
      </motion.h2>
      <ul className="mt-6 space-y-2.5">
        {PILARES.map((p, i) => (
          <motion.li
            key={p.t}
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.12, type: "spring", stiffness: 200, damping: 22 }}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bg text-2xl">{p.e}</span>
            <div>
              <p className="font-semibold">{p.t}</p>
              <p className="text-sm text-muted">{p.d}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Paso 5: manifiesto ---------- */
function Manifiesto() {
  return (
    <div className="flex flex-col items-center text-center">
      <Logo className="text-7xl" animate />
      <motion.p className="mt-10 font-display text-2xl font-semibold leading-snug" {...fadeUp(1.1)}>
        Brío es la energía que pones <span className="text-lime">todos los días</span> para convertirte en tu mejor versión.
      </motion.p>
      <motion.p className="mt-4 text-muted" {...fadeUp(1.5)}>
        Sin iPhone, sin reloj, sin muros de pago. Solo tú y tu constancia.
      </motion.p>
    </div>
  );
}

const PASOS: { id: string; render: () => ReactNode }[] = [
  { id: "splash", render: () => <Splash /> },
  { id: "definicion", render: () => <Definicion /> },
  { id: "constancia", render: () => <Constancia /> },
  { id: "pilares", render: () => <Pilares /> },
  { id: "manifiesto", render: () => <Manifiesto /> },
];

export default function Intro({ onDone }: { onDone: () => void }) {
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState(1);
  const ultimo = paso === PASOS.length - 1;

  const ir = (n: number) => {
    if (n < 0) return;
    if (n >= PASOS.length) return onDone();
    setDir(n > paso ? 1 : -1);
    setPaso(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") ir(paso + 1);
      if (e.key === "ArrowLeft") ir(paso - 1);
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <motion.div
      className="relative flex h-full flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45 }}
    >
      {/* fondo: brasas que respiran */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(198,244,50,0.12) 0%, rgba(255,138,61,0.05) 40%, transparent 70%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto flex w-full max-w-md items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex gap-1.5" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
          {PASOS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => ir(i)}
              aria-label={`Ir al paso ${i + 1}`}
              className="h-1.5 overflow-hidden rounded-full bg-line transition-all"
              style={{ width: i === paso ? 28 : 10 }}
            >
              <motion.span
                className="block h-full rounded-full bg-lime"
                initial={false}
                animate={{ width: i <= paso ? "100%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </button>
          ))}
        </div>
        {!ultimo && (
          <button onClick={onDone} className="px-2 py-1 text-sm text-muted transition hover:text-ink">
            Saltar
          </button>
        )}
      </div>

      <div className="relative flex flex-1 items-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section
            key={PASOS[paso].id}
            custom={dir}
            className="mx-auto flex w-full max-w-md justify-center px-6"
            initial={{ opacity: 0, x: 60 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * dir }}
            transition={{ duration: 0.35, ease }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) ir(paso + 1);
              else if (info.offset.x > 70) ir(paso - 1);
            }}
          >
            {PASOS[paso].render()}
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto flex w-full max-w-md items-center gap-3 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {paso > 0 && (
          <button
            onClick={() => ir(paso - 1)}
            className="grid h-14 w-14 place-items-center rounded-2xl border border-line text-xl text-muted transition hover:text-ink"
            aria-label="Anterior"
          >
            ←
          </button>
        )}
        <motion.button
          onClick={() => ir(paso + 1)}
          className="h-14 flex-1 rounded-2xl bg-lime font-display text-lg font-bold text-bg"
          whileTap={{ scale: 0.97 }}
          animate={ultimo ? { boxShadow: ["0 0 0 0 rgba(198,244,50,0.5)", "0 0 0 14px rgba(198,244,50,0)"] } : { boxShadow: "0 0 0 0 rgba(198,244,50,0)" }}
          transition={ultimo ? { duration: 1.6, repeat: Infinity } : undefined}
        >
          {ultimo ? "Empezar con brío ⚡" : "Continuar"}
        </motion.button>
      </div>
    </motion.div>
  );
}
