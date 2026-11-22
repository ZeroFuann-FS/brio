import { useState } from "react";
import { alimentoPorId, buscarLocal, type Alimento, type Porcion } from "../data/alimentos";
import { inputCls } from "./ui";

/** Un ingrediente de un platillo casero: gramos en UNA porción del platillo. */
export interface Ing { a: Alimento; g: number }

/** Intercambios rápidos: la leche por otra marca, el queso por otro, maíz o harina… */
const GRUPOS: string[][] = [
  ["leche-entera", "leche-light", "leche-lala", "leche-lala-light", "leche-lala-proteina", "leche-nutrileche", "leche-nutrileche-light",
    "leche-vaca-blanca", "leche-vaca-blanca-light", "leche-lactilac", "leche-lactilac-light"],
  ["queso-oaxaca", "queso-amarillo", "queso-chihuahua", "queso-panela", "queso-fresco"],
  ["tortilla-maiz", "tortilla-harina"],
  ["jamon-pavo", "jamon-cerdo"],
  ["bolillo", "pan-blanco", "pan-integral"],
  ["platano", "fresas", "papaya", "mamey", "manzana"],
  ["azucar", "miel"],
];
const grupoDe = (id: string) => GRUPOS.find((g) => g.includes(id));

/** Nombre corto para listas: sin paréntesis y en minúscula (las marcas se quedan igual). */
export const nombreCorto = (a: Alimento) => {
  const n = a.n.replace(/\s*\(.*\)\s*$/, "");
  return /^leche-(lala|nutri|vaca|lacti)/.test(a.id) ? n : n.charAt(0).toLowerCase() + n.slice(1);
};

/** Expresa los gramos en la porción del alimento que quede redonda (2 piezas, 1 vaso…); si no, en gramos. */
export function enUnidades(a: Alimento, g: number): { n: number; p: Porcion | null } {
  for (const p of a.por) {
    const n = Math.round((g / p.g) * 2) / 2;
    if (n > 0 && Math.abs(n * p.g - g) <= p.g * 0.04) return { n, p };
  }
  return { n: Math.round(g), p: null };
}

/** "2 pieza" → "2 piezas", "2 porción" → "2 porciones" (solo porciones de una palabra). */
export const plural = (n: number, t: string) => {
  if (n <= 1 || /\s/.test(t)) return t;
  return /[aeiou]$/.test(t) ? `${t}s` : `${t.replace(/ó/g, "o")}es`;
};

const contable = (t: string) => /pieza|rebanada|clara|lata|taco|filete/.test(t);

/** Lista editable de ingredientes: cambiar cantidades, intercambiar, quitar y agregar. */
export default function EditorIngredientes({ ings, original, onChange }: { ings: Ing[]; original: Ing[]; onChange: (i: Ing[]) => void }) {
  const [agregando, setAgregando] = useState(false);
  const [q, setQ] = useState("");
  const editado = ings.length !== original.length || ings.some((x, i) => x.a.id !== original[i]?.a.id || x.g !== original[i]?.g);
  const resultados = q.trim().length >= 2 ? buscarLocal(q, 6).filter((a) => !a.ing) : [];

  const poner = (i: number, x: Ing) => onChange(ings.map((y, j) => (j === i ? x : y)));
  const mover = (i: number, dir: 1 | -1) => {
    const { a, g } = ings[i];
    const u = enUnidades(a, g);
    if (u.p) {
      const paso = contable(u.p.t) ? 1 : 0.5;
      const n = Math.max(paso, u.n + dir * paso);
      poner(i, { a, g: Math.round(n * u.p.g * 10) / 10 });
    } else poner(i, { a, g: Math.max(5, Math.round(g / 5) * 5 + dir * 10) });
  };
  const cambiar = (i: number, id: string) => {
    const nuevo = alimentoPorId(id);
    if (!nuevo) return;
    const { a, g } = ings[i];
    // Misma cantidad de porciones: 2 tortillas de maíz → 2 de harina; 1 vaso de leche → 1 vaso de otra
    const p = nuevo.por[0];
    const paso = contable(p.t) ? 1 : 0.5;
    const n = Math.max(paso, Math.round(g / a.por[0].g / paso) * paso);
    poner(i, { a: nuevo, g: Math.round(n * p.g * 10) / 10 });
  };

  return (
    <div className="rounded-[14px] border border-line bg-surface p-3">
      <div className="flex items-baseline justify-between">
        <p className="lab">¿Qué llevaba? · por porción</p>
        {editado && <button onClick={() => onChange(original)} className="lab hover:text-ink">Restaurar</button>}
      </div>
      <ul className="mt-1">
        {ings.map((x, i) => {
          const u = enUnidades(x.a, x.g);
          const grupo = grupoDe(x.a.id);
          return (
            <li key={`${x.a.id}-${i}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-line py-2 last:border-b-0">
              <div className="min-w-0">
                {grupo ? (
                  <select value={x.a.id} onChange={(e) => cambiar(i, e.target.value)} aria-label={`Cambiar ${x.a.n}`}
                    className="w-full truncate rounded-[8px] border-0 bg-transparent py-0.5 pr-1 text-sm underline decoration-line-strong decoration-dotted underline-offset-4 focus:outline-none">
                    {grupo.map((id) => { const a = alimentoPorId(id); return a ? <option key={id} value={id}>{a.n}</option> : null; })}
                  </select>
                ) : <p className="truncate text-sm">{x.a.n}</p>}
                <p className="lab !tracking-[0.06em]">{u.p ? `${u.n} ${plural(u.n, u.p.t)} · ` : ""}{Math.round(x.g)} g · {Math.round((x.a.kcal * x.g) / 100)} kcal</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => mover(i, -1)} className="grid h-8 w-8 place-items-center rounded-[10px] border border-line" aria-label={`Menos ${x.a.n}`}>−</button>
                <button onClick={() => mover(i, 1)} className="grid h-8 w-8 place-items-center rounded-[10px] border border-line" aria-label={`Más ${x.a.n}`}>+</button>
              </div>
              <button onClick={() => onChange(ings.filter((_, j) => j !== i))} disabled={ings.length === 1}
                className="px-1 text-muted hover:text-ember disabled:opacity-30" aria-label={`Quitar ${x.a.n}`}>✕</button>
            </li>
          );
        })}
      </ul>

      {agregando ? (
        <div className="mt-2">
          <input className={`${inputCls} h-10 text-sm`} placeholder="Ej. queso amarillo, aguacate, miel…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <ul className="mt-1">
            {resultados.map((a) => (
              <li key={a.id}>
                <button onClick={() => { onChange([...ings, { a, g: a.por[0].g }]); setQ(""); setAgregando(false); }}
                  className="flex w-full justify-between gap-2 border-b border-line py-2 text-left text-sm last:border-b-0">
                  <span className="truncate">{a.n}</span><span className="num shrink-0 text-muted">{a.por[0].t}</span>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => { setAgregando(false); setQ(""); }} className="lab mt-2 hover:text-ink">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAgregando(true)} className="lab mt-2 !text-lime-ink hover:underline">+ Agregar ingrediente</button>
      )}
    </div>
  );
}
