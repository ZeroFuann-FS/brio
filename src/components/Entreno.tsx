import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ejercicioPorId, type Ejercicio } from "../data/ejercicios";
import { hoyISO, sumarDias } from "../lib/calc";
import {
  DIAS_CORTOS, DIAS_SEMANA, SEMANA_LD, duracionMin, lunesDe, mejorMarca, minutosDia, nuevaSesion, planHoy,
  seriesHechas, seriesPorMusculo, siguienteDia, tieneSemana, volumen, type Lugar, type Rutina, type Sesion,
} from "../lib/entreno";
import { useBrio } from "../lib/store";
import EditorRutina from "./entreno/EditorRutina";
import ElegirRutina from "./entreno/ElegirRutina";
import Biblioteca, { DetalleEjercicio } from "./entreno/Biblioteca";
import MapaMuscular, { FotoEjercicio } from "./entreno/MapaMuscular";
import SesionActiva from "./entreno/SesionActiva";
import { Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, ease, useToast } from "./ui";

const SIN_RUTINAS: Rutina[] = [];
const fechaCorta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
/** Etiqueta corta para la semana: "Cuerpo completo A" → "A", "Torso A" → "TA", "Empuje" → "Empu". */
const iniciales = (n: string) => {
  const w = n.trim().split(/\s+/), ult = w[w.length - 1];
  if (w.length > 1 && ult.length === 1) return (w.length > 2 || /casa/i.test(n) ? "" : w[0][0].toUpperCase()) + ult.toUpperCase();
  return w[0].slice(0, 4);
};

function Resumen({ s }: { s: Sesion }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 rounded-[16px] border border-line bg-surface p-3 text-center">
        <div><p className="lab">Tiempo</p><p className="num text-3xl">{duracionMin(s)}<small className="text-sm text-muted"> min</small></p></div>
        <div><p className="lab">Series</p><p className="num text-3xl">{seriesHechas(s)}</p></div>
        <div><p className="lab">Volumen</p><p className="num text-3xl">{volumen(s).toLocaleString("es-MX")}<small className="text-sm text-muted"> kg</small></p></div>
      </div>
      {!!s.records?.length && (
        <div className="mt-3 rounded-[16px] border border-lime bg-lime/15 p-3">
          <p className="lab">¡Nuevos récords!</p>
          <ul className="mt-1 text-sm">
            {s.records.map((id) => {
              const e = s.ejercicios.find((x) => x.ej === id);
              const mejor = e?.series.reduce((a, x) => (x.kg * (1 + x.reps / 30) > a.kg * (1 + a.reps / 30) ? x : a), e.series[0]);
              return <li key={id} className="flex justify-between py-0.5"><span>{ejercicioPorId(id)?.n}</span><b className="num">{mejor?.kg} kg × {mejor?.reps}</b></li>;
            })}
          </ul>
        </div>
      )}
      <div className="mt-3 grid grid-cols-[1fr_96px] items-center gap-3">
        <ul>
          {s.ejercicios.map((e, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
              <FotoEjercicio id={e.ej} size={40} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm">{ejercicioPorId(e.ej)?.n}</span>
                <span className="num text-xs text-muted">{e.series.map((x) => (x.min ? `${x.min}′` : `${x.kg}×${x.reps}`)).join(" · ")}</span></span>
            </li>
          ))}
        </ul>
        <MapaMuscular zonas={seriesPorMusculo([s], 9999)} mini />
      </div>
    </div>
  );
}

export default function Entreno() {
  const perfil = useBrio((s) => s.perfil);
  const sesiones = useBrio((s) => s.sesiones);
  const activa = useBrio((s) => s.sesionActiva);
  const { setEntreno, iniciarSesion, borrarSesion } = useBrio();
  const rutinas = perfil?.entreno?.rutinas ?? SIN_RUTINAS;
  const rutina = rutinas.find((r) => r.id === perfil?.entreno?.activa) ?? rutinas[0];
  const [toast, setToast] = useToast();
  const [editando, setEditando] = useState<Rutina | null>(null);
  const [asistente, setAsistente] = useState(false);
  const [lugarNuevo, setLugarNuevo] = useState<Lugar | undefined>(perfil?.entreno?.lugar);
  const [biblioteca, setBiblioteca] = useState(false);
  const [ver, setVer] = useState<Ejercicio | null>(null);
  const [resumen, setResumen] = useState<Sesion | null>(null);
  const [diaElegido, setDiaElegido] = useState<string | null>(null);

  const zonas = useMemo(() => seriesPorMusculo(sesiones), [sesiones]);
  const hoy = hoyISO();
  const conSemana = !!rutina && tieneSemana(rutina);
  const ph = rutina && conSemana ? planHoy(rutina, sesiones, hoy) : null;
  const sugerido = ph ? (ph.deHoy && !ph.hechoHoy ? ph.deHoy : ph.proximo?.dia) : rutina ? siguienteDia(rutina, sesiones) : undefined;
  const dia = rutina?.dias.find((d) => d.id === diaElegido) ?? sugerido;
  const fechasSemana = SEMANA_LD.map((wd, i) => ({ wd, fecha: sumarDias(lunesDe(hoy), i) }));
  const hechasSemana = fechasSemana.filter((f) => sesiones.some((s) => s.fecha === f.fecha)).length;
  const metaSemana = rutina && conSemana ? rutina.dias.reduce((a, d) => a + (d.semana?.length ?? 0), 0) : perfil?.diasEntreno || 3;
  const lugar = perfil?.entreno?.lugar;

  const elegirListo = (r: Rutina, l: Lugar) => { setLugarNuevo(l); setAsistente(false); setEditando(r); };
  const guardarRutina = (r: Rutina) => {
    const existe = rutinas.some((x) => x.id === r.id);
    setEntreno({ rutinas: existe ? rutinas.map((x) => (x.id === r.id ? r : x)) : [...rutinas, r], activa: existe ? perfil?.entreno?.activa ?? r.id : r.id, lugar: lugarNuevo ?? lugar });
    setEditando(null); setDiaElegido(null);
    setToast("Rutina guardada");
  };
  const borrarRutina = (id: string) => {
    const resto = rutinas.filter((x) => x.id !== id);
    setEntreno({ ...perfil?.entreno, rutinas: resto, activa: resto[0]?.id });
    setEditando(null);
  };
  const empezar = (r?: Rutina, d?: Rutina["dias"][number]) => iniciarSesion(nuevaSesion(sesiones, r, d));

  if (activa) return <SesionActiva onTerminada={(s) => { if (s) setResumen(s); else setToast("Entreno cancelado"); }} />;

  const recientes = [...sesiones].reverse().slice(0, 8);
  const records = [...new Set([...sesiones].reverse().flatMap((s) => s.records ?? []))].slice(0, 6);
  const titulo = !dia ? "" : diaElegido ? dia.nombre : ph ? (ph.hechoHoy ? "Hoy ya entrenaste" : ph.deHoy ? `Hoy: ${ph.deHoy.nombre}` : "Hoy descansas") : `Te toca: ${dia.nombre}`;

  return (
    <div>
      <h1 className="font-serif text-4xl font-medium tracking-tight">Entreno</h1>
      <p className="mt-1.5 text-muted">Tus rutinas, tus series y lo que trabajaste en la semana.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
        {/* Empezar */}
        <Tarjeta tono="habit" className="min-w-0 md:col-span-7">
          {rutina && dia ? (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <p className="lab truncate">{rutina.nombre} · {hechasSemana} de {metaSemana} esta semana</p>
                <button onClick={() => setEditando(rutina)} className="lab shrink-0 !text-lime-ink hover:underline">Editar</button>
              </div>
              {conSemana && (
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {fechasSemana.map(({ wd, fecha }) => {
                    const d = rutina.dias.find((x) => x.semana?.includes(wd));
                    const hecho = sesiones.some((x) => x.fecha === fecha);
                    const esHoy = fecha === hoy;
                    const sel = !!d && d.id === dia.id && (diaElegido ? true : esHoy || wd === ph?.proximo?.wd);
                    return (
                      <button key={wd} onClick={() => d && setDiaElegido(d.id)} disabled={!d && !hecho} aria-label={`${DIAS_SEMANA[wd]}: ${d ? d.nombre : "descanso"}${hecho ? ", entrenaste" : ""}`}
                        className={`relative flex h-[58px] flex-col items-center justify-center gap-1 rounded-[12px] border transition ${hecho ? "border-lime bg-lime text-on-lime" : sel ? "border-ink bg-ink text-bg dark:border-lime dark:bg-transparent dark:text-ink" : d ? "border-line bg-surface" : "border-dashed border-line/70 text-muted/70"}`}>
                        <span className="num text-[15px] uppercase leading-none">{DIAS_CORTOS[wd]}</span>
                        <span className="text-[10px] font-semibold leading-none">{hecho ? "✓" : d ? iniciales(d.nombre) : "desc."}</span>
                        {esHoy && <i className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-lime ring-2 ring-[var(--color-t-habit)]" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <h2 className="mt-4 font-serif text-2xl font-medium">{titulo}</h2>
              {!diaElegido && ph && (ph.hechoHoy || !ph.deHoy) && ph.proximo && (
                <p className="text-sm text-muted">Próximo: {DIAS_SEMANA[ph.proximo.wd].toLowerCase()} · {ph.proximo.dia.nombre}. {ph.hechoHoy ? "Descansar también es parte del progreso." : "Si quieres, puedes adelantarlo."}</p>
              )}
              {(diaElegido || !ph || (ph.deHoy && !ph.hechoHoy)) ? null : <p className="lab mt-3">Así se ve {DIAS_SEMANA[ph.proximo?.wd ?? 0].toLowerCase()}</p>}
              <p className="lab mt-1">{dia.ejercicios.length} ejercicios · ~{minutosDia(dia)} min</p>
              <ul className="mt-1">
                {dia.ejercicios.map((e, i) => {
                  const info = ejercicioPorId(e.ej);
                  if (!info) return null;
                  const m = mejorMarca(sesiones, e.ej);
                  return (
                    <motion.li key={`${dia.id}-${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ease }}
                      className="border-b border-line last:border-b-0">
                      <button onClick={() => setVer(info)} className="flex w-full items-center gap-3 py-2 text-left">
                        <FotoEjercicio id={e.ej} size={44} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{info.n}</span><span className="lab !tracking-[0.05em]">{e.series} × {e.reps}{m && !info.cardio ? ` · récord ${m.kg} kg × ${m.reps}` : ""}</span></span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
              <button onClick={() => empezar(rutina, dia)} className={`${btnPrimario} mt-4 w-full`}>{ph && !diaElegido && (!ph.deHoy || ph.hechoHoy) ? "Entrenar de todos modos" : "Empezar entreno"}</button>
              <div className="mt-2 flex justify-center gap-5 text-sm text-muted">
                {diaElegido && <button onClick={() => setDiaElegido(null)} className="hover:text-ink">Volver a hoy</button>}
                <button onClick={() => empezar()} className="hover:text-ink">Entreno libre</button>
              </div>
            </>
          ) : (
            <>
              <p className="lab">Empieza aquí</p>
              <h2 className="mt-1 font-serif text-2xl font-medium">Encuentra tu rutina</h2>
              <p className="mb-4 mt-1 text-sm text-muted">Contesta 3 preguntas y elige qué días entrenas. Después la puedes cambiar a tu gusto.</p>
              <ElegirRutina diasIniciales={perfil?.diasEntreno ?? 3} lugarInicial={lugar} onListo={elegirListo} />
              <button onClick={() => empezar()} className="mt-3 w-full text-center text-sm text-muted hover:text-ink">o haz un entreno libre</button>
            </>
          )}
        </Tarjeta>

        {/* Semana y mapa muscular */}
        <Tarjeta delay={0.05} className="min-w-0 md:col-span-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium">Músculos de la semana</h2>
            <span className="lab">7 días</span>
          </div>
          <div className="mt-3"><MapaMuscular zonas={zonas} /></div>
        </Tarjeta>

        {/* Historial */}
        <Tarjeta delay={0.1} className="min-w-0 md:col-span-7">
          <h2 className="font-serif text-xl font-medium">Historial</h2>
          {recientes.length ? (
            <ul className="mt-2">
              {recientes.map((s) => (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <button onClick={() => setResumen(s)} className="flex w-full items-center gap-3 py-2.5 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.nombre}{s.records?.length ? <span className="ml-2 rounded-full bg-lime px-2 py-0.5 align-middle text-[11px] text-on-lime">{s.records.length} récord{s.records.length > 1 ? "s" : ""}</span> : null}</span>
                      <span className="lab !tracking-[0.05em]">{fechaCorta(s.fecha)} · {duracionMin(s)} min · {seriesHechas(s)} series · {volumen(s).toLocaleString("es-MX")} kg</span>
                    </span>
                    <span className="lab">Ver →</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted">Tus entrenos aparecerán aquí. Cada vez que repitas un ejercicio, Brío te muestra lo que hiciste la vez anterior y te avisa cuándo subir de peso.</p>}
        </Tarjeta>

        <div className="min-w-0 space-y-3 md:col-span-5">
          {records.length > 0 && (
            <Tarjeta delay={0.12}>
              <h2 className="font-serif text-xl font-medium">Récords recientes</h2>
              <ul className="mt-2">
                {records.map((id) => {
                  const m = mejorMarca(sesiones, id);
                  return <li key={id} className="flex items-center gap-3 border-b border-line py-2 text-sm last:border-b-0"><FotoEjercicio id={id} size={36} /><span className="flex-1">{ejercicioPorId(id)?.n}</span><b className="num text-base">{m?.kg} kg × {m?.reps}</b></li>;
                })}
              </ul>
            </Tarjeta>
          )}
          {rutinas.length > 0 && (
            <Tarjeta delay={0.14}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-xl font-medium">Mis rutinas</h2>
                <button onClick={() => setAsistente(true)} className="lab !text-lime-ink hover:underline">+ Nueva</button>
              </div>
              <ul className="mt-2">
                {rutinas.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1"><b className="block truncate font-medium">{r.nombre}</b>
                      <span className="lab !tracking-[0.05em]">{tieneSemana(r) ? SEMANA_LD.filter((w) => r.dias.some((d) => d.semana?.includes(w))).map((w) => DIAS_SEMANA[w].slice(0, 3)).join(" · ") : `${r.dias.length} días`}</span></span>
                    {r.id === rutina?.id ? <span className="lab !text-lime-ink">En uso</span> : <button onClick={() => setEntreno({ ...perfil?.entreno, rutinas, activa: r.id })} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Usar</button>}
                    <button onClick={() => setEditando(r)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Editar</button>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
          <Tarjeta delay={0.16}>
            <h2 className="font-serif text-xl font-medium">Catálogo de ejercicios</h2>
            <p className="mt-1 text-sm text-muted">Más de 160 ejercicios con animación, técnica, músculos y video.</p>
            <div className="mt-3 flex -space-x-2">{["press-banca", "sentadilla", "dominadas", "hip-thrust", "curl-mancuernas", "plancha"].map((id) => <FotoEjercicio key={id} id={id} size={40} />)}</div>
            <button onClick={() => setBiblioteca(true)} className={`${btnSecundario} mt-3 w-full`}>Ver el catálogo</button>
          </Tarjeta>
        </div>
      </div>

      <Hoja abierta={!!editando} onClose={() => setEditando(null)} titulo={editando && rutinas.some((x) => x.id === editando.id) ? "Editar rutina" : "Revisa tu rutina"} ancha>
        {editando && <div className="md:max-w-2xl"><EditorRutina key={editando.id} inicial={editando} lugar={lugarNuevo ?? lugar} onGuardar={guardarRutina} onBorrar={rutinas.some((x) => x.id === editando.id) ? () => borrarRutina(editando.id) : undefined} /></div>}
      </Hoja>
      <Hoja abierta={asistente} onClose={() => setAsistente(false)} titulo="Nueva rutina" ancha>
        {asistente && <ElegirRutina diasIniciales={perfil?.diasEntreno ?? 3} lugarInicial={lugar} onListo={elegirListo} />}
      </Hoja>
      <Hoja abierta={biblioteca} onClose={() => setBiblioteca(false)} titulo="Catálogo de ejercicios" ancha>
        <Biblioteca onVer={setVer} lugar={lugar} />
      </Hoja>
      <Hoja abierta={!!ver} onClose={() => setVer(null)} titulo="Ejercicio" ancha>
        {ver && <DetalleEjercicio e={ver} />}
      </Hoja>
      <Hoja abierta={!!resumen} onClose={() => setResumen(null)} titulo={resumen && Date.now() - (resumen.fin ?? 0) < 60000 ? "¡Entreno terminado!" : resumen?.nombre ?? ""}>
        {resumen && (
          <>
            <Resumen s={resumen} />
            <button onClick={() => { borrarSesion(resumen.id); setResumen(null); setToast("Entreno borrado"); }} className="mt-4 w-full text-center text-sm text-muted hover:text-ember">Borrar este entreno</button>
          </>
        )}
      </Hoja>
      <Toast texto={toast} />
    </div>
  );
}
