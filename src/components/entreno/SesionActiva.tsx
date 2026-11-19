import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ejercicioPorId, type Ejercicio } from "../../data/ejercicios";
import { duracionMin, formatoMin, logroSerie, PASOS_KG, PASO_KG, reloj, serieInicial, seriesHechas, textoSerie, tocaSubir, ultimaVez, volumen, type EjSesion, type Sesion } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import { avisarDescanso, cancelarAvisoDescanso, pedirPermisoDescanso } from "../../lib/push";
import { Hoja, Tarjeta, btnPrimario, btnSecundario } from "../ui";
import Biblioteca, { DetalleEjercicio } from "./Biblioteca";
import CambiarEjercicio, { type OpcionesCambio } from "./CambiarEjercicio";
import { FotoEjercicio } from "./MapaMuscular";

/* Pitido al terminar el descanso (el contexto de audio se prepara en un toque, como piden los navegadores). */
let audio: AudioContext | null = null;
const prepararSonido = () => { try { audio ??= new AudioContext(); void audio.resume(); } catch { /* sin audio */ } };
function pitido() {
  if (!audio || audio.state !== "running") return;
  [0, 0.22, 0.44].forEach((t, i) => {
    const o = audio!.createOscillator(), g = audio!.createGain(), t0 = audio!.currentTime + t;
    o.frequency.value = i === 2 ? 1175 : 880;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g).connect(audio!.destination); o.start(t0); o.stop(t0 + 0.2);
  });
}

/** Todas las series marcadas. */
const completo = (e: EjSesion) => e.series.length > 0 && e.series.every((x) => x.hecha);
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
  const { editarSesion, terminarSesion, descartarSesion, setEntreno, corregirEjercicio } = useBrio();
  const entreno = useBrio((s) => s.perfil?.entreno);
  /** Ejercicios terminados que el usuario volvió a abrir (los demás terminados se ven minimizados). */
  const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
  const [cambiar, setCambiar] = useState<number | null>(null);
  const [logro, setLogro] = useState<string | null>(null);
  const yaCelebrado = useRef(new Set<string>());
  useEffect(() => { if (!logro) return; const t = setTimeout(() => setLogro(null), 3200); return () => clearTimeout(t); }, [logro]);
  const [, setTick] = useState(0);
  const [descanso, setDescanso] = useState<{ fin: number; total: number; sig?: string } | null>(null);
  const [agregar, setAgregar] = useState(false);
  const [ver, setVer] = useState<Ejercicio | null>(null);
  const [confirmar, setConfirmar] = useState<"terminar" | "cancelar" | null>(null);

  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const restante = descanso ? Math.max(0, (descanso.fin - Date.now()) / 1000) : 0;
  useEffect(() => {
    if (descanso && restante <= 0) {
      if (document.visibilityState === "visible") { try { navigator.vibrate?.([300, 120, 300, 120, 300]); } catch { /* sin vibración */ } pitido(); }
      setDescanso(null);
    }
  }, [descanso, restante]);
  // El aviso con pantalla bloqueada lo da el service worker: se reprograma si cambias el descanso (±15, saltar).
  const finDescanso = descanso?.fin;
  useEffect(() => {
    if (finDescanso && finDescanso > Date.now()) avisarDescanso(finDescanso, descanso?.sig);
    else cancelarAvisoDescanso();
  }, [finDescanso]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelarAvisoDescanso(), []);

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
    if (x.hecha) return;
    prepararSonido();
    pedirPermisoDescanso();
    const cardio = ejercicioPorId(e.ej)?.cardio;
    const termina = e.series.every((y, j) => j === si || y.hecha);
    if (termina) setAbiertos((a) => { const n = new Set(a); n.delete(ei); return n; });
    const ultimo = termina && sesion.ejercicios.every((y, j) => j === ei || completo(y));
    const otro = sesion.ejercicios.find((y, j) => j !== ei && !completo(y));
    const sig = !termina ? `${ejercicioPorId(e.ej)?.n ?? ""}, serie ${e.series.filter((y) => y.hecha).length + 2} de ${e.series.length}` : otro ? ejercicioPorId(otro.ej)?.n : undefined;
    if (!cardio && !ultimo) setDescanso({ fin: Date.now() + e.descanso * 1000, total: e.descanso, sig });
    if (ultimo) setDescanso(null);
    const msg = cardio ? null : logroSerie(sesiones, e.ej, si, x);
    if (msg && !yaCelebrado.current.has(`${e.ej}:${msg}`)) {
      yaCelebrado.current.add(`${e.ej}:${msg}`);
      setLogro(msg);
      try { navigator.vibrate?.([60, 40, 60]); } catch { /* sin vibración */ }
    }
  };
  const alternar = (ei: number) => setAbiertos((a) => { const n = new Set(a); if (n.has(ei)) n.delete(ei); else n.add(ei); return n; });
  /** Cambia el ejercicio ei por otro, conservando series, reps y descanso; opcionalmente también en la rutina y el historial. */
  const cambiarEj = (ei: number, nuevo: string, o: OpcionesCambio) => {
    const viejo = sesion.ejercicios[ei];
    if (o.historial) corregirEjercicio(viejo.ej, nuevo);
    const historial = o.historial ? useBrio.getState().sesiones : sesiones;
    editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => (i !== ei ? e : serieInicial(historial, nuevo, e.series.length, e.reps, e.descanso))) }));
    if (o.rutina && entreno && sesion.rutinaId) {
      setEntreno({ ...entreno, rutinas: entreno.rutinas.map((r) => r.id !== sesion.rutinaId ? r : {
        ...r, dias: r.dias.map((d) => d.id !== sesion.diaId ? d : { ...d, ejercicios: d.ejercicios.map((x) => (x.ej === viejo.ej ? { ...x, ej: nuevo } : x)) }),
      }) });
    }
    setAbiertos((a) => { const n = new Set(a); n.delete(ei); return n; });
    setCambiar(null);
  };
  const sumarSerie = (ei: number) => editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => i !== ei ? e : { ...e, series: [...e.series, { ...(e.series[e.series.length - 1] ?? { kg: 0, reps: 10 }), hecha: false }] }) }));
  const quitarSerie = (ei: number) => editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.map((e, i) => i !== ei || e.series.length <= 1 ? e : { ...e, series: e.series.slice(0, -1) }) }));
  const quitarEjercicio = (ei: number) => { editarSesion((s) => ({ ...s, ejercicios: s.ejercicios.filter((_, i) => i !== ei) })); setAbiertos(new Set()); };
  const agregarEj = (l: Ejercicio[]) => { editarSesion((s) => ({ ...s, ejercicios: [...s.ejercicios, ...l.map((e) => serieInicial(sesiones, e.id, e.cardio ? 1 : 3, e.cardio ? "20 min" : "10", e.cardio ? 0 : 90))] })); setAgregar(false); };
  const lugar = useBrio((s) => s.perfil?.entreno?.lugar);

  const paso = entreno?.pasoKg ?? PASO_KG;
  const setPaso = (p: number) => entreno && setEntreno({ ...entreno, pasoKg: p });
  const hechas = seriesHechas(sesion);
  const listos = sesion.ejercicios.filter(completo).length;
  const todoListo = sesion.ejercicios.length > 0 && listos === sesion.ejercicios.length;
  const transcurrido = (Date.now() - sesion.inicio) / 1000;

  return (
    <div className="pb-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="lab">Entrenando · {reloj(transcurrido)}</p>
          <h1 className="truncate font-serif text-3xl font-medium tracking-tight md:text-4xl">{sesion.nombre}</h1>
          <p className="mt-0.5 text-sm text-muted">{listos} de {sesion.ejercicios.length} ejercicios · {hechas} series · {volumen(sesion).toLocaleString("es-MX")} kg</p>
        </div>
        <button onClick={() => setConfirmar("terminar")} className="h-11 shrink-0 rounded-full bg-lime px-5 font-display text-sm font-bold uppercase tracking-[0.12em] text-on-lime">Terminar</button>
      </div>

      <AnimatePresence>
        {todoListo && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-[18px] border border-lime bg-lime/15 p-4">
            <p className="lab">Rutina completa</p>
            <p className="mt-1 font-serif text-2xl font-medium">¡Terminaste todos los ejercicios!</p>
            <p className="mt-1 text-sm text-muted">Ya no te falta nada de hoy. Toca terminar para guardar tu entreno y ver tu resumen.</p>
            <button onClick={() => { onTerminada(terminarSesion()); }} className={`${btnPrimario} mt-3 w-full`}>Terminar y guardar</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 grid items-start gap-3 lg:grid-cols-2">
        {sesion.ejercicios.map((e, ei) => {
          const info = ejercicioPorId(e.ej);
          if (!info) return null;
          if (completo(e) && !abiertos.has(ei)) return (
            <motion.button layout key={`${e.ej}-${ei}`} onClick={() => alternar(ei)} aria-expanded={false} aria-label={`${info.n}: terminado. Toca para abrir`}
              className="flex w-full items-center gap-3 rounded-[16px] border border-line bg-surface/60 px-4 py-2.5 text-left opacity-80 transition hover:opacity-100">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lime text-sm font-extrabold text-on-lime">✓</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{info.n}</span>
                <span className="num block truncate text-xs text-muted">{e.series.map(textoSerie).join(" · ")}</span>
              </span>
              <span className="lab shrink-0">Abrir</span>
            </motion.button>
          );
          const prev = ultimaVez(sesiones, e.ej);
          const subir = tocaSubir(sesiones, e.ej, e.reps, paso);
          return (
            <Tarjeta key={`${e.ej}-${ei}`} className="!p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setVer(info)} aria-label={`Ver cómo se hace ${info.n}`}><FotoEjercicio id={e.ej} size={52} /></button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setVer(info)} className="block truncate text-left font-medium hover:underline">{info.n}</button>
                  <span className="lab !tracking-[0.05em]">Objetivo: {e.series.length} × {e.reps}{info.cardio ? "" : ` · descanso ${reloj(e.descanso)}`}</span>
                </div>
                {completo(e) && <button onClick={() => alternar(ei)} className="lab shrink-0 hover:underline">Minimizar</button>}
                <button onClick={() => setCambiar(ei)} aria-label={`Cambiar ${info.n} por otro ejercicio`} className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink">Cambiar</button>
                <button onClick={() => quitarEjercicio(ei)} aria-label={`Quitar ${info.n}`} className="text-lg text-muted hover:text-ember">×</button>
              </div>
              {subir && !e.series.some((x) => x.hecha) && (
                <div className="mt-2 rounded-[10px] bg-lime/20 px-3 py-1.5 text-xs">
                  <button onClick={() => e.series.forEach((_, si) => editarSerie(ei, si, { kg: subir }))} className="w-full text-left">
                    ↑ La vez pasada llegaste al tope de reps en todas. <b>Prueba con {subir} kg</b> (toca para ponerlo).
                  </button>
                  {entreno && (
                    <span className="mt-1 flex items-center gap-1.5 text-muted">Tus pesas suben de
                      {PASOS_KG.map((p) => (
                        <button key={p} onClick={() => setPaso(p)} aria-pressed={p === paso}
                          className={`rounded-full border px-2 py-0.5 ${p === paso ? "border-lime bg-lime text-on-lime" : "border-line"}`}>{p} kg</button>
                      ))}
                    </span>
                  )}
                </div>
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

      {/* Logro */}
      <AnimatePresence>
        {logro && (
          <motion.div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.button role="status" onClick={() => setLogro(null)} aria-label={`${logro}. Toca para cerrar`}
              className="pointer-events-auto flex w-full max-w-xs flex-col items-center gap-2 rounded-[24px] bg-lime px-6 py-6 text-center text-on-lime shadow-2xl"
              initial={{ scale: 0.6, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-on-lime/10 text-3xl" aria-hidden>★</span>
              <span className="font-serif text-xl font-medium leading-snug">{logro}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <Hoja abierta={cambiar !== null} onClose={() => setCambiar(null)} titulo="Cambiar ejercicio" ancha>
        {cambiar !== null && sesion.ejercicios[cambiar] && (
          <CambiarEjercicio actual={sesion.ejercicios[cambiar].ej} lugar={lugar} conRutina={!!sesion.rutinaId}
            excluir={sesion.ejercicios.map((x) => x.ej)} onVer={setVer} onElegir={(id, o) => cambiarEj(cambiar, id, o)}
            nota={sesion.ejercicios[cambiar].series.some((x) => x.hecha) ? "Las series que ya marcaste de este ejercicio se reinician con el nuevo." : undefined} />
        )}
      </Hoja>
      <Hoja abierta={agregar} onClose={() => setAgregar(false)} titulo="Agregar ejercicio" ancha>
        <Biblioteca onElegir={agregarEj} onVer={setVer} lugar={lugar} yaAgregados={sesion.ejercicios.map((x) => x.ej)} />
      </Hoja>
      <Hoja abierta={!!ver} onClose={() => setVer(null)} titulo="Ejercicio" ancha>
        {ver && <DetalleEjercicio e={ver} />}
      </Hoja>
      <Hoja abierta={!!confirmar} onClose={() => setConfirmar(null)} titulo={confirmar === "terminar" ? "¿Terminar entreno?" : "¿Cancelar entreno?"}>
        {confirmar === "terminar" ? (
          <>
            <p className="text-sm text-muted">{hechas ? `Llevas ${hechas} series en ${formatoMin(duracionMin(sesion))}. Se guardan solo las series que marcaste.` : "No has marcado ninguna serie; no se guardará nada."}</p>
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
