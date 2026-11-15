import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ejercicioPorId, type Ejercicio } from "../../data/ejercicios";
import { duracionMin, serieInicial, seriesHechas, textoSerie, tocaSubir, ultimaVez, volumen, type Sesion } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import { Hoja, Tarjeta, btnPrimario, btnSecundario } from "../ui";
import Biblioteca, { DetalleEjercicio } from "./Biblioteca";
import { FotoEjercicio } from "./MapaMuscular";

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const num = (v: string) => { const n = Number(v.replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : 0; };

function Campo({ valor, onCambio, label, decimal = false }: { valor: number; onCambio: (n: number) => void; label: string; decimal?: boolean }) {
  const [txt, setTxt] = useState(valor ? String(valor) : "");
  useEffect(() => { setTxt(valor ? String(valor) : ""); }, [valor]);
  return (
    <input aria-label={label} inputMode={decimal ? "decimal" : "numeric"} value={txt} placeholder="0"
      onChange={(e) => setTxt(e.target.value.replace(/[^\d.,]/g, ""))} onBlur={() => onCambio(num(txt))}
      onFocus={(e) => e.currentTarget.select()}
      className="num h-10 w-full min-w-0 rounded-[10px] border border-line bg-bg text-center text-lg outline-none focus:border-line-strong dark:focus:border-lime" />
  );
}

export default function SesionActiva({ onTerminada }: { onTerminada: (s: Sesion | null) => void }) {
  const sesion = useBrio((s) => s.sesionActiva)!;
  const sesiones = useBrio((s) => s.sesiones);
  const { editarSesion, terminarSesion, descartarSesion } = useBrio();
  const [, setTick] = useState(0);
  const [descanso, setDescanso] = useState<{ fin: number; total: number } | null>(null);
  const [agregar, setAgregar] = useState(false);
  const [ver, setVer] = useState<Ejercicio | null>(null);
  const [confirmar, setConfirmar] = useState<"terminar" | "cancelar" | null>(null);

  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const restante = descanso ? Math.max(0, (descanso.fin - Date.now()) / 1000) : 0;
  useEffect(() => {
    if (descanso && restante <= 0) { try { navigator.vibrate?.([200, 100, 200]); } catch { /* sin vibración */ } setDescanso(null); }
  }, [descanso, restante]);

  /** Cambia una serie; el peso o las reps nuevas se copian a las siguientes series que aún no haces y tenían el valor anterior. */
  const editarSerie = (ei: number, si: number, cambio: Partial<{ kg: number; reps: number; min: number; km: number; hecha: boolean }>) =>
    editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => {
      if (i !== ei) return e;
      const antes = e.series[si];
      return { ...e, series: e.series.map((x, j) => {
        if (j === si) return { ...x, ...cambio };
        if (j < si || x.hecha) return x;
        const c: typeof cambio = {};
        if (cambio.kg !== undefined && x.kg === antes.kg) c.kg = cambio.kg;
        if (cambio.reps !== undefined && x.reps === antes.reps) c.reps = cambio.reps;
        if (cambio.min !== undefined && x.min === antes.min) c.min = cambio.min;
        return { ...x, ...c };
      }) };
    }) }));
  const marcar = (ei: number, si: number) => {
    const e = sesion.ejercicios[ei], x = e.series[si];
    editarSerie(ei, si, { hecha: !x.hecha });
    if (!x.hecha && !ejercicioPorId(e.ej)?.cardio) setDescanso({ fin: Date.now() + e.descanso * 1000, total: e.descanso });
  };
  const sumarSerie = (ei: number) => editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => i !== ei ? e : { ...e, series: [...e.series, { ...(e.series[e.series.length - 1] ?? { kg: 0, reps: 10 }), hecha: false }] }) }));
  const quitarSerie = (ei: number) => editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => i !== ei || e.series.length <= 1 ? e : { ...e, series: e.series.slice(0, -1) }) }));
  const quitarEjercicio = (ei: number) => editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.filter((_, i) => i !== ei) }));
  const agregarEj = (l: Ejercicio[]) => { editarSesion((s) => ({ ...s, ejercicios: [...s.ejercicios, ...l.map((e) => serieInicial(sesiones, e.id, e.cardio ? 1 : 3, e.cardio ? "20 min" : "10", e.cardio ? 0 : 90))] })); setAgregar(false); };
  const lugar = useBrio((s) => s.perfil?.entreno?.lugar);

  const hechas = seriesHechas(sesion);
  const transcurrido = (Date.now() - sesion.inicio) / 1000;

  return (
    <div className="pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="lab">Entrenando · {reloj(transcurrido)}</p>
          <h1 className="truncate font-serif text-3xl font-medium tracking-tight md:text-4xl">{sesion.nombre}</h1>
          <p className="mt-0.5 text-sm text-muted">{hechas} series · {volumen(sesion).toLocaleString("es-MX")} kg levantados</p>
        </div>
        <button onClick={() => setConfirmar("terminar")} className="h-11 shrink-0 rounded-full bg-lime px-5 font-display text-sm font-bold uppercase tracking-[0.12em] text-on-lime">Terminar</button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {sesion.ejercicios.map((e, ei) => {
          const info = ejercicioPorId(e.ej);
          if (!info) return null;
          const prev = ultimaVez(sesiones, e.ej);
          const subir = tocaSubir(sesiones, e.ej, e.reps);
          return (
            <Tarjeta key={`${e.ej}-${ei}`} className="!p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setVer(info)} aria-label={`Ver cómo se hace ${info.n}`}><FotoEjercicio id={e.ej} size={52} /></button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setVer(info)} className="block truncate text-left font-medium hover:underline">{info.n}</button>
                  <span className="lab !tracking-[0.05em]">Objetivo: {e.series.length} × {e.reps}{info.cardio ? "" : ` · descanso ${reloj(e.descanso)}`}</span>
                </div>
                <button onClick={() => quitarEjercicio(ei)} aria-label={`Quitar ${info.n}`} className="text-lg text-muted hover:text-ember">×</button>
              </div>
              {subir && !e.series.some((x) => x.hecha) && (
                <button onClick={() => e.series.forEach((_, si) => editarSerie(ei, si, { kg: subir }))} className="mt-2 w-full rounded-[10px] bg-lime/20 px-3 py-1.5 text-left text-xs">
                  ↑ La vez pasada llegaste al tope de reps en todas. <b>Prueba con {subir} kg</b> (toca para ponerlo).
                </button>
              )}
              <div className={`mt-3 grid items-center gap-x-2 gap-y-1.5 text-center ${info.cardio ? "grid-cols-[28px_1fr_1fr_1fr_40px]" : "grid-cols-[28px_1fr_1fr_1fr_40px]"}`}>
                <span className="lab">#</span><span className="lab">Anterior</span>
                {info.cardio ? <><span className="lab">Min</span><span className="lab">Km</span></> : <><span className="lab">Kg</span><span className="lab">Reps</span></>}
                <span />
                {e.series.map((x, si) => {
                  const p = prev?.[si];
                  return (
                    <div key={si} className="contents">
                      <span className="num text-muted">{si + 1}</span>
                      <span className="num truncate text-sm text-muted">{p ? textoSerie(p) : "—"}</span>
                      {info.cardio
                        ? <><Campo label={`Minutos serie ${si + 1}`} valor={x.min ?? 0} onCambio={(n) => editarSerie(ei, si, { min: n })} /><Campo label={`Km serie ${si + 1}`} valor={x.km ?? 0} decimal onCambio={(n) => editarSerie(ei, si, { km: n })} /></>
                        : <>
                          <Campo label={`Kg serie ${si + 1}`} valor={x.kg} decimal onCambio={(n) => editarSerie(ei, si, { kg: n })} />
                          <Campo label={`Reps serie ${si + 1}`} valor={x.reps} onCambio={(n) => editarSerie(ei, si, { reps: n })} />
                        </>}
                      <button onClick={() => marcar(ei, si)} aria-pressed={x.hecha} aria-label={`Serie ${si + 1} hecha`}
                        className={`grid h-10 w-10 place-items-center rounded-[10px] border text-base font-extrabold transition ${x.hecha ? "border-lime bg-lime text-on-lime" : "border-line text-muted"}`}>✓</button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => sumarSerie(ei)} className="flex-1 rounded-[10px] border border-dashed border-line py-1.5 text-sm text-muted hover:text-ink">+ Serie</button>
                {e.series.length > 1 && <button onClick={() => quitarSerie(ei)} className="rounded-[10px] border border-dashed border-line px-3 py-1.5 text-sm text-muted hover:text-ink">− Serie</button>}
              </div>
            </Tarjeta>
          );
        })}
      </div>

      <button onClick={() => setAgregar(true)} className={`${btnSecundario} mt-3 w-full`}>+ Agregar ejercicio</button>
      <button onClick={() => setConfirmar("cancelar")} className="mt-3 w-full text-center text-sm text-muted hover:text-ember">Cancelar entreno</button>

      {/* Descanso */}
      <AnimatePresence>
        {descanso && (
          <motion.div className="fixed inset-x-3 bottom-[84px] z-40 mx-auto max-w-md rounded-[18px] border border-line bg-ink p-3 text-bg shadow-lg md:bottom-6 dark:bg-surface dark:text-ink"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <div className="flex items-center gap-3">
              <span className="lab !text-current opacity-70">Descanso</span>
              <span className="num text-3xl">{reloj(restante)}</span>
              <span className="ml-auto flex gap-1.5">
                <button onClick={() => setDescanso((d) => d && { ...d, fin: d.fin - 15000 })} className="rounded-full border border-current/30 px-2.5 py-1 text-sm">−15</button>
                <button onClick={() => setDescanso((d) => d && { ...d, fin: d.fin + 15000, total: d.total + 15 })} className="rounded-full border border-current/30 px-2.5 py-1 text-sm">+15</button>
                <button onClick={() => setDescanso(null)} className="rounded-full bg-lime px-3 py-1 text-sm font-semibold text-on-lime">Saltar</button>
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-current/20"><div className="h-full bg-lime transition-[width] duration-1000 ease-linear" style={{ width: `${(restante / descanso.total) * 100}%` }} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <Hoja abierta={agregar} onClose={() => setAgregar(false)} titulo="Agregar ejercicio" ancha>
        <Biblioteca onElegir={agregarEj} onVer={setVer} lugar={lugar} yaAgregados={sesion.ejercicios.map((x) => x.ej)} />
      </Hoja>
      <Hoja abierta={!!ver} onClose={() => setVer(null)} titulo="Ejercicio" ancha>
        {ver && <DetalleEjercicio e={ver} />}
      </Hoja>
      <Hoja abierta={!!confirmar} onClose={() => setConfirmar(null)} titulo={confirmar === "terminar" ? "¿Terminar entreno?" : "¿Cancelar entreno?"}>
        {confirmar === "terminar" ? (
          <>
            <p className="text-sm text-muted">{hechas ? `Llevas ${hechas} series en ${duracionMin(sesion)} min. Se guardan solo las series que marcaste.` : "No has marcado ninguna serie; no se guardará nada."}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmar(null)} className={`${btnSecundario} flex-1`}>Seguir</button>
              <button onClick={() => { setConfirmar(null); onTerminada(terminarSesion()); }} className={`${btnPrimario} flex-1`}>Terminar</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Se borra esta sesión y no se guarda nada.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmar(null)} className={`${btnSecundario} flex-1`}>Seguir entrenando</button>
              <button onClick={() => { setConfirmar(null); descartarSesion(); onTerminada(null); }} className="h-12 flex-1 rounded-2xl bg-ember font-bold text-white">Cancelar entreno</button>
            </div>
          </>
        )}
      </Hoja>
    </div>
  );
}
