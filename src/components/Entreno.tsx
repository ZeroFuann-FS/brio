import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ejercicioPorId, type Ejercicio } from "../data/ejercicios";
import { PLANTILLAS, rutinaDePlantilla } from "../data/plantillas";
import { duracionMin, entrenosSemana, mejorMarca, nuevaSesion, seriesHechas, seriesPorMusculo, siguienteDia, uidE, volumen, type Rutina, type Sesion } from "../lib/entreno";
import { useBrio } from "../lib/store";
import EditorRutina from "./entreno/EditorRutina";
import Biblioteca, { DetalleEjercicio } from "./entreno/Biblioteca";
import MapaMuscular, { FotoEjercicio } from "./entreno/MapaMuscular";
import SesionActiva from "./entreno/SesionActiva";
import { Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, ease, useToast } from "./ui";

const SIN_RUTINAS: Rutina[] = [];
const fechaCorta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });

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
      <ul className="mt-3">
        {s.ejercicios.map((e, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
            <FotoEjercicio id={e.ej} size={40} />
            <span className="min-w-0 flex-1 truncate text-sm">{ejercicioPorId(e.ej)?.n}</span>
            <span className="num text-sm text-muted">{e.series.map((x) => (x.min ? `${x.min}′` : `${x.kg}×${x.reps}`)).join(" · ")}</span>
          </li>
        ))}
      </ul>
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
  const [plantillas, setPlantillas] = useState(false);
  const [biblioteca, setBiblioteca] = useState(false);
  const [ver, setVer] = useState<Ejercicio | null>(null);
  const [resumen, setResumen] = useState<Sesion | null>(null);
  const [diaElegido, setDiaElegido] = useState<string | null>(null);

  const zonas = useMemo(() => seriesPorMusculo(sesiones), [sesiones]);
  const siguiente = rutina ? siguienteDia(rutina, sesiones) : undefined;
  const dia = rutina?.dias.find((d) => d.id === diaElegido) ?? siguiente;
  const semana = entrenosSemana(sesiones);

  const guardarRutina = (r: Rutina) => {
    const existe = rutinas.some((x) => x.id === r.id);
    setEntreno({ rutinas: existe ? rutinas.map((x) => (x.id === r.id ? r : x)) : [...rutinas, r], activa: existe ? perfil?.entreno?.activa ?? r.id : r.id });
    setEditando(null);
    setToast("Rutina guardada");
  };
  const borrarRutina = (id: string) => {
    const resto = rutinas.filter((x) => x.id !== id);
    setEntreno({ rutinas: resto, activa: resto[0]?.id });
    setEditando(null);
  };
  const empezar = (r?: Rutina, d?: Rutina["dias"][number]) => iniciarSesion(nuevaSesion(sesiones, r, d));

  if (activa) return <SesionActiva onTerminada={(s) => { if (s) setResumen(s); else setToast("Entreno cancelado"); }} />;

  const recientes = [...sesiones].reverse().slice(0, 8);
  const records = [...new Set([...sesiones].reverse().flatMap((s) => s.records ?? []))].slice(0, 6);

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
                <p className="lab truncate">{rutina.nombre}</p>
                <button onClick={() => setEditando(rutina)} className="lab shrink-0 !text-lime-ink hover:underline">Editar</button>
              </div>
              <h2 className="mt-1 font-serif text-2xl font-medium">{dia.id === siguiente?.id ? "Te toca: " : ""}{dia.nombre}</h2>
              <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {rutina.dias.map((d) => (
                  <button key={d.id} onClick={() => setDiaElegido(d.id)} aria-pressed={d.id === dia.id}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${d.id === dia.id ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>{d.nombre}</button>
                ))}
              </div>
              <ul className="mt-2">
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
              <button onClick={() => empezar(rutina, dia)} className={`${btnPrimario} mt-4 w-full`}>Empezar entreno</button>
              <button onClick={() => empezar()} className="mt-2 w-full text-center text-sm text-muted hover:text-ink">o entreno libre</button>
            </>
          ) : (
            <>
              <p className="lab">Empieza aquí</p>
              <h2 className="mt-1 font-serif text-2xl font-medium">Elige una rutina</h2>
              <p className="mt-1 text-sm text-muted">Usa una plantilla (la puedes cambiar a tu gusto) o arma la tuya desde cero.</p>
              <ul className="mt-3 space-y-2">
                {PLANTILLAS.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setEditando(rutinaDePlantilla(p, uidE))} className="w-full rounded-[16px] border border-line bg-surface p-3.5 text-left hover:border-line-strong">
                      <span className="flex items-baseline justify-between gap-2"><b className="font-medium">{p.nombre}</b><span className="lab shrink-0">{p.nivel}</span></span>
                      <span className="mt-0.5 block text-sm text-muted">{p.desc}</span>
                      <span className="lab mt-1.5 block !tracking-[0.05em]">{p.lugar} · {p.dias.map((d) => d.nombre).join(" / ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditando({ id: uidE(), nombre: "Mi rutina", dias: [{ id: uidE(), nombre: "Día A", ejercicios: [] }] })} className={`${btnSecundario} flex-1`}>Crear la mía</button>
                <button onClick={() => empezar()} className={`${btnSecundario} flex-1`}>Entreno libre</button>
              </div>
            </>
          )}
        </Tarjeta>

        {/* Semana y mapa muscular */}
        <Tarjeta delay={0.05} className="min-w-0 md:col-span-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium">Tu semana</h2>
            <span className="lab">{semana} {semana === 1 ? "entreno" : "entrenos"} · 7 días</span>
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
          ) : <p className="mt-2 text-sm text-muted">Tus entrenos aparecerán aquí. Cada vez que repitas un ejercicio, Brío te muestra lo que hiciste la vez anterior.</p>}
        </Tarjeta>

        {/* Rutinas y biblioteca */}
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
                <button onClick={() => setPlantillas(true)} className="lab !text-lime-ink hover:underline">+ Nueva</button>
              </div>
              <ul className="mt-2">
                {rutinas.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 border-b border-line py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1"><b className="block truncate font-medium">{r.nombre}</b><span className="lab !tracking-[0.05em]">{r.dias.length} días · {r.dias.map((d) => d.nombre).join(" / ")}</span></span>
                    {r.id === rutina?.id ? <span className="lab !text-lime-ink">En uso</span> : <button onClick={() => setEntreno({ rutinas, activa: r.id })} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Usar</button>}
                    <button onClick={() => setEditando(r)} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-ink">Editar</button>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          )}
          <Tarjeta delay={0.16}>
            <h2 className="font-serif text-xl font-medium">Ejercicios</h2>
            <p className="mt-1 text-sm text-muted">Cómo se hace cada uno, con animación y los músculos que trabaja.</p>
            <button onClick={() => setBiblioteca(true)} className={`${btnSecundario} mt-3 w-full`}>Ver los ejercicios</button>
          </Tarjeta>
        </div>
      </div>

      <Hoja abierta={!!editando} onClose={() => setEditando(null)} titulo={editando && rutinas.some((x) => x.id === editando.id) ? "Editar rutina" : "Nueva rutina"} ancha>
        {editando && <div className="md:max-w-2xl"><EditorRutina key={editando.id} inicial={editando} onGuardar={guardarRutina} onBorrar={rutinas.some((x) => x.id === editando.id) ? () => borrarRutina(editando.id) : undefined} /></div>}
      </Hoja>
      <Hoja abierta={plantillas} onClose={() => setPlantillas(false)} titulo="Nueva rutina">
        <ul className="space-y-2">
          {PLANTILLAS.map((p) => (
            <li key={p.id}><button onClick={() => { setPlantillas(false); setEditando(rutinaDePlantilla(p, uidE)); }} className="w-full rounded-[14px] border border-line bg-surface p-3 text-left">
              <b className="font-medium">{p.nombre}</b><span className="block text-xs text-muted">{p.lugar} · {p.nivel}</span></button></li>
          ))}
          <li><button onClick={() => { setPlantillas(false); setEditando({ id: uidE(), nombre: "Mi rutina", dias: [{ id: uidE(), nombre: "Día A", ejercicios: [] }] }); }} className="w-full rounded-[14px] border border-dashed border-line p-3 text-left text-sm">Desde cero</button></li>
        </ul>
      </Hoja>
      <Hoja abierta={biblioteca} onClose={() => setBiblioteca(false)} titulo="Ejercicios" ancha>
        <Biblioteca onVer={setVer} />
      </Hoja>
      <Hoja abierta={!!ver} onClose={() => setVer(null)} titulo="Ejercicio" ancha>
        {ver && <DetalleEjercicio e={ver} />}
      </Hoja>
      <Hoja abierta={!!resumen} onClose={() => setResumen(null)} titulo={resumen && sesiones[sesiones.length - 1]?.id === resumen.id && Date.now() - (resumen.fin ?? 0) < 60000 ? "¡Entreno terminado!" : resumen?.nombre ?? ""}>
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
