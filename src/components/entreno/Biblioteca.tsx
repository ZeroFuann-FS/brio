import { useMemo, useState } from "react";
import { EJERCICIOS, EQUIPOS, MUSCULOS, NOMBRE_MUSCULO, type Ejercicio, type Musculo } from "../../data/ejercicios";
import { mejorMarca, ultimaVez } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import { inputCls } from "../ui";
import MapaMuscular, { AnimEjercicio, FotoEjercicio } from "./MapaMuscular";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function DetalleEjercicio({ e }: { e: Ejercicio }) {
  const sesiones = useBrio((s) => s.sesiones);
  const marca = mejorMarca(sesiones, e.id);
  const ultima = ultimaVez(sesiones, e.id);
  return (
    <div className="md:grid md:grid-cols-[1.1fr_1fr] md:gap-6">
      <div>
        <AnimEjercicio id={e.id} alt={e.n} className="aspect-[4/3] rounded-[18px] border border-line" />
        <p className="lab mt-3">{e.eq}</p>
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
        <div className="mt-4 grid grid-cols-[1fr_120px] items-center gap-3 rounded-[16px] border border-line bg-surface p-3">
          <div>
            <p className="lab">Músculos</p>
            <p className="mt-1 text-xs text-muted"><b className="text-ink">Verde</b>: principal. También trabaja: {e.s.length ? e.s.map((m) => NOMBRE_MUSCULO[m].toLowerCase()).join(", ") : "nada más"}.</p>
            {marca && !e.cardio && <p className="mt-2 text-sm">Tu récord: <b className="num text-lg">{marca.kg} kg × {marca.reps}</b></p>}
            {ultima && !e.cardio && <p className="text-xs text-muted">Última vez: {ultima.map((x) => `${x.kg}×${x.reps}`).join(" · ")}</p>}
          </div>
          <MapaMuscular resaltar={e.m} compacto />
        </div>
      </div>
    </div>
  );
}

/** Lista de ejercicios con búsqueda y filtros. Con `onElegir` funciona como selector. */
export default function Biblioteca({ onElegir, onVer }: { onElegir?: (e: Ejercicio) => void; onVer?: (e: Ejercicio) => void }) {
  const [q, setQ] = useState("");
  const [musculo, setMusculo] = useState<Musculo | "">("");
  const [equipo, setEquipo] = useState("");
  const lista = useMemo(() => EJERCICIOS.filter((e) =>
    (!q.trim() || norm(`${e.n} ${e.eq} ${[...e.m, ...e.s].map((m) => NOMBRE_MUSCULO[m]).join(" ")}`).includes(norm(q.trim()))) &&
    (!musculo || e.m.includes(musculo)) && (!equipo || e.eq === equipo)), [q, musculo, equipo]);
  return (
    <div>
      <input className={inputCls} placeholder="Busca: sentadilla, pecho, mancuernas…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className={`${inputCls} py-2.5 text-sm`} value={musculo} onChange={(e) => setMusculo(e.target.value as Musculo | "")} aria-label="Músculo">
          <option value="">Todos los músculos</option>
          {MUSCULOS.map((m) => <option key={m.id} value={m.id}>{m.t}</option>)}
        </select>
        <select className={`${inputCls} py-2.5 text-sm`} value={equipo} onChange={(e) => setEquipo(e.target.value)} aria-label="Equipo">
          <option value="">Todo el equipo</option>
          {EQUIPOS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      <p className="lab mt-3">{lista.length} ejercicios</p>
      <ul className="mt-1 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        {lista.map((e) => (
          <li key={e.id} className="border-b border-line">
            <div className="flex items-center gap-3 py-2">
              <button onClick={() => onVer?.(e)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <FotoEjercicio id={e.id} size={52} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.n}</span>
                  <span className="lab !tracking-[0.05em]">{e.m.map((m) => NOMBRE_MUSCULO[m]).join(" · ")} · {e.eq}</span>
                </span>
              </button>
              {onElegir && <button onClick={() => onElegir(e)} aria-label={`Agregar ${e.n}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-lg font-bold text-on-lime">+</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
