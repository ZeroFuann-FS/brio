import { motion } from "motion/react";
import Logo from "./Logo";

const MODULOS = [
  { e: "🍳", t: "Comida", d: "Plan semanal, recetas y copiar comidas" },
  { e: "🏋️", t: "Gym", d: "Rutinas, series y mapa muscular" },
  { e: "✅", t: "Hábitos", d: "Agua, lectura, sueño y pasos" },
  { e: "🎯", t: "Metas", d: "Carrera, aprendizaje y dinero" },
];

export default function Home({ onVerIntro }: { onVerIntro: () => void }) {
  return (
    <motion.main
      className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 pb-10 pt-[max(env(safe-area-inset-top),1.5rem)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex items-center justify-between">
        <Logo className="text-4xl" />
        <button
          onClick={onVerIntro}
          className="rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-lime hover:text-ink"
        >
          ¿Por qué Brío?
        </button>
      </header>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">Hoy</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Hola 👋</h1>
        <p className="mt-2 text-muted">
          Estamos construyendo tu espacio. Muy pronto: onboarding, metas calculadas y tu pantalla de Hoy.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-ember/15 px-2.5 py-1 font-medium text-ember">🔥 0 días con brío</span>
          <span className="text-muted">¡El primero está cerca!</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {MODULOS.map((m, i) => (
          <motion.div
            key={m.t}
            className="rounded-2xl border border-line bg-surface p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
          >
            <div className="text-2xl">{m.e}</div>
            <div className="mt-2 font-semibold">{m.t}</div>
            <div className="mt-1 text-xs leading-snug text-muted">{m.d}</div>
            <div className="mt-3 text-[11px] font-medium uppercase tracking-wider text-lime/80">Próximamente</div>
          </motion.div>
        ))}
      </section>

      <p className="mt-auto text-center text-xs text-muted">v0.1 · Ponle brío a tu vida.</p>
    </motion.main>
  );
}
