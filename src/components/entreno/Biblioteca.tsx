import { useMemo, useState } from "react";
import { EJERCICIOS, NOMBRE_MUSCULO, type Ejercicio, type Musculo } from "../../data/ejercicios";
import { mejorMarca, progreso, ultimaVez, type Lugar } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import { btnPrimario, inputCls } from "../ui";
import MapaMuscular, { AnimEjercicio, FotoEjercicio } from "./MapaMuscular";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Grupos para filtrar (más fáciles que 15 músculos). */
export const GRUPOS: { id: string; t: string; m: Musculo[] }[] = [
  { id: "pecho", t: "Pecho", m: ["pecho"] },
  { id: "espalda", t: "Espalda", m: ["dorsales", "espalda-media", "trapecio", "lumbar"] },
  { id: "hombros", t: "Hombros", m: ["hombros"] },
  { id: "biceps", t: "Bíceps", m: ["biceps"] },
  { id: "triceps", t: "Tríceps", m: ["triceps"] },
  { id: "pierna", t: "Pierna", m: ["cuadriceps", "femorales", "aductores"] },
  { id: "gluteos", t: "Glúteos", m: ["gluteos"] },
  { id: "pantorrillas", t: "Pantorrillas", m: ["pantorrillas"] },
  { id: "abdomen", t: "Abdomen", m: ["abdomen"] },
  { id: "antebrazos", t: "Antebrazos", m: ["antebrazos"] },
];
const EQUIPO: { id: string; t: string; incluye: string[] }[] = [
  { id: "mancuernas", t: "Mancuernas", incluye: ["Mancuernas"] },
  { id: "barra", t: "Barra", incluye: ["Barra", "Barra Z"] },
  { id: "maquina", t: "Máquina", incluye: ["Máquina"] },
  { id: "polea", t: "Polea", incluye: ["Polea"] },
  { id: "corporal", t: "Sin equipo", incluye: ["Peso corporal"] },
  { id: "fija", t: "Barra fija", incluye: ["Barra fija / paralelas", "Barra fija"] },
  { id: "otros", t: "Pesa rusa y banda", incluye: ["Pesa rusa", "Banda", "Rueda abdominal", "Cuerda"] },
  { id: "cardio", t: "Cardio", incluye: ["Cardio"] },
];
/** Equipo que suele haber según dónde entrena. */
export const EQUIPO_LUGAR: Record<Lugar, string[]> = {
  gym: EQUIPO.map((e) => e.id),
  basico: ["mancuernas", "barra", "corporal", "fija", "otros"],
  casa: ["corporal", "mancuernas", "otros"],
};
const grupoDe = (e: Ejercicio) => (e.cardio ? "cardio" : GRUPOS.find((g) => g.m.includes(e.m[0]))?.id ?? "otros");

function Grafica({ datos }: { datos: { fecha: string; v: number }[] }) {
  const w = 280, h = 70, min = Math.min(...datos.map((d) => d.v)), max = Math.max(...datos.map((d) => d.v));
  const x = (i: number) => (datos.length === 1 ? w / 2 : (i / (datos.length - 1)) * (w - 12) + 6);
  const y = (v: number) => (max === min ? h / 2 : h - 8 - ((v - min) / (max - min)) * (h - 22));
  const pts = datos.map((d, i) => `${x(i)},${y(d.v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[70px] w-full" aria-label="Progreso de tu fuerza en este ejercicio">
      <polyline points={pts} fill="none" stroke="var(--color-lime)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {datos.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.v)} r="3" fill="var(--color-lime)" />)}
      <text x={x(datos.length - 1)} y={y(datos[datos.length - 1].v) - 7} textAnchor="end" className="fill-current text-[10px]">{datos[datos.length - 1].v} kg</text>
    </svg>
  );
}

export function DetalleEjercicio({ e }: { e: Ejercicio }) {
  const sesiones = useBrio((s) => s.sesiones);
  const marca = mejorMarca(sesiones, e.id);
  const ultima = ultimaVez(sesiones, e.id);
  const hist = progreso(sesiones, e.id);
  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(`cómo hacer ${e.n} técnica correcta`)}`;
  return (
    <div className="md:grid md:grid-cols-[1.1fr_1fr] md:gap-6">
      <div>
        <AnimEjercicio id={e.id} alt={e.n} className="aspect-[4/3] w-full rounded-[18px] border border-line" />
        <a href={video} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 rounded-[12px] border border-line py-2.5 text-sm hover:border-line-strong">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z" /></svg> Ver video de la técnica
        </a>
        <p className="lab mt-3">{e.eq} · {e.nivel}</p>
        <h3 className="font-serif text-2xl font-medium leading-tight">{e.n}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {e.m.map((m) => <span key={m} className="rounded-full bg-lime px-2.5 py-0.5 text-xs text-on-lime">{NOMBRE_MUSCULO[m]}</span>)}
          {e.s.map((m) => <span key={m} className="rounded-full bg-t-habit px-2.5 py-0.5 text-xs">{NOMBRE_MUSCULO[m]}</span>)}
        </div>
      </div>
      <div className="mt-4 md:mt-0">
        <p className="lab mb-2">Cómo se hace</p>
        <ol className="space-y-2.5">
          {e.pasos.map((p, i) => (
            <li key={i} className="grid grid-cols-[26px_1fr] gap-2 text-sm leading-relaxed">
              <span className="num grid h-[26px] w-[26px] place-items-center rounded-full bg-t-food text-[15px]">{i + 1}</span><span className="pt-0.5">{p}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid grid-cols-[1fr_150px] items-center gap-3 rounded-[16px] border border-line bg-surface p-3 sm:grid-cols-[1fr_190px]">
          <div>
            <p className="lab">Músculos</p>
            <p className="mt-1 text-xs text-muted"><b className="text-ink">Verde fuerte</b>: principal. <b className="text-ink">Verde claro</b>: también trabaja.</p>
          </div>
          <MapaMuscular resaltar={e.m} sec={e.s} compacto />
        </div>
        {!e.cardio && (marca || ultima) && (
          <div className="mt-3 rounded-[16px] border border-line bg-surface p-3">
            {marca && <p className="text-sm">Tu récord: <b className="num text-lg">{marca.kg} kg × {marca.reps}</b> <span className="text-xs text-muted">({marca.fecha})</span></p>}
            {ultima && <p className="text-xs text-muted">Última vez: {ultima.map((x) => `${x.kg}×${x.reps}`).join(" · ")}</p>}
            {hist.length >= 2 && <><p className="lab mt-2">Tu fuerza estimada (1RM)</p><Grafica datos={hist.slice(-12)} /></>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Catálogo con búsqueda y filtros. Con `onElegir` permite elegir varios y agregarlos juntos. */
export default function Biblioteca({ onElegir, onVer, yaAgregados = [], lugar }: { onElegir?: (e: Ejercicio[]) => void; onVer?: (e: Ejercicio) => void; yaAgregados?: string[]; lugar?: Lugar }) {
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState("");
  const [equipo, setEquipo] = useState<string[]>(lugar && lugar !== "gym" ? EQUIPO_LUGAR[lugar] : []);
  const [sel, setSel] = useState<string[]>([]);

  const lista = useMemo(() => {
    const eqs = EQUIPO.filter((x) => equipo.includes(x.id)).flatMap((x) => x.incluye);
    return EJERCICIOS.filter((e) =>
      (!q.trim() || norm(`${e.n} ${e.eq} ${[...e.m, ...e.s].map((m) => NOMBRE_MUSCULO[m]).join(" ")}`).includes(norm(q.trim()))) &&
      (!grupo || (grupo === "cardio" ? e.cardio : !e.cardio && GRUPOS.find((g) => g.id === grupo)!.m.some((m) => e.m.includes(m)))) &&
      (!equipo.length || eqs.includes(e.eq)));
  }, [q, grupo, equipo]);

  const secciones = !q.trim() && !grupo
    ? [...GRUPOS.map((g) => ({ id: g.id, t: g.t })), { id: "cardio", t: "Cardio" }].map((g) => ({ ...g, items: lista.filter((e) => grupoDe(e) === g.id) })).filter((g) => g.items.length)
    : [{ id: "res", t: "", items: lista }];
  const tocar = (e: Ejercicio) => (onElegir ? setSel((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id])) : onVer?.(e));

  return (
    <div className={onElegir ? "pb-16" : ""}>
      <input className={inputCls} placeholder="Busca: sentadilla, pecho, polea…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {[{ id: "", t: "Todos" }, ...GRUPOS, { id: "cardio", t: "Cardio" }].map((g) => (
          <button key={g.id} onClick={() => setGrupo(g.id)} aria-pressed={grupo === g.id}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${grupo === g.id ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>{g.t}</button>
        ))}
      </div>
      <div className="-mx-1 mt-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
        {lugar && (
          <button onClick={() => setEquipo((x) => (x.join() === EQUIPO_LUGAR[lugar].join() ? [] : EQUIPO_LUGAR[lugar]))}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${equipo.join() === EQUIPO_LUGAR[lugar].join() ? "border-lime bg-lime/20" : "border-dashed border-line text-muted"}`}>Lo que hay en mi gym</button>
        )}
        {EQUIPO.map((x) => (
          <button key={x.id} onClick={() => setEquipo((l) => (l.includes(x.id) ? l.filter((y) => y !== x.id) : [...l, x.id]))} aria-pressed={equipo.includes(x.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${equipo.includes(x.id) ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{x.t}</button>
        ))}
      </div>
      <p className="lab mt-2">{lista.length} ejercicios{onElegir ? " · toca para elegir varios" : ""}</p>

      {secciones.map((s) => (
        <section key={s.id} className="mt-3">
          {s.t && <p className="lab mb-2 border-b border-line pb-1">{s.t} · {s.items.length}</p>}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {s.items.map((e) => {
              const elegido = sel.includes(e.id), ya = yaAgregados.includes(e.id);
              return (
                <li key={e.id} className="min-w-0">
                  <div className="relative">
                    <button onClick={() => tocar(e)} aria-pressed={onElegir ? elegido : undefined} className="block w-full text-left">
                      <span className={`relative block aspect-[4/3] overflow-hidden rounded-[14px] border-2 bg-white ${elegido ? "border-lime" : "border-transparent"}`}>
                        <img src={`/ejercicios/${e.id}-0.webp`} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {onElegir && <span className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full border-2 text-xs font-extrabold ${elegido ? "border-lime bg-lime text-on-lime" : "border-white bg-black/30 text-transparent"}`}>✓</span>}
                        {ya && <span className="lab absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-2 py-0.5 !text-[9px] !text-white">Ya en el día</span>}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-sm font-medium leading-snug">{e.n}</span>
                      <span className="lab block truncate !tracking-[0.04em]">{e.cardio ? "Cardio" : e.m.map((m) => NOMBRE_MUSCULO[m]).join(" · ")} · {e.eq}</span>
                    </button>
                    {onElegir && onVer && (
                      <button onClick={() => onVer(e)} aria-label={`Cómo se hace ${e.n}`} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sm font-bold text-[#151515] shadow">i</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {!lista.length && <p className="py-6 text-center text-sm text-muted">Nada con esos filtros. Prueba quitando alguno.</p>}

      {onElegir && sel.length > 0 && (
        <div className="sticky bottom-0 -mx-5 mt-4 border-t border-line bg-bg/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">{sel.slice(0, 4).map((id) => <FotoEjercicio key={id} id={id} size={32} />)}</div>
            <button onClick={() => { onElegir(sel.map((id) => EJERCICIOS.find((x) => x.id === id)!)); setSel([]); }} className={`${btnPrimario} flex-1`}>
              Agregar {sel.length} {sel.length === 1 ? "ejercicio" : "ejercicios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
