import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { buscarLocal, type Alimento, type Porcion } from "../data/alimentos";
import { buscarOFF } from "../lib/off";
import { btnPrimario, btnSecundario, inputCls } from "./ui";

export interface Seleccion { a: Alimento; porcion: Porcion; cantidad: number }

export const calcular = (s: Seleccion) => {
  const gramos = s.porcion.g * s.cantidad;
  const f = gramos / 100;
  return { gramos, kcal: s.a.kcal * f, proteina: s.a.p * f, carbos: s.a.c * f, grasa: s.a.g * f };
};

const POPULARES = ["huevo", "tortilla", "pollo", "frijoles", "atún", "pan integral", "plátano", "aguacate"];
const GRAMOS: Porcion = { t: "gramos", g: 1 };

/** Buscador de alimentos tipo Fitia: base genérica local + productos de marca (Open Food Facts). */
export default function BuscarAlimento({ onAgregar }: { onAgregar: (s: Seleccion) => void }) {
  const [q, setQ] = useState("");
  const [marca, setMarca] = useState<{ estado: "idle" | "buscando" | "listo" | "error"; items: Alimento[] }>({ estado: "idle", items: [] });
  const [sel, setSel] = useState<Alimento | null>(null);
  const [porcion, setPorcion] = useState<Porcion | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const abort = useRef<AbortController | null>(null);

  const locales = q.trim().length >= 2 ? buscarLocal(q) : [];

  useEffect(() => { setMarca({ estado: "idle", items: [] }); abort.current?.abort(); }, [q]);

  const buscarMarca = async () => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setMarca({ estado: "buscando", items: [] });
    try { setMarca({ estado: "listo", items: await buscarOFF(q.trim(), ac.signal) }); }
    catch (e) { if ((e as Error).name !== "AbortError") setMarca({ estado: "error", items: [] }); }
  };

  const elegir = (a: Alimento) => { setSel(a); setPorcion(a.por[0]); setCantidad(1); };
  const cambiarPorcion = (p: Porcion) => { setPorcion(p); setCantidad(p === GRAMOS ? (porcion ? Math.round(porcion.g * cantidad) : 100) : 1); };

  /* ---------- Detalle del alimento elegido ---------- */
  if (sel && porcion) {
    const v = calcular({ a: sel, porcion, cantidad });
    const contable = /pieza|lata|rebanada|clara|taco|filete|barra|vaso|plato|puño/.test(porcion.t);
    const paso = porcion === GRAMOS ? 10 : contable ? 1 : 0.5;
    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => setSel(null)} className="lab mb-2 hover:text-ink">← Volver a buscar</button>
        <p className="font-serif text-xl font-medium leading-tight">{sel.n}</p>
        <p className="lab mt-1">{sel.cat} · por 100 g: {sel.kcal} kcal</p>

        <p className="lab mb-2 mt-4">Porción</p>
        <div className="flex flex-wrap gap-2">
          {[...sel.por, GRAMOS].map((p) => (
            <button key={p.t} onClick={() => cambiarPorcion(p)} aria-pressed={porcion === p}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${porcion === p ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>
              {p === GRAMOS ? "gramos" : `${p.t} (${p.g} g)`}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setCantidad((c) => Math.max(paso, Math.round((c - paso) * 10) / 10))} className="grid h-12 w-12 place-items-center rounded-[12px] border border-line text-xl" aria-label="Menos">−</button>
          <input className={`${inputCls} num h-12 flex-1 text-center text-2xl`} inputMode="decimal" value={cantidad}
            onChange={(e) => { const n = Number(e.target.value.replace(",", ".")); if (Number.isFinite(n)) setCantidad(n); }} />
          <button onClick={() => setCantidad((c) => Math.round((c + paso) * 10) / 10)} className="grid h-12 w-12 place-items-center rounded-[12px] border border-line text-xl" aria-label="Más">+</button>
        </div>
        <p className="lab mt-1.5 text-center">{porcion === GRAMOS ? "gramos" : `${porcion.t} · ${Math.round(v.gramos)} g en total`}</p>

        <div className="mt-4 grid grid-cols-4 gap-2 rounded-[14px] border border-line bg-surface p-3">
          {[["kcal", v.kcal], ["Prot", v.proteina], ["Carb", v.carbos], ["Grasa", v.grasa]].map(([l, x]) => (
            <div key={l as string}><p className="lab">{l}</p><p className="num text-2xl">{Math.round(x as number)}</p></div>
          ))}
        </div>
        <button disabled={!(cantidad > 0)} onClick={() => { onAgregar({ a: sel, porcion, cantidad }); setSel(null); setQ(""); }} className={`${btnPrimario} mt-4 w-full`}>
          Agregar al plato
        </button>
      </motion.div>
    );
  }

  /* ---------- Búsqueda ---------- */
  const Fila = ({ a }: { a: Alimento }) => (
    <li className="border-b border-line last:border-b-0">
      <button onClick={() => elegir(a)} className="grid w-full grid-cols-[1fr_auto] items-center gap-2 py-2.5 text-left">
        <span className="min-w-0"><span className="block truncate">{a.n}</span><span className="lab !tracking-[0.06em]">{a.por[0].t} · {Math.round(a.kcal * a.por[0].g / 100)} kcal</span></span>
        <span className="num text-sm text-muted">{a.kcal}/100 g</span>
      </button>
    </li>
  );

  return (
    <div>
      <input className={inputCls} placeholder="Busca un alimento: huevo, tortilla, atún…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {!q.trim() && (
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULARES.map((p) => <button key={p} onClick={() => setQ(p)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:text-ink">{p}</button>)}
        </div>
      )}
      {q.trim().length >= 2 && (
        <>
          <ul className="mt-2">{locales.map((a) => <Fila key={a.id} a={a} />)}</ul>
          {!locales.length && <p className="py-3 text-sm text-muted">No está en la base genérica. Búscalo en productos de marca.</p>}

          <div className="mt-3 border-t border-line pt-3">
            {marca.estado === "idle" && <button onClick={buscarMarca} className={`${btnSecundario} w-full`}>Buscar "{q.trim()}" en productos de marca</button>}
            {marca.estado === "buscando" && <p className="py-2 text-center text-sm text-muted">Buscando en Open Food Facts…</p>}
            {marca.estado === "error" && <p className="py-2 text-center text-sm text-ember">No se pudo buscar ahora. Intenta en un momento.</p>}
            <AnimatePresence>
              {marca.estado === "listo" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="lab">Productos de marca · Open Food Facts</p>
                  <ul className="mt-1">{marca.items.map((a) => <Fila key={a.id} a={a} />)}</ul>
                  {!marca.items.length && <p className="py-2 text-sm text-muted">Sin resultados de marca. Prueba con otra palabra o regístralo a mano.</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
