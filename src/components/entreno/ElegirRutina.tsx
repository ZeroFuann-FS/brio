import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ejercicioPorId, type Musculo } from "../../data/ejercicios";
import { NOMBRE_LUGAR, PLANTILLAS, encaje, rutinaDePlantilla, type Plantilla } from "../../data/plantillas";
import { DIAS_CORTOS, DIAS_SEMANA, SEMANA_LD, asignarSemana, minutosDia, semanaSugerida, uidE, type Lugar, type Rutina } from "../../lib/entreno";
import { btnPrimario, btnSecundario, ease } from "../ui";
import MapaMuscular from "./MapaMuscular";

function Chip({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${on ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted hover:text-ink"}`}>{children}</button>
  );
}

/** Series por músculo que da una plantilla en una semana. */
function zonasDe(p: Plantilla) {
  const z: Partial<Record<Musculo, number>> = {};
  for (const d of p.dias) for (const x of d.ejercicios) {
    const e = ejercicioPorId(x.ej);
    if (!e || e.cardio) continue;
    for (const m of e.m) z[m] = (z[m] ?? 0) + x.series;
    for (const m of e.s) z[m] = (z[m] ?? 0) + x.series * 0.5;
  }
  return z;
}

export function SelectorSemana({ valor, onCambio }: { valor: number[]; onCambio: (v: number[]) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {SEMANA_LD.map((wd) => {
        const on = valor.includes(wd);
        return (
          <button key={wd} type="button" aria-pressed={on} aria-label={DIAS_SEMANA[wd]} onClick={() => onCambio(on ? valor.filter((x) => x !== wd) : [...valor, wd])}
            className={`num h-11 rounded-[11px] border text-[15px] uppercase transition ${on ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{DIAS_CORTOS[wd]}</button>
        );
      })}
    </div>
  );
}

export default function ElegirRutina({ diasIniciales, lugarInicial, onListo }: { diasIniciales: number; lugarInicial?: Lugar; onListo: (r: Rutina, lugar: Lugar) => void }) {
  const [lugar, setLugar] = useState<Lugar>(lugarInicial ?? "gym");
  const [nDias, setNDias] = useState(Math.min(6, Math.max(2, diasIniciales || 3)));
  const [nivel, setNivel] = useState<"Principiante" | "Intermedio">("Principiante");
  const [elegida, setElegida] = useState<Plantilla | "cero" | null>(null);
  const [semana, setSemana] = useState<number[]>([]);
  const [verTodas, setVerTodas] = useState(false);

  const lista = useMemo(() => [...PLANTILLAS].sort((a, b) => encaje(b, lugar, nDias, nivel) - encaje(a, lugar, nDias, nivel)), [lugar, nDias, nivel]);
  const elegir = (p: Plantilla | "cero") => { setElegida(p); setSemana(semanaSugerida(nDias)); };

  if (elegida) {
    const base: Rutina = elegida === "cero"
      ? { id: uidE(), nombre: "Mi rutina", dias: SEMANA_LD.filter((d) => semana.includes(d)).map((_, i) => ({ id: uidE(), nombre: `Día ${String.fromCharCode(65 + i)}`, ejercicios: [] })) }
      : rutinaDePlantilla(elegida, uidE, semana);
    const r = elegida === "cero" ? asignarSemana(base.dias.length ? base : { ...base, dias: [{ id: uidE(), nombre: "Día A", ejercicios: [] }] }, semana) : base;
    const orden = SEMANA_LD.filter((d) => semana.includes(d));
    return (
      <div>
        <button onClick={() => setElegida(null)} className="lab hover:underline">← Otras rutinas</button>
        <h3 className="mt-2 font-serif text-2xl font-medium">{elegida === "cero" ? "Tu rutina desde cero" : elegida.nombre}</h3>
        <p className="lab mb-2 mt-4">¿Qué días vas a entrenar?</p>
        <SelectorSemana valor={semana} onCambio={setSemana} />
        <p className="mt-2 text-xs text-muted">{orden.length} {orden.length === 1 ? "día" : "días"} a la semana. Los demás son de descanso; puedes cambiarlo cuando quieras.</p>
        {orden.length > 0 && (
          <ul className="mt-4 rounded-[16px] border border-line bg-surface px-4">
            {orden.map((wd) => {
              const d = r.dias.find((x) => x.semana?.includes(wd));
              return (
                <li key={wd} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                  <span className="num w-11 shrink-0 text-lg uppercase">{DIAS_SEMANA[wd].slice(0, 3)}</span>
                  <span className="min-w-0 flex-1"><b className="block truncate font-medium">{d?.nombre}</b>
                    {d && d.ejercicios.length > 0 && <span className="lab !tracking-[0.05em]">{d.ejercicios.length} ejercicios · ~{minutosDia(d)} min</span>}</span>
                </li>
              );
            })}
          </ul>
        )}
        <button onClick={() => onListo(r, lugar)} disabled={!orden.length} className={`${btnPrimario} mt-5 w-full`}>
          {elegida === "cero" ? "Elegir mis ejercicios" : "Revisar ejercicios"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        <div><p className="lab mb-2">¿Dónde entrenas?</p>
          <div className="flex flex-wrap gap-2">{(["gym", "basico", "casa"] as Lugar[]).map((l) => <Chip key={l} on={lugar === l} onClick={() => setLugar(l)}>{NOMBRE_LUGAR[l]}</Chip>)}</div>
          <p className="mt-1.5 text-xs text-muted">{lugar === "gym" ? "Máquinas, poleas, barras y mancuernas." : lugar === "basico" ? "Pocas máquinas: mancuernas, banco y barra de dominadas." : "Tu peso, una silla y si tienes, mancuernas."}</p>
        </div>
        <div><p className="lab mb-2">¿Cuántos días a la semana?</p>
          <div className="flex flex-wrap gap-2">{[2, 3, 4, 5, 6].map((n) => <Chip key={n} on={nDias === n} onClick={() => setNDias(n)}>{`${n} días`}</Chip>)}</div>
        </div>
        <div><p className="lab mb-2">¿Cuánto tiempo llevas entrenando?</p>
          <div className="flex flex-wrap gap-2">
            <Chip on={nivel === "Principiante"} onClick={() => setNivel("Principiante")}>Menos de 1 año</Chip>
            <Chip on={nivel === "Intermedio"} onClick={() => setNivel("Intermedio")}>Más de 1 año</Chip>
          </div>
        </div>
      </div>

      <p className="lab mb-2 mt-6">Rutinas para ti</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {(verTodas ? lista : lista.slice(0, 3)).map((p, i) => {
          const min = Math.round(p.dias.reduce((a, d) => a + minutosDia(d), 0) / p.dias.length);
          const rec = i === 0;
          return (
            <motion.li key={p.id} layout transition={{ duration: 0.3, ease }}
              className={`flex flex-col rounded-[18px] border p-4 ${rec ? "border-lime bg-lime/10" : "border-line bg-surface"}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  {rec && <span className="lab mb-1 inline-block rounded-full bg-lime px-2 py-0.5 !text-[10px] !text-on-lime">Recomendada</span>}
                  <h4 className="font-medium leading-snug">{p.nombre}</h4>
                  <p className="mt-1 text-sm text-muted">{p.desc}</p>
                </div>
                <div className="w-[86px] shrink-0"><MapaMuscular zonas={zonasDe(p)} compacto mini /></div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[NOMBRE_LUGAR[p.lugar], p.nivel, `~${min} min`, p.enfoque].map((t) => <span key={t} className="rounded-full bg-t-habit px-2.5 py-0.5 text-xs">{t}</span>)}
              </div>
              <p className="lab mt-2 !tracking-[0.05em]">{p.dias.map((d) => d.nombre).join(" · ")}</p>
              <button onClick={() => elegir(p)} className={`${rec ? btnPrimario : btnSecundario} mt-3 w-full`}>Elegir esta</button>
            </motion.li>
          );
        })}
      </ul>
      {!verTodas && lista.length > 3 && (
        <button onClick={() => setVerTodas(true)} className={`${btnSecundario} mt-3 w-full`}>Ver {lista.length - 3} rutinas más</button>
      )}
      <button onClick={() => elegir("cero")} className="mt-3 w-full rounded-[16px] border border-dashed border-line p-4 text-left">
        <b className="font-medium">Crear la mía desde cero</b><span className="block text-sm text-muted">Elige los días y tus ejercicios del catálogo.</span>
      </button>
    </div>
  );
}
