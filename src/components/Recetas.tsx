import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { RECETAS, TIPOS_RECETA, costo, etiquetas, nutricion, type Receta, type TipoReceta } from "../data/recetas";
import { enDespensa } from "../lib/menu";
import { useBrio } from "../lib/store";
import RecetaDetalle, { PortadaReceta } from "./RecetaDetalle";
import { Hoja, Toast, ease, inputCls, useToast, chipOn } from "./ui";

const SIN_FAVORITAS: string[] = [];

type Filtro = TipoReceta | "favoritas" | "proteina" | "economica" | "rapida" | "despensa" | "sinrefri";
const TIPOS: { id: Filtro; t: string }[] = TIPOS_RECETA.map((x) => ({ id: x.id as Filtro, t: x.t }));
const EXTRA: { id: Filtro; t: string }[] = [
  { id: "despensa", t: "Con mi despensa" }, { id: "favoritas", t: "♥ Favoritas" }, { id: "proteina", t: "Alta en proteína" },
  { id: "economica", t: "Económicas" }, { id: "rapida", t: "Rápidas" }, { id: "sinrefri", t: "Sin refri" },
];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PASO = 12;

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition ${on ? chipOn : "border-line bg-surface text-muted hover:text-ink"}`}>
      {children}
    </button>
  );
}

function TarjetaReceta({ r, fav, onAbrir, i }: { r: Receta; fav: boolean; onAbrir: () => void; i: number }) {
  const n = nutricion(r);
  const e = etiquetas(r);
  return (
    <motion.button onClick={onAbrir} className="group min-w-0 self-start text-left"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.35, ease }}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-line bg-white">
        <div className="h-full w-full transition duration-300 group-hover:scale-[1.04]"><PortadaReceta r={r} /></div>
        {fav && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-lime text-sm text-on-lime">♥</span>}
        {e.includes("Rápida") && <span className="lab absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 !text-[11px] !text-white backdrop-blur">{r.min} min</span>}
      </div>
      <p className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug">{r.nombre}</p>
      <p className="lab mt-0.5 !tracking-[0.05em]">{n.kcal} kcal · {n.proteina} g prot · ~${costo(r)}</p>
    </motion.button>
  );
}

export default function Recetas() {
  const despensa = useBrio((s) => s.despensa);
  const favoritas = useBrio((s) => s.perfil?.prefsComida?.favoritas) ?? SIN_FAVORITAS;
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [q, setQ] = useState("");
  const [abierta, setAbierta] = useState<Receta | null>(null);
  const [cuantas, setCuantas] = useState(8);
  const [toast, setToast] = useToast();

  const lista = useMemo(() => {
    const deDespensa = (r: Receta) => r.ing.filter(([id]) => id && enDespensa(despensa, id)).length;
    const tipos = filtros.filter((f) => TIPOS.some((t) => t.id === f));
    return RECETAS.filter((r) => {
      if (q.trim() && !norm(`${r.nombre} ${r.ing.map((x) => x[2]).join(" ")}`).includes(norm(q.trim()))) return false;
      if (tipos.length && !tipos.some((t) => r.tipos.includes(t as TipoReceta))) return false;
      return filtros.every((f) => {
        if (tipos.includes(f)) return true;
        if (f === "favoritas") return favoritas.includes(r.id);
        if (f === "despensa") return deDespensa(r) >= 2;
        const e = etiquetas(r);
        if (f === "proteina") return e.includes("Alta en proteína");
        if (f === "economica") return e.includes("Económica");
        if (f === "rapida") return e.includes("Rápida");
        if (f === "sinrefri") return e.includes("Sin refri");
        return true;
      });
    }).sort((a, b) => (filtros.includes("despensa") ? deDespensa(b) - deDespensa(a) : 0));
  }, [q, filtros, despensa, favoritas]);

  const visibles = lista.slice(0, cuantas);
  const toggle = (f: Filtro) => { setCuantas(8); setFiltros((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f])); };

  return (
    <section data-tour="recetas">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="lab">Recetario de Brío</p>
          <h2 className="font-serif text-3xl font-medium tracking-tight">Recetas</h2>
        </div>
        <span className="lab pb-1">{lista.length} de {RECETAS.length}</span>
      </div>

      <div className="sticky top-0 z-10 -mx-4 mt-3 bg-bg/90 px-4 pb-2 pt-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <div className="md:flex md:items-center md:gap-3">
          <input className={`${inputCls} md:max-w-sm`} placeholder="Busca: tinga, avena, atún, nopales…" value={q} onChange={(e) => { setQ(e.target.value); setCuantas(8); }} />
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 md:mt-0">
            {TIPOS.map((f) => <Chip key={f.id} on={filtros.includes(f.id)} onClick={() => toggle(f.id)}>{f.t}</Chip>)}
          </div>
        </div>
        <div className="-mx-1 mt-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:flex-wrap">
          {EXTRA.map((f) => <Chip key={f.id} on={filtros.includes(f.id)} onClick={() => toggle(f.id)}>{f.t}</Chip>)}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {visibles.map((r, i) => <TarjetaReceta key={r.id} r={r} i={i} fav={favoritas.includes(r.id)} onAbrir={() => setAbierta(r)} />)}
      </div>
      {!lista.length && <p className="py-6 text-center text-sm text-muted">Ninguna receta con esos filtros. Prueba quitando alguno.</p>}
      {lista.length > cuantas && (
        <button onClick={() => setCuantas((c) => c + PASO)} className="mx-auto mt-6 block rounded-full border border-line px-5 py-2.5 text-sm hover:border-line-strong">
          Ver más recetas ({lista.length - cuantas})
        </button>
      )}

      <Hoja abierta={!!abierta} onClose={() => setAbierta(null)} titulo="Receta" ancha>
        {abierta && <RecetaDetalle r={abierta} onRegistrado={(m) => { setAbierta(null); setToast(m); }} />}
      </Hoja>
      <Toast texto={toast} />
    </section>
  );
}
