import { useState } from "react";
import { ALIMENTOS } from "../data/alimentos";
import { fotoDe, fotoReceta } from "../data/fotos";
import { costo, etiquetas, necesitaRefri, nutricion, type Receta, type TipoReceta } from "../data/recetas";
import { hoyISO } from "../lib/calc";
import { coincidenciaDespensa, useBrio, type TipoComida } from "../lib/store";
import { tipoPorHora } from "./ComidasDia";
import { btnPrimario } from "./ui";

const SIN_FAVORITAS: string[] = [];

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

/** Fotos de los ingredientes principales. */
export function fotosReceta(r: Receta, max = 4): string[] {
  return r.ing.map(([id]) => (id ? fotoDe(id) : undefined)).filter((x): x is string => !!x).slice(0, max);
}

/** Portada de la receta: foto del platillo o, si no hay, mosaico de ingredientes. */
export function PortadaReceta({ r, className = "" }: { r: Receta; className?: string }) {
  const f = fotoReceta(r.id);
  if (f) return <img src={f} alt={r.nombre} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  const ing = fotosReceta(r, 4);
  return (
    <div className={`grid h-full w-full grid-cols-2 gap-1 bg-white p-2 ${className}`}>
      {ing.map((x) => <img key={x} src={x} alt="" loading="lazy" className="h-full w-full object-contain" />)}
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
  return (r: Receta, factor: number, tipo?: TipoComida) => {
    const n = nutricion(r, factor);
    const t: TipoComida = tipo ?? (r.tipos.includes(tipoPorHora() as TipoReceta) ? tipoPorHora() : (r.tipos[0] === "colacion" ? "snack" : r.tipos[0] as TipoComida));
    addComida(hoyISO(), { nombre: r.nombre, kcal: n.kcal, proteina: n.proteina, carbos: n.carbos, grasa: n.grasa, tipo: t });
    const despensa = useBrio.getState().despensa;
    let descontados = 0;
    for (const [id, g] of r.ing) {
      const a = POR_ID.get(id);
      if (!a || !g) continue;
      const gramos = g * factor;
      const m = coincidenciaDespensa(despensa, a.n, a.por[0].t, gramos / a.por[0].g, gramos);
      if (m) { descontar(m.item.id, Math.round(m.cuanto * 10) / 10); descontados++; }
    }
    return descontados;
  };
}

export default function RecetaDetalle({ r, factorInicial = 1, onRegistrado }: { r: Receta; factorInicial?: number; onRegistrado?: (msg: string) => void }) {
  const [factor, setFactor] = useState(factorInicial);
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
          {necesitaRefri(r) && <span className="rounded-full bg-t-water px-2.5 py-0.5 text-xs">Sin refri: compra lo perecedero el mismo día</span>}
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

        <button onClick={() => { const d = registrar(r, factor); onRegistrado?.(d ? "Registrado y descontado de tu despensa" : "Registrado en tus comidas de hoy"); }}
          className={`${btnPrimario} mt-4 hidden w-full md:block`}>
          Registrar hoy
        </button>
      </div>

      {/* Columna 2: ingredientes y pasos */}
      <div>
        <p className="lab mb-1 mt-5 md:mt-0">Ingredientes</p>
        <ul>
          {r.ing.map(([id, g, t], i) => {
            const f = id ? fotoDe(id) : undefined;
            return (
              <li key={i} className="flex items-center gap-3 border-b border-line py-2 text-sm last:border-b-0">
                {f ? <img src={f} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-[8px] bg-white object-cover" /> : <span className="h-9 w-9 shrink-0" />}
                <span className="flex-1">{t}</span>
                {g > 0 && <span className="num text-muted">{Math.round(g * factor)} g</span>}
              </li>
            );
          })}
        </ul>

        <p className="lab mb-2 mt-5">Preparación</p>
        <ol className="space-y-2.5">
          {r.pasos.map((p, i) => (
            <li key={i} className="grid grid-cols-[26px_1fr] gap-2 text-sm leading-relaxed">
              <span className="num grid h-[26px] w-[26px] place-items-center rounded-full bg-t-food text-[15px]">{i + 1}</span>
              <span className="pt-0.5">{p}</span>
            </li>
          ))}
        </ol>

        <button onClick={() => { const d = registrar(r, factor); onRegistrado?.(d ? "Registrado y descontado de tu despensa" : "Registrado en tus comidas de hoy"); }}
          className={`${btnPrimario} mt-6 w-full md:hidden`}>
          Registrar hoy
        </button>
      </div>
    </div>
  );
}
