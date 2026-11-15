import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { hoyISO, sumarDias } from "../lib/calc";
import { frecuentes, useBrio, type TipoComida } from "../lib/store";
import { analizarComida, ErrorIA, type AnalisisIA } from "../lib/ia";
import { useSync } from "../lib/sync";
import { Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, inputCls, useToast } from "./ui";

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
  const conCuenta = useSync((s) => s.estado) !== "sin-cuenta";
  const [texto, setTexto] = useState("");
  const [ia, setIa] = useState<{ estado: "idle" | "pensando" | "listo" | "error"; r?: AnalisisIA; error?: string }>({ estado: "idle" });

  const calcular = async () => {
    if (!texto.trim()) return;
    setIa({ estado: "pensando" });
    try { setIa({ estado: "listo", r: await analizarComida(texto) }); }
    catch (e) { setIa({ estado: "error", error: e instanceof ErrorIA ? e.message : "Algo salió mal. Intenta de nuevo." }); }
  };

  const totales = (r: AnalisisIA) => r.alimentos.reduce(
    (a, x) => ({ kcal: a.kcal + x.kcal, proteina: a.proteina + x.proteina, carbos: a.carbos + x.carbos, grasa: a.grasa + x.grasa }),
    { kcal: 0, proteina: 0, carbos: 0, grasa: 0 },
  );

  const registrarIA = () => {
    if (!ia.r) return;
    const t = totales(ia.r);
    addComida(hoy, { nombre: ia.r.nombre_comida, kcal: Math.round(t.kcal), proteina: Math.round(t.proteina), carbos: Math.round(t.carbos), grasa: Math.round(t.grasa), tipo: f.tipo });
    setTexto(""); setIa({ estado: "idle" }); setHoja(false); setToast("Registrado");
  };

  const ajustarAMano = () => {
    if (!ia.r) return;
    const t = totales(ia.r);
    setF((x) => ({ ...x, nombre: ia.r!.nombre_comida, kcal: String(Math.round(t.kcal)), proteina: String(Math.round(t.proteina)), carbos: String(Math.round(t.carbos)), grasa: String(Math.round(t.grasa)) }));
    setIa({ estado: "idle" });
  };

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
        {/* Escribir normal: la IA calcula */}
        <div className="mb-5 rounded-[16px] border border-line bg-t-food p-4">
          <p className="lab">Escríbelo como lo dirías</p>
          {conCuenta ? (
            <>
              <textarea
                className={`${inputCls} mt-2 min-h-[76px] resize-none`}
                placeholder="Ej. 4 tacos de bistec con doble tortilla y un refresco chico"
                value={texto}
                maxLength={500}
                onChange={(e) => { setTexto(e.target.value); if (ia.estado !== "pensando") setIa({ estado: "idle" }); }}
              />
              {ia.estado !== "listo" && (
                <button type="button" onClick={calcular} disabled={!texto.trim() || ia.estado === "pensando"} className={`${btnPrimario} mt-2 w-full`}>
                  {ia.estado === "pensando" ? "Calculando…" : "Calcular con IA"}
                </button>
              )}
              {ia.estado === "pensando" && (
                <div className="mt-3 grid grid-cols-12 gap-1">{Array.from({ length: 12 }, (_, i) => (
                  <motion.i key={i} className="block h-1.5 rounded-full bg-ink dark:bg-lime" animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }} />
                ))}</div>
              )}
              {ia.estado === "error" && <p className="mt-2 text-sm text-ember">{ia.error}</p>}
              {ia.estado === "listo" && ia.r && (() => {
                const t = totales(ia.r);
                return (
                  <motion.div className="mt-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="font-serif text-lg font-medium">{ia.r.nombre_comida}</p>
                    <ul className="mt-1">
                      {ia.r.alimentos.map((a, i) => (
                        <li key={i} className="grid grid-cols-[1fr_auto] gap-2 border-b border-line py-2 text-sm last:border-b-0">
                          <span>{a.nombre} <span className="text-muted">· {a.cantidad}</span></span>
                          <span className="num text-base">{Math.round(a.kcal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 grid grid-cols-4 gap-2 border-t border-line-strong pt-2">
                      {[["kcal", t.kcal], ["Prot", t.proteina], ["Carb", t.carbos], ["Grasa", t.grasa]].map(([l, v]) => (
                        <div key={l as string}><p className="lab">{l}</p><p className="num text-xl">{Math.round(v as number)}</p></div>
                      ))}
                    </div>
                    {ia.r.nota && <p className="mt-2 text-xs text-muted">{ia.r.nota}</p>}
                    {ia.r.confianza === "baja" && <p className="mt-1 text-xs text-ember">Estimación con poca información: revisa las cantidades.</p>}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={ajustarAMano} className={btnSecundario}>Ajustar a mano</button>
                      <button type="button" onClick={registrarIA} className={btnPrimario}>Registrar</button>
                    </div>
                  </motion.div>
                );
              })()}
            </>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Crea tu cuenta gratis en Perfil para que Brío calcule las calorías solo con escribir lo que comiste.</p>
          )}
        </div>

        <p className="lab mb-2">O regístralo a mano</p>
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
          <button type="submit" disabled={!f.nombre.trim() || !f.kcal} className={`${btnPrimario} w-full`}>Guardar</button>
        </form>
      </Hoja>
      <Toast texto={toast} />
    </>
  );
}
