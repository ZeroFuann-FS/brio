import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { diasEntre, fechaCorta, hoyISO, sumarDias, type Metas, type Perfil } from "../lib/calc";
import { HABITOS, MIN_BRIO, frecuentes, puntosDia, racha, useBrio, type TipoComida } from "../lib/store";
import { Anillo, Barra, Hoja, Numero, Tarjeta, Toast, btnPrimario, btnSecundario, inputCls, useToast } from "./ui";

const TIPOS: { id: TipoComida; e: string; t: string }[] = [
  { id: "desayuno", e: "🍳", t: "Desayuno" },
  { id: "comida", e: "🍽️", t: "Comida" },
  { id: "cena", e: "🌙", t: "Cena" },
  { id: "snack", e: "🍎", t: "Snack" },
];

function tipoPorHora(): TipoComida {
  const h = new Date().getHours();
  if (h < 11) return "desayuno";
  if (h < 17) return "comida";
  if (h < 22) return "cena";
  return "snack";
}

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default function Hoy({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  const hoy = hoyISO();
  const ayer = sumarDias(hoy, -1);
  const dias = useBrio((s) => s.dias);
  const { addComida, removeComida, copiarDia, addAgua, toggleHabito } = useBrio();
  const d = dias[hoy] ?? { comidas: [], aguaMl: 0, habitos: {} };
  const [toast, setToast] = useToast();
  const [hoja, setHoja] = useState(false);
  const [form, setForm] = useState({ nombre: "", kcal: "", proteina: "", tipo: tipoPorHora() });

  const kcal = d.comidas.reduce((a, c) => a + c.kcal, 0);
  const prot = d.comidas.reduce((a, c) => a + c.proteina, 0);
  const restantes = metas.kcal - kcal;
  const puntos = puntosDia(d, metas.aguaMl);
  const nRacha = racha(dias, metas.aguaMl);
  const recientes = frecuentes(dias);
  const comidasAyer = dias[ayer]?.comidas.length ?? 0;
  const faltaMotivo = perfil.motivo ? diasEntre(hoy, perfil.motivo.fecha) : null;

  const guardar = () => {
    const k = Number(form.kcal), p = Number(form.proteina || 0);
    if (!form.nombre.trim() || !(k > 0)) return;
    addComida(hoy, { nombre: form.nombre.trim(), kcal: Math.round(k), proteina: Math.round(p), tipo: form.tipo });
    setForm({ nombre: "", kcal: "", proteina: "", tipo: tipoPorHora() });
    setHoja(false);
    setToast("Registrado ✅");
  };

  const marcarHabito = (id: string) => {
    const antes = puntosDia(d, metas.aguaMl);
    toggleHabito(hoy, id);
    if (!d.habitos[id] && antes + 1 === MIN_BRIO) setToast("🔥 ¡Día con brío desbloqueado!");
  };

  const sumarAgua = (ml: number) => {
    addAgua(hoy, ml);
    if (d.aguaMl < metas.aguaMl && d.aguaMl + ml >= metas.aguaMl) setToast("💧 ¡Meta de agua cumplida!");
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{saludo()}, {fechaCorta(hoy, false)}</p>
          <h1 className="font-display text-3xl font-bold">{perfil.nombre} 👋</h1>
        </div>
        <motion.div
          className="flex items-center gap-1.5 rounded-full bg-ember/15 px-3 py-1.5 font-display font-bold text-ember"
          key={nRacha}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          title="Días seguidos con brío"
        >
          🔥 {nRacha}
        </motion.div>
      </header>

      {perfil.motivo && faltaMotivo !== null && faltaMotivo >= 0 && (
        <Tarjeta className="flex items-center justify-between !py-3.5">
          <p className="text-sm"><span className="text-muted">Faltan</span> <b className="font-display text-lg text-lime">{faltaMotivo}</b> <span className="text-muted">días para tu</span> <b>{perfil.motivo.titulo}</b></p>
        </Tarjeta>
      )}

      <Tarjeta delay={0.05}>
        <div className="flex items-center gap-5">
          <Anillo progreso={kcal / metas.kcal} size={140}>
            <div>
              <p className="font-display text-3xl font-extrabold leading-none"><Numero valor={Math.abs(restantes)} /></p>
              <p className="mt-1 text-xs text-muted">{restantes >= 0 ? "kcal restantes" : "kcal de más"}</p>
            </div>
          </Anillo>
          <div className="flex-1 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>🔥 Comido</span><span className="tabular-nums text-muted">{kcal}/{metas.kcal}</span></div>
              <Barra progreso={kcal / metas.kcal} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm"><span>🥩 Proteína</span><span className="tabular-nums text-muted">{prot}/{metas.proteina} g</span></div>
              <Barra progreso={prot / metas.proteina} color="bg-sky-400" />
            </div>
          </div>
        </div>
        {prot < metas.proteina * 0.5 && new Date().getHours() >= 15 && (
          <p className="mt-4 rounded-2xl bg-sky-400/10 px-4 py-2.5 text-sm">💡 Vas bajo en proteína. Una lata de atún te da ~25 g.</p>
        )}
      </Tarjeta>

      <Tarjeta delay={0.1}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Comidas</h2>
          {comidasAyer > 0 && (
            <button
              onClick={() => { const n = copiarDia(ayer, hoy); setToast(`Copiadas ${n} comidas de ayer 📋`); }}
              className="text-sm text-lime hover:underline"
            >
              📋 Copiar ayer
            </button>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {d.comidas.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 overflow-hidden rounded-2xl bg-bg px-3 py-2.5"
              >
                <span className="text-xl">{TIPOS.find((t) => t.id === c.tipo)?.e}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted">{c.kcal} kcal · {c.proteina} g proteína</p>
                </div>
                <button onClick={() => removeComida(hoy, c.id)} className="px-2 text-muted hover:text-ember" aria-label={`Borrar ${c.nombre}`}>✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
          {!d.comidas.length && <p className="py-2 text-sm text-muted">Aún no registras nada hoy.</p>}
        </ul>
        <button onClick={() => setHoja(true)} className={`${btnPrimario} mt-3 w-full`}>+ Registrar comida</button>
      </Tarjeta>

      <Tarjeta delay={0.15}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">💧 Agua</h2>
          <span className="text-sm tabular-nums text-muted">{(d.aguaMl / 1000).toFixed(2)} / {(metas.aguaMl / 1000).toFixed(1)} L</span>
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: Math.round(metas.aguaMl / 250) }, (_, i) => (
            <motion.div
              key={i}
              className="h-8 flex-1 rounded-md"
              animate={{ backgroundColor: (i + 1) * 250 <= d.aguaMl ? "#38bdf8" : "#26292e" }}
              transition={{ delay: i * 0.02 }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => sumarAgua(250)} className={btnSecundario}>+ Vaso</button>
          <button onClick={() => sumarAgua(500)} className={btnSecundario}>+ ½ L</button>
          <button onClick={() => sumarAgua(-250)} className={`${btnSecundario} text-muted`}>− Vaso</button>
        </div>
      </Tarjeta>

      <Tarjeta delay={0.2}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Hábitos</h2>
          <span className={`text-sm ${puntos >= MIN_BRIO ? "text-lime" : "text-muted"}`}>{puntos}/5 {puntos >= MIN_BRIO ? "· día con brío 🔥" : `· ${MIN_BRIO} para tu racha`}</span>
        </div>
        <ul className="mt-3 space-y-2">
          {HABITOS.map((h) => {
            const ok = !!d.habitos[h.id];
            return (
              <li key={h.id}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => marcarHabito(h.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${ok ? "border-lime/50 bg-lime/10" : "border-line bg-bg"}`}
                >
                  <span className="text-xl">{h.e}</span>
                  <span className={`flex-1 ${ok ? "" : "text-ink/90"}`}>{h.t}</span>
                  <motion.span
                    className={`grid h-6 w-6 place-items-center rounded-full border text-sm font-bold ${ok ? "border-lime bg-lime text-bg" : "border-line"}`}
                    animate={ok ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                  >
                    {ok ? "✓" : ""}
                  </motion.span>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </Tarjeta>

      <Hoja abierta={hoja} onClose={() => setHoja(false)} titulo="Registrar comida">
        {recientes.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm text-muted">Recientes · un toque y listo</p>
            <div className="flex flex-wrap gap-2">
              {recientes.map((r) => (
                <button
                  key={r.nombre}
                  onClick={() => { addComida(hoy, { ...r, tipo: tipoPorHora() }); setHoja(false); setToast(`${r.nombre} ✅`); }}
                  className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm hover:border-lime"
                >
                  {r.nombre} <span className="text-muted">· {r.kcal}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          <div className="grid grid-cols-4 gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tipo: t.id }))}
                className={`rounded-xl border py-2 text-xs transition ${form.tipo === t.id ? "border-lime bg-lime/10" : "border-line"}`}
              >
                <span className="block text-lg">{t.e}</span>{t.t}
              </button>
            ))}
          </div>
          <input className={inputCls} placeholder="¿Qué comiste? Ej. 3 huevos a la mexicana" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} maxLength={60} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} inputMode="numeric" placeholder="kcal" value={form.kcal} onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value.replace(/\D/g, "") }))} />
            <input className={inputCls} inputMode="numeric" placeholder="Proteína (g)" value={form.proteina} onChange={(e) => setForm((f) => ({ ...f, proteina: e.target.value.replace(/\D/g, "") }))} />
          </div>
          <p className="text-xs text-muted">Pronto: escribe "2 tacos de bistec" y Brío calcula solo las kcal.</p>
          <button type="submit" disabled={!form.nombre.trim() || !form.kcal} className={`${btnPrimario} w-full`}>Guardar</button>
        </form>
      </Hoja>

      <Toast texto={toast} />
    </div>
  );
}
