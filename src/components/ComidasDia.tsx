import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { hoyISO, sumarDias } from "../lib/calc";
import { coincidenciaDespensa, frecuentes, useBrio, type TipoComida } from "../lib/store";
import { analizarComida, ErrorIA, iaActiva, type AnalisisIA } from "../lib/ia";
import { useSync } from "../lib/sync";
import BuscarAlimento, { calcular as calcularSel, type Seleccion } from "./BuscarAlimento";
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
type Modo = "buscar" | "ia" | "mano";
interface ItemPlato extends Seleccion { id: string }

/** Bloque de comidas del día con registro: buscar alimentos, escribir con IA o a mano. */
export default function ComidasDia({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  const hoy = hoyISO();
  const ayer = sumarDias(hoy, -1);
  const dias = useBrio((s) => s.dias);
  const despensa = useBrio((s) => s.despensa);
  const { addComida, removeComida, copiarDia, descontar } = useBrio();
  const comidas = dias[hoy]?.comidas ?? [];
  const recientes = frecuentes(dias);
  const comidasAyer = dias[ayer]?.comidas.length ?? 0;
  const conCuenta = useSync((s) => s.estado) !== "sin-cuenta";
  const [toast, setToast] = useToast();

  const [hoja, setHoja] = useState(false);
  const [modo, setModo] = useState<Modo>("buscar");
  const [tipo, setTipo] = useState<TipoComida>(tipoPorHora());
  const [plato, setPlato] = useState<ItemPlato[]>([]);
  const [usarDespensa, setUsarDespensa] = useState(true);
  const vacio = { nombre: "", kcal: "", proteina: "", carbos: "", grasa: "" };
  const [f, setF] = useState(vacio);
  const [texto, setTexto] = useState("");
  const [ia, setIa] = useState<{ estado: "idle" | "pensando" | "listo" | "error"; r?: AnalisisIA; error?: string }>({ estado: "idle" });

  const abrir = () => { setTipo(tipoPorHora()); setModo("buscar"); setHoja(true); };
  const cerrar = (msg?: string) => { setHoja(false); setPlato([]); setF(vacio); setTexto(""); setIa({ estado: "idle" }); if (msg) setToast(msg); };

  /* ----- Plato (alimentos buscados) ----- */
  const totPlato = plato.reduce((a, it) => {
    const v = calcularSel(it);
    return { kcal: a.kcal + v.kcal, proteina: a.proteina + v.proteina, carbos: a.carbos + v.carbos, grasa: a.grasa + v.grasa };
  }, { kcal: 0, proteina: 0, carbos: 0, grasa: 0 });
  const descuentos = plato
    .map((it) => coincidenciaDespensa(despensa, it.a.n, it.porcion.t, it.cantidad, calcularSel(it).gramos))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const registrarPlato = () => {
    if (!plato.length) return;
    const nombre = plato.map((it) => it.a.n.split(" · ")[0]).join(", ");
    addComida(hoy, { nombre: nombre.length > 60 ? `${nombre.slice(0, 57)}…` : nombre, kcal: Math.round(totPlato.kcal), proteina: Math.round(totPlato.proteina), carbos: Math.round(totPlato.carbos), grasa: Math.round(totPlato.grasa), tipo });
    if (usarDespensa) for (const d of descuentos) descontar(d.item.id, d.cuanto);
    cerrar(usarDespensa && descuentos.length ? "Registrado y descontado de tu despensa" : "Registrado");
  };

  /* ----- IA ----- */
  const totIA = (r: AnalisisIA) => r.alimentos.reduce(
    (a, x) => ({ kcal: a.kcal + x.kcal, proteina: a.proteina + x.proteina, carbos: a.carbos + x.carbos, grasa: a.grasa + x.grasa }),
    { kcal: 0, proteina: 0, carbos: 0, grasa: 0 },
  );
  const calcularIA = async () => {
    if (!texto.trim()) return;
    setIa({ estado: "pensando" });
    try { setIa({ estado: "listo", r: await analizarComida(texto) }); }
    catch (e) { setIa({ estado: "error", error: e instanceof ErrorIA ? e.message : "Algo salió mal. Intenta de nuevo." }); }
  };

  /* ----- A mano ----- */
  const guardarMano = () => {
    const k = Number(f.kcal);
    if (!f.nombre.trim() || !(k > 0)) return;
    addComida(hoy, {
      nombre: f.nombre.trim(), kcal: Math.round(k), proteina: Number(f.proteina || 0), tipo,
      ...(f.carbos ? { carbos: Number(f.carbos) } : {}), ...(f.grasa ? { grasa: Number(f.grasa) } : {}),
    });
    cerrar("Registrado");
  };

  const MODOS: { id: Modo; t: string }[] = [
    { id: "buscar", t: "Buscar" },
    ...(iaActiva ? [{ id: "ia" as Modo, t: "Con IA" }] : []),
    { id: "mano", t: "A mano" },
  ];

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
              <motion.li key={c.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-[72px_1fr_auto_auto] items-center gap-2 overflow-hidden border-b border-line py-2.5 last:border-b-0">
                <span className="lab !tracking-[0.08em]">{TIPOS.find((t) => t.id === c.tipo)?.t}</span>
                <span className="min-w-0 truncate">{c.nombre}</span>
                <span className="num text-[17px]">{c.kcal}</span>
                <button onClick={() => removeComida(hoy, c.id)} className="px-1.5 text-muted hover:text-ember" aria-label={`Borrar ${c.nombre}`}>✕</button>
              </motion.li>
            ))}
          </AnimatePresence>
          {!comidas.length && <p className="py-3 text-sm text-muted">Aún no registras nada hoy.</p>}
        </ul>
        <button onClick={abrir} className={`${btnPrimario} mt-3 h-[52px] w-full`}>+ Registrar comida</button>
      </Tarjeta>

      <Hoja abierta={hoja} onClose={() => cerrar()} titulo="Registrar comida">
        {/* Tipo de comida */}
        <div className="grid grid-cols-4 gap-1.5">
          {TIPOS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTipo(t.id)}
              className={`h-10 rounded-[12px] border font-display text-sm font-semibold uppercase tracking-wider transition ${tipo === t.id ? "border-line-strong bg-surface text-ink dark:border-lime" : "border-line text-muted"}`}>
              {t.t}
            </button>
          ))}
        </div>

        {/* Recientes */}
        {recientes.length > 0 && !plato.length && (
          <div className="mt-4">
            <p className="lab mb-2">Recientes · un toque y listo</p>
            <div className="flex flex-wrap gap-2">
              {recientes.map((r) => (
                <button key={r.nombre} onClick={() => { addComida(hoy, { ...r, tipo }); cerrar(`${r.nombre} registrado`); }}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-line-strong">
                  {r.nombre} <span className="num text-muted">· {r.kcal}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modos */}
        <div className="mt-4 grid gap-1 rounded-[14px] border border-line bg-surface p-1" style={{ gridTemplateColumns: `repeat(${MODOS.length}, 1fr)` }}>
          {MODOS.map((m) => (
            <button key={m.id} onClick={() => setModo(m.id)} aria-pressed={modo === m.id}
              className={`h-9 rounded-[10px] font-display text-sm font-semibold uppercase tracking-[0.08em] transition ${modo === m.id ? "bg-ink text-bg dark:bg-lime dark:text-on-lime" : "text-muted"}`}>
              {m.t}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {modo === "buscar" && (
            <>
              {plato.length > 0 && (
                <div className="mb-4 rounded-[16px] border border-line bg-t-food p-3.5">
                  <p className="lab">Tu plato</p>
                  <ul className="mt-1">
                    {plato.map((it) => (
                      <li key={it.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-line py-2 text-sm last:border-b-0">
                        <span className="min-w-0 truncate">{it.a.n.split(" · ")[0]} <span className="text-muted">· {it.cantidad} {it.porcion.t === "gramos" ? "g" : it.porcion.t}</span></span>
                        <span className="num text-base">{Math.round(calcularSel(it).kcal)}</span>
                        <button onClick={() => setPlato((p) => p.filter((x) => x.id !== it.id))} className="px-1 text-muted hover:text-ember" aria-label="Quitar">✕</button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 grid grid-cols-4 gap-2 border-t border-line-strong pt-2">
                    {[["kcal", totPlato.kcal], ["Prot", totPlato.proteina], ["Carb", totPlato.carbos], ["Grasa", totPlato.grasa]].map(([l, v]) => (
                      <div key={l as string}><p className="lab">{l}</p><p className="num text-xl">{Math.round(v as number)}</p></div>
                    ))}
                  </div>
                  {descuentos.length > 0 && (
                    <label className="mt-3 flex items-start gap-2.5 text-sm">
                      <input type="checkbox" checked={usarDespensa} onChange={(e) => setUsarDespensa(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--lime)]" />
                      <span>Descontar de mi despensa: {descuentos.map((d) => `${d.cuanto} ${d.item.unidad} de ${d.item.nombre.toLowerCase()}`).join(", ")}</span>
                    </label>
                  )}
                  <button onClick={registrarPlato} className={`${btnPrimario} mt-3 w-full`}>Registrar plato</button>
                </div>
              )}
              <BuscarAlimento onAgregar={(s) => setPlato((p) => [...p, { ...s, id: Math.random().toString(36).slice(2, 9) }])} />
              <p className="mt-4 text-[11px] leading-relaxed text-muted">Base genérica con valores de referencia de USDA FoodData Central (dominio público). Productos de marca de Open Food Facts (ODbL).</p>
            </>
          )}

          {modo === "ia" && (
            conCuenta ? (
              <div>
                <textarea className={`${inputCls} min-h-[84px] resize-none`} placeholder="Ej. 4 tacos de bistec con doble tortilla y un refresco chico" value={texto} maxLength={500}
                  onChange={(e) => { setTexto(e.target.value); if (ia.estado !== "pensando") setIa({ estado: "idle" }); }} />
                {ia.estado !== "listo" && (
                  <button type="button" onClick={calcularIA} disabled={!texto.trim() || ia.estado === "pensando"} className={`${btnPrimario} mt-2 w-full`}>
                    {ia.estado === "pensando" ? "Calculando…" : "Calcular con IA"}
                  </button>
                )}
                {ia.estado === "error" && <p className="mt-2 text-sm text-ember">{ia.error}</p>}
                {ia.estado === "listo" && ia.r && (() => {
                  const t = totIA(ia.r);
                  return (
                    <motion.div className="mt-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="font-serif text-lg font-medium">{ia.r.nombre_comida}</p>
                      <ul className="mt-1">{ia.r.alimentos.map((a, i) => (
                        <li key={i} className="grid grid-cols-[1fr_auto] gap-2 border-b border-line py-2 text-sm last:border-b-0">
                          <span>{a.nombre} <span className="text-muted">· {a.cantidad}</span></span><span className="num text-base">{Math.round(a.kcal)}</span>
                        </li>
                      ))}</ul>
                      <div className="mt-2 grid grid-cols-4 gap-2 border-t border-line-strong pt-2">
                        {[["kcal", t.kcal], ["Prot", t.proteina], ["Carb", t.carbos], ["Grasa", t.grasa]].map(([l, v]) => (
                          <div key={l as string}><p className="lab">{l}</p><p className="num text-xl">{Math.round(v as number)}</p></div>
                        ))}
                      </div>
                      {ia.r.nota && <p className="mt-2 text-xs text-muted">{ia.r.nota}</p>}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" className={btnSecundario}
                          onClick={() => { setF({ nombre: ia.r!.nombre_comida, kcal: String(Math.round(t.kcal)), proteina: String(Math.round(t.proteina)), carbos: String(Math.round(t.carbos)), grasa: String(Math.round(t.grasa)) }); setModo("mano"); }}>
                          Ajustar a mano
                        </button>
                        <button type="button" className={btnPrimario}
                          onClick={() => { addComida(hoy, { nombre: ia.r!.nombre_comida, kcal: Math.round(t.kcal), proteina: Math.round(t.proteina), carbos: Math.round(t.carbos), grasa: Math.round(t.grasa), tipo }); cerrar("Registrado"); }}>
                          Registrar
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            ) : <p className="text-sm text-muted">Crea tu cuenta gratis en Perfil para usar la IA.</p>
          )}

          {modo === "mano" && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardarMano(); }}>
              <input className={inputCls} placeholder="¿Qué comiste? Ej. 3 huevos a la mexicana" value={f.nombre} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} maxLength={60} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} inputMode="numeric" placeholder="kcal" value={f.kcal} onChange={(e) => setF((x) => ({ ...x, kcal: soloNum(e.target.value) }))} />
                <input className={inputCls} inputMode="numeric" placeholder="Proteína (g)" value={f.proteina} onChange={(e) => setF((x) => ({ ...x, proteina: soloNum(e.target.value) }))} />
                <input className={inputCls} inputMode="numeric" placeholder="Carbos (g) · opcional" value={f.carbos} onChange={(e) => setF((x) => ({ ...x, carbos: soloNum(e.target.value) }))} />
                <input className={inputCls} inputMode="numeric" placeholder="Grasa (g) · opcional" value={f.grasa} onChange={(e) => setF((x) => ({ ...x, grasa: soloNum(e.target.value) }))} />
              </div>
              <button type="submit" disabled={!f.nombre.trim() || !f.kcal} className={`${btnPrimario} w-full`}>Guardar</button>
            </form>
          )}
        </div>
      </Hoja>
      <Toast texto={toast} />
    </>
  );
}
