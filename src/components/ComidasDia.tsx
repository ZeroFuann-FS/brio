import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { hoyISO, sumarDias } from "../lib/calc";
import { frecuentes, useBrio, type TipoComida } from "../lib/store";
import { Hoja, Tarjeta, Toast, btnPrimario, inputCls, useToast } from "./ui";

export const TIPOS: { id: TipoComida; t: string }[] = [
  { id: "desayuno", t: "Desayuno" },
  { id: "comida", t: "Comida" },
  { id: "cena", t: "Cena" },
  { id: "snack", t: "Snack" },
];

export function tipoPorHora(): TipoComida {
  const h = new Date().getHours();
  if (h < 11) return "desayuno";
  if (h < 17) return "comida";
  if (h < 22) return "cena";
  return "snack";
}

const soloNum = (v: string) => v.replace(/\D/g, "");

/** Bloque de comidas del día con registro rápido. */
export default function ComidasDia({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  const hoy = hoyISO();
  const ayer = sumarDias(hoy, -1);
  const dias = useBrio((s) => s.dias);
  const { addComida, removeComida, copiarDia } = useBrio();
  const comidas = dias[hoy]?.comidas ?? [];
  const recientes = frecuentes(dias);
  const comidasAyer = dias[ayer]?.comidas.length ?? 0;
  const [toast, setToast] = useToast();
  const [hoja, setHoja] = useState(false);
  const vacio = { nombre: "", kcal: "", proteina: "", carbos: "", grasa: "", tipo: tipoPorHora() };
  const [f, setF] = useState(vacio);

  const guardar = () => {
    const k = Number(f.kcal);
    if (!f.nombre.trim() || !(k > 0)) return;
    addComida(hoy, {
      nombre: f.nombre.trim(), kcal: Math.round(k), proteina: Number(f.proteina || 0), tipo: f.tipo,
      ...(f.carbos ? { carbos: Number(f.carbos) } : {}), ...(f.grasa ? { grasa: Number(f.grasa) } : {}),
    });
    setF({ ...vacio, tipo: tipoPorHora() });
    setHoja(false);
    setToast("Registrado");
  };

  return (
    <>
      <Tarjeta delay={delay} className={className}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Comidas</h2>
          {comidasAyer > 0 && (
            <button onClick={() => { const n = copiarDia(ayer, hoy); setToast(`Copiadas ${n} comidas de ayer`); }} className="lab !text-lime-ink hover:underline">
              Copiar ayer
            </button>
          )}
        </div>
        <ul className="mt-2">
          <AnimatePresence initial={false}>
            {comidas.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="group grid grid-cols-[72px_1fr_auto_auto] items-center gap-2 overflow-hidden border-b border-line py-2.5 last:border-b-0"
              >
                <span className="lab !tracking-[0.08em]">{TIPOS.find((t) => t.id === c.tipo)?.t}</span>
                <span className="min-w-0 truncate">{c.nombre}</span>
                <span className="num text-[17px]">{c.kcal}</span>
                <button onClick={() => removeComida(hoy, c.id)} className="px-1.5 text-muted hover:text-ember" aria-label={`Borrar ${c.nombre}`}>✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
          {!comidas.length && <p className="py-3 text-sm text-muted">Aún no registras nada hoy.</p>}
        </ul>
        <button onClick={() => setHoja(true)} className={`${btnPrimario} mt-3 h-[52px] w-full`}>+ Registrar comida</button>
      </Tarjeta>

      <Hoja abierta={hoja} onClose={() => setHoja(false)} titulo="Registrar comida">
        {recientes.length > 0 && (
          <div className="mb-5">
            <p className="lab mb-2">Recientes · un toque y listo</p>
            <div className="flex flex-wrap gap-2">
              {recientes.map((r) => (
                <button
                  key={r.nombre}
                  onClick={() => { addComida(hoy, { ...r, tipo: tipoPorHora() }); setHoja(false); setToast(`${r.nombre} registrado`); }}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-line-strong"
                >
                  {r.nombre} <span className="num text-muted">· {r.kcal}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          <div className="grid grid-cols-4 gap-1.5">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setF((x) => ({ ...x, tipo: t.id }))}
                className={`h-10 rounded-[12px] border font-display text-sm font-semibold uppercase tracking-wider transition ${f.tipo === t.id ? "border-line-strong bg-surface text-ink dark:border-lime" : "border-line text-muted"}`}
              >
                {t.t}
              </button>
            ))}
          </div>
          <input className={inputCls} placeholder="¿Qué comiste? Ej. 3 huevos a la mexicana" value={f.nombre} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} maxLength={60} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} inputMode="numeric" placeholder="kcal" value={f.kcal} onChange={(e) => setF((x) => ({ ...x, kcal: soloNum(e.target.value) }))} />
            <input className={inputCls} inputMode="numeric" placeholder="Proteína (g)" value={f.proteina} onChange={(e) => setF((x) => ({ ...x, proteina: soloNum(e.target.value) }))} />
            <input className={inputCls} inputMode="numeric" placeholder="Carbos (g) · opcional" value={f.carbos} onChange={(e) => setF((x) => ({ ...x, carbos: soloNum(e.target.value) }))} />
            <input className={inputCls} inputMode="numeric" placeholder="Grasa (g) · opcional" value={f.grasa} onChange={(e) => setF((x) => ({ ...x, grasa: soloNum(e.target.value) }))} />
          </div>
          <p className="text-xs text-muted">Pronto: escribe "2 tacos de bistec" y Brío calcula todo solo.</p>
          <button type="submit" disabled={!f.nombre.trim() || !f.kcal} className={`${btnPrimario} w-full`}>Guardar</button>
        </form>
      </Hoja>
      <Toast texto={toast} />
    </>
  );
}
