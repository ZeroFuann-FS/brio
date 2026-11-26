import { useState } from "react";
import { escalarIngrediente, pasoAjuste } from "../lib/porciones";
import { ALIMENTOS, buscarLocal } from "../data/alimentos";
import { fotoDe, fotoReceta } from "../data/fotos";
import { equivalentesDe } from "../data/equivalentes";
import { EXTRA, aplicarAjustes, extrasDe, gramosAlAgregar, pasoExtra, topeExtra, resumenAjustes, costo, etiquetas, gramosIng, llevaCarneFresca, necesitaRefri, nutricion, type Receta, type TipoReceta } from "../data/recetas";
import { hoyISO } from "../lib/calc";
import { coincidenciaDespensa, useBrio, type Ajustes, type TipoComida } from "../lib/store";
import { tipoPorHora } from "./ComidasDia";
import { btnPrimario, inputCls } from "./ui";

const SIN_FAVORITAS: string[] = [];
/** Pasos que en realidad son consejos ("Tip: …", "Importante: …"): van aparte, sin número. */
const esTip = (p: string) => /^(Tip|Importante|Ojo):/.test(p);

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

/** Fotos de los ingredientes principales. */
export function fotosReceta(r: Receta, max = 4): string[] {
  return r.ing.map(([id]) => (id ? fotoDe(id) : undefined)).filter((x): x is string => !!x).slice(0, max);
}

/** Portada de la receta: foto del platillo o, si no hay, mosaico de ingredientes. */
export function PortadaReceta({ r, className = "" }: { r: Receta; className?: string }) {
  const f = fotoReceta(r.id);
  if (f) return <img src={f} alt={r.nombre} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className={`h-full w-full object-cover ${className}`} />;
  const ing = fotosReceta(r, 4);
  return (
    <div className={`grid h-full w-full grid-cols-2 gap-1 bg-white p-2 ${className}`}>
      {ing.map((x) => <img key={x} src={x} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="h-full w-full object-contain" />)}
    </div>
  );
}

export function MiniReceta({ r, size = 48 }: { r: Receta; size?: number }) {
  return (
    <span className="block shrink-0 overflow-hidden rounded-[12px] border border-line bg-white" style={{ width: size, height: size }}>
      <PortadaReceta r={r} />
    </span>
  );
}

/** Registra la receta en el día y descuenta de la despensa lo que coincida. */
export function useRegistrarReceta() {
  const { addComida, descontar } = useBrio();
  return (r: Receta, factor: number, tipo?: TipoComida, nota?: string) => {
    const n = nutricion(r, factor);
    const t: TipoComida = tipo ?? (r.tipos.includes(tipoPorHora() as TipoReceta) ? tipoPorHora() : (r.tipos[0] === "colacion" ? "snack" : r.tipos[0] as TipoComida));
    addComida(hoyISO(), { nombre: nota ? `${r.nombre} (${nota.toLowerCase()})`.slice(0, 80) : r.nombre, kcal: n.kcal, proteina: n.proteina, carbos: n.carbos, grasa: n.grasa, tipo: t, eq: equivalentesDe(r.ing.map((ing) => [ing[0], gramosIng(ing, factor)])) });
    const despensa = useBrio.getState().despensa;
    let descontados = 0;
    for (const ing of r.ing) {
      const a = POR_ID.get(ing[0]);
      if (!a || !ing[1]) continue;
      const gramos = gramosIng(ing, factor);
      const m = coincidenciaDespensa(despensa, a.n, a.por[0].t, gramos / a.por[0].g, gramos);
      if (m) { descontar(m.item.id, Math.round(m.cuanto * 10) / 10); descontados++; }
    }
    return descontados;
  };
}

export default function RecetaDetalle({ r: base, factorInicial = 1, ajustesIniciales, onAjustes, onRegistrado }: {
  r: Receta; factorInicial?: number;
  /** Ajustes por ingrediente guardados (desde el menú) y cómo guardarlos. */
  ajustesIniciales?: Ajustes; onAjustes?: (a: Ajustes | undefined) => void;
  onRegistrado?: (msg: string) => void;
}) {
  const [factor, setFactor] = useState(factorInicial);
  const [ajustes, setAjustesRaw] = useState<Ajustes>(ajustesIniciales ?? {});
  const setAjustes = (a: Ajustes) => {
    const limpio = Object.fromEntries(Object.entries(a).filter(([k, m]) => (k.startsWith(EXTRA) ? m > 0 : m !== 1)));
    setAjustesRaw(limpio);
    onAjustes?.(Object.keys(limpio).length ? limpio : undefined);
  };
  const mover = (i: number, dir: 1 | -1) => {
    const actual = ajustes[i] ?? 1;
    if (actual === 0) { if (dir === 1) setAjustes({ ...ajustes, [i]: 1 }); return; } // ↺ lo regresa completo
    const [, g, t] = base.ing[i];
    setAjustes({ ...ajustes, [i]: pasoAjuste(g, t, actual, factor, dir) }); // de una pieza / ½ taza / 25 g a la vez
  };
  /** Gramos de un extra (0 lo quita), con su tope. */
  const ponerExtra = (id: string, g: number) => setAjustes({ ...ajustes, [EXTRA + id]: Math.min(topeExtra(id), Math.max(0, Math.round(g * 10) / 10)) });
  /** Extras: piezas de una en una; lo demás de 10 g (o 5 g). Bajar de ahí lo quita. */
  const moverExtra = (id: string, dir: 1 | -1) => {
    const paso = pasoExtra(id);
    const actual = ajustes[EXTRA + id] ?? 0;
    // de 33 g con − va a 30, no a 23: se alinea al paso
    const g = dir === 1 ? Math.floor(actual / paso + 1e-6) * paso + paso : Math.ceil(actual / paso - 1e-6) * paso - paso;
    ponerExtra(id, g);
  };
  const [agregando, setAgregando] = useState(false);
  const [q, setQ] = useState("");
  const resultados = q.trim().length >= 2 ? buscarLocal(q, 6).filter((a) => !a.ing) : [];
  const agregar = (id: string) => { ponerExtra(id, (ajustes[EXTRA + id] ?? 0) + gramosAlAgregar(id)); setQ(""); setAgregando(false); };
  const extras = extrasDe(ajustes).filter(([id]) => POR_ID.has(id));
  const ajustada = Object.keys(ajustes).length > 0;
  const r = aplicarAjustes(base, ajustes, factor);
  const registrar = useRegistrarReceta();
  const favoritas = useBrio((s) => s.perfil?.prefsComida?.favoritas) ?? SIN_FAVORITAS;
  const perfil = useBrio((s) => s.perfil);
  const setPrefs = useBrio((s) => s.setPrefsComida);
  const n = nutricion(r, factor);
  const fav = favoritas.includes(r.id);

  const alternarFav = () => {
    const p = perfil?.prefsComida ?? { presupuesto: 500, comidas: ["desayuno", "comida", "cena"], equipo: ["Estufa"], preferencias: "" };
    const f = p.favoritas ?? [];
    setPrefs({ ...p, favoritas: fav ? f.filter((x) => x !== r.id) : [...f, r.id] });
  };

  return (
    <div className="md:grid md:grid-cols-[1fr_1.05fr] md:gap-7">
      {/* Columna 1: foto, datos y acción */}
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-line bg-white">
          <PortadaReceta r={r} />
          <button onClick={alternarFav} aria-pressed={fav} aria-label={fav ? "Quitar de favoritas" : "Agregar a favoritas"}
            className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border text-lg shadow-sm backdrop-blur ${fav ? "border-lime bg-lime text-on-lime" : "border-white/60 bg-white/90 text-[#151515]"}`}>
            {fav ? "♥" : "♡"}
          </button>
        </div>
        <p className="lab mt-4">{r.tipos.map((t) => (t === "colacion" ? "colación" : t)).join(" · ")} · {r.min} min · ~${costo(r, factor)}</p>
        <h3 className="mt-1 font-serif text-2xl font-medium leading-tight md:text-3xl">{r.nombre}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {etiquetas(r).map((e) => <span key={e} className="rounded-full bg-t-habit px-2.5 py-0.5 text-xs">{e}</span>)}
          {(necesitaRefri(r) || llevaCarneFresca(r)) && <span className="rounded-full bg-t-water px-2.5 py-0.5 text-xs">Sin refri: compra {necesitaRefri(r) ? "los lácteos" : "la carne"} el mismo día</span>}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-[14px] border border-line bg-surface p-3">
          {[["kcal", n.kcal], ["Prot", n.proteina], ["Carb", n.carbos], ["Grasa", n.grasa]].map(([l, v]) => (
            <div key={l as string}><p className="lab">{l}</p><p className="num text-2xl">{v}</p></div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="lab">Porción</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setFactor((f) => Math.max(0.5, Math.round((f - 0.1) * 10) / 10))} aria-label="Menos" className="grid h-9 w-9 place-items-center rounded-[10px] border border-line">−</button>
            <span className="num w-14 text-center text-xl">×{factor.toFixed(1)}</span>
            <button onClick={() => setFactor((f) => Math.min(3, Math.round((f + 0.1) * 10) / 10))} aria-label="Más" className="grid h-9 w-9 place-items-center rounded-[10px] border border-line">+</button>
          </div>
        </div>

        <button onClick={() => { const d = registrar(r, factor, undefined, resumenAjustes(base, ajustes)); onRegistrado?.(d ? "Registrado y descontado de tu despensa" : "Registrado en tus comidas de hoy"); }}
          className={`${btnPrimario} mt-4 hidden w-full md:block`}>
          Registrar hoy
        </button>
      </div>

      {/* Columna 2: ingredientes y pasos */}
      <div>
        <div className="mb-1 mt-5 flex items-baseline justify-between gap-2 md:mt-0">
          <p className="lab">Ingredientes{factor !== 1 ? ` · para tu porción ×${factor.toFixed(1)}` : ""}</p>
          {ajustada && <button onClick={() => setAjustes({})} className="lab shrink-0 whitespace-nowrap !text-lime-ink hover:underline">Deshacer</button>}
        </div>
        <p className="mb-1 text-xs text-muted">¿No usaste algo, le pusiste más o le agregaste otra cosa? Ajústalo con − y + (de una pieza, ½ taza o unos gramos a la vez) o agrégalo abajo, y las calorías se recalculan{onAjustes ? "; se queda guardado en esta comida de tu menú" : ""}.</p>
        <ul>
          {base.ing.map(([id, g, t], i) => {
            const f = id ? fotoDe(id) : undefined;
            const m = ajustes[i] ?? 1;
            const quitado = m === 0;
            const [, gAj, tAj] = r.ing[i];
            const esc = quitado ? escalarIngrediente(g, t, factor) : escalarIngrediente(gAj, tAj, factor);
            return (
              <li key={i} className="flex items-center gap-3 border-b border-line py-2 text-sm last:border-b-0">
                {f ? <img src={f} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className={`h-9 w-9 shrink-0 rounded-[8px] bg-white object-cover ${quitado ? "opacity-40 grayscale" : ""}`} /> : <span className="h-9 w-9 shrink-0" />}
                <span className={`min-w-0 flex-1 ${quitado ? "text-muted line-through" : ""}`}>
                  {esc.t}
                  {m !== 1 && <span className={`ml-1.5 rounded-full px-1.5 py-px text-[11px] font-medium no-underline ${quitado ? "bg-ember/15 text-ember" : "bg-lime/30 text-ink"}`}>{quitado ? "quitado" : m < 1 ? "menos" : m === 2 ? "doble" : "más"}</span>}
                </span>
                {g > 0 && (
                  <span className="flex shrink-0 items-center gap-1">
                    <span className={`num w-12 text-right text-muted ${quitado ? "line-through" : ""}`}>{quitado ? Math.round(escalarIngrediente(g, t, factor).g) : Math.round(esc.g)} g</span>
                    <button onClick={() => mover(i, -1)} disabled={quitado} aria-label={`Menos ${esc.t}`} className="grid h-8 w-8 place-items-center rounded-[9px] border border-line text-base disabled:opacity-30">−</button>
                    <button onClick={() => mover(i, 1)} disabled={m >= 3} aria-label={quitado ? `Volver a poner ${t}` : `Más ${esc.t}`} className="grid h-8 w-8 place-items-center rounded-[9px] border border-line text-base disabled:opacity-30">{quitado ? "↺" : "+"}</button>
                  </span>
                )}
              </li>
            );
          })}
          {extras.map(([id], j) => {
            const [, g, t] = r.ing[base.ing.length + j];
            const esc = escalarIngrediente(g, t, factor);
            const f = fotoDe(id);
            return (
              <li key={EXTRA + id} className="flex items-center gap-3 border-b border-line py-2 text-sm last:border-b-0">
                {f ? <img src={f} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} className="h-9 w-9 shrink-0 rounded-[8px] bg-white object-cover" /> : <span className="h-9 w-9 shrink-0" />}
                <span className="min-w-0 flex-1">
                  {esc.t}
                  <span className="ml-1.5 rounded-full bg-lime/30 px-1.5 py-px text-[11px] font-medium text-ink">extra</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <label className="flex items-center gap-0.5 text-muted">
                    <input type="number" inputMode="numeric" min={0} value={Math.round(esc.g)} aria-label={`Gramos de ${esc.t}`}
                      onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v > 0) ponerExtra(id, v); }}
                      className="num w-12 rounded-[8px] border border-line bg-transparent px-1 py-0.5 text-right" />
                    <span className="num">g</span>
                  </label>
                  <button onClick={() => moverExtra(id, -1)} aria-label={`Menos ${esc.t}`} className="grid h-8 w-8 place-items-center rounded-[9px] border border-line text-base">−</button>
                  <button onClick={() => moverExtra(id, 1)} disabled={(ajustes[EXTRA + id] ?? 0) >= topeExtra(id)} aria-label={`Más ${esc.t}`} className="grid h-8 w-8 place-items-center rounded-[9px] border border-line text-base disabled:opacity-30">+</button>
                </span>
              </li>
            );
          })}
        </ul>
        {agregando ? (
          <div className="mt-2">
            <input className={`${inputCls} h-10 text-sm`} placeholder="Ej. queso, aguacate, huevo, frijoles…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <ul className="mt-1">
              {resultados.map((a) => (
                <li key={a.id}>
                  <button onClick={() => agregar(a.id)} className="flex w-full justify-between gap-2 border-b border-line py-2 text-left text-sm last:border-b-0">
                    <span className="truncate">{a.n}</span><span className="num shrink-0 text-muted">{a.por[0].t}</span>
                  </button>
                </li>
              ))}
              {q.trim().length >= 2 && !resultados.length && <li className="py-2 text-xs text-muted">No lo encontré. Prueba con otra palabra.</li>}
            </ul>
            <button onClick={() => { setAgregando(false); setQ(""); }} className="lab mt-2 hover:text-ink">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setAgregando(true)} className="lab mt-2 !text-lime-ink hover:underline">+ Agregar ingrediente</button>
        )}

        <p className="lab mb-2 mt-5">Preparación</p>
        <ol className="space-y-2.5">
          {r.pasos.filter((p) => !esTip(p)).map((p, i) => (
            <li key={i} className="grid grid-cols-[26px_1fr] gap-2 text-sm leading-relaxed">
              <span className="num grid h-[26px] w-[26px] place-items-center rounded-full bg-t-food text-[15px]">{i + 1}</span>
              <span className="pt-0.5">{p}</span>
            </li>
          ))}
        </ol>
        {r.pasos.some(esTip) && (
          <div className="mt-4 space-y-1.5 rounded-[14px] border border-lime/50 bg-lime/10 p-3 text-sm leading-relaxed">
            {r.pasos.filter(esTip).map((p, i) => {
              const [, titulo, resto] = p.match(/^(Tip|Importante|Ojo):\s*(.*)$/) ?? [];
              return <p key={i}><b className={titulo === "Tip" ? "text-lime-ink" : "text-ember"}>{titulo}:</b> {resto}</p>;
            })}
          </div>
        )}

        <button onClick={() => { const d = registrar(r, factor, undefined, resumenAjustes(base, ajustes)); onRegistrado?.(d ? "Registrado y descontado de tu despensa" : "Registrado en tus comidas de hoy"); }}
          className={`${btnPrimario} mt-6 w-full md:hidden`}>
          Registrar hoy
        </button>
      </div>
    </div>
  );
}
