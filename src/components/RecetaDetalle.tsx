import { useState } from "react";
import { ALIMENTOS } from "../data/alimentos";
import { fotoDe } from "../data/fotos";
import { costo, etiquetas, necesitaRefri, nutricion, type Receta, type TipoReceta } from "../data/recetas";
import { hoyISO } from "../lib/calc";
import { coincidenciaDespensa, useBrio, type TipoComida } from "../lib/store";
import { tipoPorHora } from "./ComidasDia";
import { btnPrimario } from "./ui";

const SIN_FAVORITAS: string[] = [];

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

/** Fotos de los ingredientes principales (para tarjetas y encabezados). */
export function fotosReceta(r: Receta, max = 4): string[] {
  return r.ing.map(([id]) => (id ? fotoDe(id) : undefined)).filter((x): x is string => !!x).slice(0, max);
}

export function MiniReceta({ r, size = 48 }: { r: Receta; size?: number }) {
  const f = fotosReceta(r, 1)[0];
  return f
    ? <img src={f} alt="" loading="lazy" className="shrink-0 rounded-[12px] border border-line bg-white object-contain p-1" style={{ width: size, height: size }} />
    : <span className="num grid shrink-0 place-items-center rounded-[12px] bg-t-food text-lg" style={{ width: size, height: size }}>{r.nombre.charAt(0)}</span>;
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
  const fotos = fotosReceta(r);

  const alternarFav = () => {
    const p = perfil?.prefsComida ?? { presupuesto: 500, comidas: ["Desayuno", "Comida", "Cena"], equipo: ["Estufa"], preferencias: "" };
    const f = p.favoritas ?? [];
    setPrefs({ ...p, favoritas: fav ? f.filter((x) => x !== r.id) : [...f, r.id] });
  };

  return (
    <div>
      {fotos.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-2 rounded-[16px] border border-line bg-white p-3">
          {fotos.map((f) => <img key={f} src={f} alt="" className="aspect-square w-full object-contain" />)}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="lab">{r.tipos.map((t) => (t === "colacion" ? "colación" : t)).join(" · ")} · {r.min} min · ~${costo(r, factor)}</p>
          <h3 className="mt-1 font-serif text-2xl font-medium leading-tight">{r.nombre}</h3>
        </div>
        <button onClick={alternarFav} aria-pressed={fav} aria-label={fav ? "Quitar de favoritas" : "Agregar a favoritas"}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-lg ${fav ? "border-lime bg-lime text-on-lime" : "border-line text-muted"}`}>
          {fav ? "♥" : "♡"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {etiquetas(r).map((e) => <span key={e} className="rounded-full bg-t-habit px-2.5 py-0.5 text-xs">{e}</span>)}
        {necesitaRefri(r) && <span className="rounded-full bg-t-water px-2.5 py-0.5 text-xs">Compra lo perecedero el mismo día si no tienes refri</span>}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-[14px] border border-line bg-surface p-3">
        {[["kcal", n.kcal], ["Prot", n.proteina], ["Carb", n.carbos], ["Grasa", n.grasa]].map(([l, v]) => (
          <div key={l as string}><p className="lab">{l}</p><p className="num text-2xl">{v}</p></div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="lab">Porción</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setFactor((f) => Math.max(0.5, Math.round((f - 0.1) * 10) / 10))} className="grid h-9 w-9 place-items-center rounded-[10px] border border-line">−</button>
          <span className="num w-14 text-center text-xl">×{factor.toFixed(1)}</span>
          <button onClick={() => setFactor((f) => Math.min(3, Math.round((f + 0.1) * 10) / 10))} className="grid h-9 w-9 place-items-center rounded-[10px] border border-line">+</button>
        </div>
      </div>

      <p className="lab mb-1 mt-4">Ingredientes</p>
      <ul>
        {r.ing.map(([id, g, t], i) => {
          const f = id ? fotoDe(id) : undefined;
          return (
            <li key={i} className="flex items-center gap-3 border-b border-line py-2 text-sm last:border-b-0">
              {f ? <img src={f} alt="" loading="lazy" className="h-8 w-8 shrink-0 object-contain" /> : <span className="h-8 w-8 shrink-0" />}
              <span className="flex-1">{t}</span>
              {g > 0 && <span className="num text-muted">{Math.round(g * factor)} g</span>}
            </li>
          );
        })}
      </ul>

      <p className="lab mb-1 mt-4">Preparación</p>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">{r.pasos.map((p, i) => <li key={i}>{p}</li>)}</ol>

      <button onClick={() => { const d = registrar(r, factor); onRegistrado?.(d ? "Registrado y descontado de tu despensa" : "Registrado en tus comidas de hoy"); }}
        className={`${btnPrimario} mt-5 w-full`}>
        Registrar hoy
      </button>
    </div>
  );
}
