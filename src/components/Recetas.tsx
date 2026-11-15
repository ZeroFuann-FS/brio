import { useMemo, useState } from "react";
import { RECETAS, TIPOS_RECETA, costo, etiquetas, nutricion, type Receta, type TipoReceta } from "../data/recetas";
import { enDespensa } from "../lib/menu";
import { useBrio } from "../lib/store";
import RecetaDetalle, { MiniReceta } from "./RecetaDetalle";
import { Hoja, Tarjeta, Toast, inputCls, useToast } from "./ui";

const SIN_FAVORITAS: string[] = [];

type Filtro = TipoReceta | "favoritas" | "proteina" | "economica" | "rapida" | "despensa" | "sinrefri";
const FILTROS: { id: Filtro; t: string }[] = [
  ...TIPOS_RECETA.map((x) => ({ id: x.id as Filtro, t: x.t })),
  { id: "despensa", t: "Con mi despensa" }, { id: "favoritas", t: "Favoritas" }, { id: "proteina", t: "Alta en proteína" },
  { id: "economica", t: "Económicas" }, { id: "rapida", t: "Rápidas" }, { id: "sinrefri", t: "Sin refri" },
];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Recetas() {
  const despensa = useBrio((s) => s.despensa);
  const favoritas = useBrio((s) => s.perfil?.prefsComida?.favoritas) ?? SIN_FAVORITAS;
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<Receta | null>(null);
  const [verTodas, setVerTodas] = useState(false);
  const [toast, setToast] = useToast();

  const lista = useMemo(() => {
    const deDespensa = (r: Receta) => r.ing.filter(([id]) => id && enDespensa(despensa, id)).length;
    return RECETAS.filter((r) => {
      if (q.trim() && !norm(r.nombre).includes(norm(q.trim()))) return false;
      return filtros.every((f) => {
        if (f === "favoritas") return favoritas.includes(r.id);
        if (f === "despensa") return deDespensa(r) >= 2;
        const e = etiquetas(r);
        if (f === "proteina") return e.includes("Alta en proteína");
        if (f === "economica") return e.includes("Económica");
        if (f === "rapida") return e.includes("Rápida");
        if (f === "sinrefri") return e.includes("Sin refri");
        return r.tipos.includes(f);
      });
    }).sort((a, b) => (filtros.includes("despensa") ? deDespensa(b) - deDespensa(a) : 0));
  }, [q, filtros, despensa, favoritas]);

  const visibles = verTodas || q || filtros.length ? lista : lista.slice(0, 6);
  const toggle = (f: Filtro) => setFiltros((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  return (
    <>
      <Tarjeta delay={0.08}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-medium">Recetas</h2>
          <span className="lab">{lista.length} recetas</span>
        </div>
        <input className={`${inputCls} mt-3`} placeholder="Busca una receta: tinga, avena, atún…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTROS.map((f) => (
            <button key={f.id} onClick={() => toggle(f.id)} aria-pressed={filtros.includes(f.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${filtros.includes(f.id) ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>
              {f.t}
            </button>
          ))}
        </div>
        <ul className="mt-2">
          {visibles.map((r) => {
            const n = nutricion(r);
            return (
              <li key={r.id} className="border-b border-line last:border-b-0">
                <button onClick={() => setAbierta(r)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <MiniReceta r={r} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{favoritas.includes(r.id) ? "♥ " : ""}{r.nombre}</span>
                    <span className="lab !tracking-[0.06em]">{n.kcal} kcal · {n.proteina} g prot · {r.min} min · ~${costo(r)}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {!lista.length && <p className="py-3 text-sm text-muted">Ninguna receta con esos filtros.</p>}
        </ul>
        {!verTodas && !q && !filtros.length && lista.length > 6 && (
          <button onClick={() => setVerTodas(true)} className="lab mt-2 w-full py-2 !text-lime-ink hover:underline">Ver las {lista.length} recetas</button>
        )}
      </Tarjeta>

      <Hoja abierta={!!abierta} onClose={() => setAbierta(null)} titulo="Receta">
        {abierta && <RecetaDetalle r={abierta} onRegistrado={(m) => { setAbierta(null); setToast(m); }} />}
      </Hoja>
      <Toast texto={toast} />
    </>
  );
}
