import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { buscarLocal, type Alimento, type Porcion } from "../data/alimentos";
import { fotoDe } from "../data/fotos";
import { buscarOFF, porCodigoOFF } from "../lib/off";
import { buscarComunidad, porCodigoComunidad } from "../lib/comunidad";
import { useSync } from "../lib/sync";
import CrearAlimento from "./CrearAlimento";
import { btnPrimario, btnSecundario, inputCls, chipOn } from "./ui";

const Escaner = lazy(() => import("./Escaner"));

export interface Seleccion { a: Alimento; porcion: Porcion; cantidad: number }

export const calcular = (s: Seleccion) => {
  const gramos = s.porcion.g * s.cantidad;
  const f = gramos / 100;
  return { gramos, kcal: s.a.kcal * f, proteina: s.a.p * f, carbos: s.a.c * f, grasa: s.a.g * f };
};

const POPULARES = ["huevo", "tortilla", "pollo", "frijoles", "atún", "albóndigas", "plátano", "cerveza"];
/** Marcas propias de supermercado (Walmart, Bodega Aurrera, Sam's, Soriana): están en productos de marca. */
const MARCAS = ["Great Value", "Aurrera", "Member's Mark", "Soriana"];
const GRAMOS: Porcion = { t: "gramos", g: 1 };
const COLOR_CAT: Record<string, string> = {
  "Huevo y lácteos": "bg-[#fdf0c4] text-[#7a5b00]", "Carnes y pescado": "bg-[#ffd9cc] text-[#8a2d0b]",
  Leguminosas: "bg-[#e8dccf] text-[#5b3a1c]", "Tortillas y cereales": "bg-[#f6e3b4] text-[#6b4e00]",
  Frutas: "bg-[#ffd6dc] text-[#8a1c2c]", Verduras: "bg-[#d5f0d0] text-[#245b1c]", "Grasas y otros": "bg-[#efe3c8] text-[#5e4a1e]",
  Bebidas: "bg-[#d9eaff] text-[#1c4c8a]", Platillos: "bg-[#fde2c4] text-[#7a3d00]",
};

/** Foto del producto, o un cuadro con la inicial y el color de su categoría. */
function Miniatura({ a }: { a: Alimento }) {
  const [rota, setRota] = useState(false);
  const src = a.img ?? (a.fuente ? undefined : fotoDe(a.id));
  if (src && !rota) {
    return <img src={src} alt="" loading="lazy" onError={() => setRota(true)} className="h-11 w-11 shrink-0 rounded-[10px] border border-line bg-white object-contain" />;
  }
  const color = COLOR_CAT[a.cat] ?? (a.fuente === "comunidad" ? "bg-lime text-on-lime" : "bg-t-food text-ink");
  return <span className={`num grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-lg ${color}`}>{a.n.trim().charAt(0).toUpperCase()}</span>;
}

type Vista = "buscar" | "escanear" | "crear";

/** Buscador tipo Fitia: base genérica + capturados en Brío + productos de marca (Open Food Facts) + escáner. */
export default function BuscarAlimento({ onAgregar, onBuscando }: { onAgregar: (s: Seleccion) => void; onBuscando?: (ocupado: boolean) => void }) {
  const conCuenta = useSync((s) => s.estado) !== "sin-cuenta";
  const [vista, setVista] = useState<Vista>("buscar");
  const [codigo, setCodigo] = useState<string | undefined>();
  const [aviso, setAviso] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [comunidad, setComunidad] = useState<Alimento[]>([]);
  const [marca, setMarca] = useState<{ estado: "idle" | "buscando" | "listo" | "error"; items: Alimento[] }>({ estado: "idle", items: [] });
  const [sel, setSel] = useState<Alimento | null>(null);
  const [porcion, setPorcion] = useState<Porcion | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const abort = useRef<AbortController | null>(null);

  const locales = q.trim().length >= 2 ? buscarLocal(q) : [];
  const ocupado = q.trim().length > 0 || !!sel || vista !== "buscar";
  useEffect(() => { onBuscando?.(ocupado); }, [ocupado, onBuscando]);

  useEffect(() => {
    setMarca({ estado: "idle", items: [] }); abort.current?.abort();
    if (q.trim().length < 2) { setComunidad([]); return; }
    const t = setTimeout(() => { buscarComunidad(q).then(setComunidad).catch(() => setComunidad([])); }, 300);
    // Pocos resultados genéricos (o se escribió una marca): busca solo en productos de marca
    const pocos = q.trim().length >= 3 && buscarLocal(q).length < 3;
    const tm = pocos ? setTimeout(() => { buscarMarca(); }, 800) : undefined;
    return () => { clearTimeout(t); if (tm) clearTimeout(tm); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const buscarMarca = async () => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setMarca({ estado: "buscando", items: [] });
    try { setMarca({ estado: "listo", items: await buscarOFF(q.trim(), ac.signal) }); }
    catch (e) { if ((e as Error).name !== "AbortError") setMarca({ estado: "error", items: [] }); }
  };

  const elegir = (a: Alimento) => { setSel(a); setPorcion(a.por[0]); setCantidad(1); setAviso(null); };
  const cambiarPorcion = (p: Porcion) => { setPorcion(p); setCantidad(p === GRAMOS ? (porcion ? Math.round(porcion.g * cantidad) : 100) : 1); };

  const alEscanear = async (c: string) => {
    setVista("buscar"); setAviso("Buscando el producto…");
    const a = (await porCodigoComunidad(c).catch(() => null)) ?? (await porCodigoOFF(c).catch(() => null));
    if (a) elegir(a);
    else { setCodigo(c); setAviso(null); setVista("crear"); }
  };

  /* ---------- Escáner ---------- */
  if (vista === "escanear") {
    return <Suspense fallback={<p className="py-8 text-center text-sm text-muted">Abriendo la cámara…</p>}><Escaner onCodigo={alEscanear} onCerrar={() => setVista("buscar")} /></Suspense>;
  }

  /* ---------- Capturar un producto nuevo ---------- */
  if (vista === "crear") {
    return conCuenta
      ? <CrearAlimento inicial={q.trim()} codigo={codigo} onCancelar={() => { setVista("buscar"); setCodigo(undefined); }} onCreado={(a) => { setVista("buscar"); setCodigo(undefined); elegir(a); }} />
      : (
        <div>
          <p className="text-sm text-muted">Para capturar productos nuevos necesitas tu cuenta gratis (Perfil → Crear cuenta). Mientras, puedes registrarlo en la pestaña "A mano".</p>
          <button onClick={() => setVista("buscar")} className={`${btnSecundario} mt-3 w-full`}>Volver</button>
        </div>
      );
  }

  /* ---------- Detalle del alimento elegido ---------- */
  if (sel && porcion) {
    const v = calcular({ a: sel, porcion, cantidad });
    const contable = /pieza|lata|rebanada|clara|taco|filete|barra|vaso|plato|puño/.test(porcion.t);
    const paso = porcion === GRAMOS ? 10 : contable ? 1 : 0.5;
    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => setSel(null)} className="lab mb-3 hover:text-ink">← Volver a buscar</button>
        <div className="flex items-center gap-3">
          <Miniatura a={sel} />
          <div className="min-w-0">
            <p className="font-serif text-xl font-medium leading-tight">{sel.n}</p>
            <p className="lab mt-1">{sel.cat} · {sel.kcal} kcal por 100 g</p>
          </div>
        </div>

        <p className="lab mb-2 mt-4">Porción</p>
        <div className="flex flex-wrap gap-2">
          {[...sel.por, GRAMOS].map((p) => (
            <button key={p.t} onClick={() => cambiarPorcion(p)} aria-pressed={porcion === p}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${porcion === p ? chipOn : "border-line bg-surface text-muted"}`}>
              {p === GRAMOS ? "gramos" : `${p.t} (${p.g} g)`}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setCantidad((c) => Math.max(paso, Math.round((c - paso) * 10) / 10))} className="grid h-12 w-12 place-items-center rounded-[12px] border border-line text-xl" aria-label="Menos">−</button>
          <input className={`${inputCls} num h-12 flex-1 text-center text-2xl`} inputMode="decimal" value={cantidad}
            onChange={(e) => { const x = Number(e.target.value.replace(",", ".")); if (Number.isFinite(x)) setCantidad(x); }} />
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
      <button onClick={() => elegir(a)} className="flex w-full items-center gap-3 py-2.5 text-left">
        <Miniatura a={a} />
        <span className="min-w-0 flex-1"><span className="block truncate">{a.n}</span><span className="lab !tracking-[0.06em]">{a.por[0].t} · {Math.round(a.kcal * a.por[0].g / 100)} kcal</span></span>
        <span className="num shrink-0 text-sm text-muted">{a.kcal}/100 g</span>
      </button>
    </li>
  );

  const hayTexto = q.trim().length >= 2;

  return (
    <div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Busca: huevo, albóndigas, avena Great Value…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <button onClick={() => setVista("escanear")} aria-label="Escanear código de barras" title="Escanear código de barras"
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-[14px] border border-line bg-surface">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
        </button>
      </div>
      {aviso && <p className="mt-2 text-sm text-muted">{aviso}</p>}

      {!hayTexto && (
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULARES.map((p) => <button key={p} onClick={() => setQ(p)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted hover:text-ink">{p}</button>)}
        </div>
      )}
      {!hayTexto && (
        <p className="mt-3 text-xs text-muted">¿Compras en Walmart, Aurrera o Sam's? Escribe el producto con su marca ({MARCAS.join(", ")}) o escanea el código de barras.</p>
      )}

      {hayTexto && (
        <>
          {comunidad.length > 0 && (
            <>
              <p className="lab mt-3">Capturados en Brío</p>
              <ul>{comunidad.map((a) => <Fila key={a.id} a={a} />)}</ul>
            </>
          )}
          {locales.length > 0 && (
            <>
              <p className="lab mt-3">Alimentos genéricos</p>
              <ul>{locales.map((a) => <Fila key={a.id} a={a} />)}</ul>
            </>
          )}

          <div className="mt-3 border-t border-line pt-3">
            {marca.estado === "idle" && <button onClick={buscarMarca} className={`${btnSecundario} w-full`}>Buscar "{q.trim()}" en productos de marca</button>}
            {marca.estado === "buscando" && <p className="py-2 text-center text-sm text-muted">Buscando en Open Food Facts…</p>}
            {marca.estado === "error" && <p className="py-2 text-center text-sm text-ember">No se pudo buscar ahora. Intenta en un momento.</p>}
            <AnimatePresence>
              {marca.estado === "listo" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="lab">Productos de marca · Open Food Facts</p>
                  <ul className="mt-1">{marca.items.map((a) => <Fila key={a.id} a={a} />)}</ul>
                  {!marca.items.length && <p className="py-2 text-sm text-muted">Sin resultados de marca.</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 rounded-[14px] border border-dashed border-line-strong/50 p-3.5 text-center">
            <p className="text-sm">¿No aparece tu producto?</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setVista("escanear")} className={`${btnSecundario} h-10 text-sm`}>Escanear código</button>
              <button onClick={() => { setCodigo(undefined); setVista("crear"); }} className={`${btnSecundario} h-10 text-sm`}>Capturarlo</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
