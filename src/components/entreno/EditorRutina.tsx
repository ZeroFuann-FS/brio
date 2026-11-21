import { useState } from "react";
import { ejercicioPorId, type Ejercicio } from "../../data/ejercicios";
import { DIAS_SEMANA, SEMANA_LD, faltantesRutina, uidE, type Lugar, type Rutina } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import { SelectorSemana } from "./ElegirRutina";
import { Hoja, btnPrimario, btnSecundario, inputCls, chipOn } from "../ui";
import Biblioteca, { DetalleEjercicio } from "./Biblioteca";
import CambiarEjercicio from "./CambiarEjercicio";
import { FotoEjercicio } from "./MapaMuscular";

const DESCANSOS = [45, 60, 90, 120, 150, 180];

export default function EditorRutina({ inicial, onGuardar, onBorrar, lugar }: { inicial: Rutina; onGuardar: (r: Rutina) => void; onBorrar?: () => void; lugar?: Lugar }) {
  const [r, setR] = useState<Rutina>(inicial);
  const [di, setDi] = useState(0);
  const [agregar, setAgregar] = useState(false);
  const [ver, setVer] = useState<Ejercicio | null>(null);
  const [cambiar, setCambiar] = useState<number | null>(null);
  const corregirEjercicio = useBrio((s) => s.corregirEjercicio);
  const dia = r.dias[di];
  const faltan = faltantesRutina(r, lugar);
  /** Cambia el ejercicio en este día (y en los demás días de la rutina si se corrige el historial). */
  const cambiarEj = (ei: number, nuevo: string, historial: boolean) => {
    const viejo = dia.ejercicios[ei].ej;
    if (historial) {
      corregirEjercicio(viejo, nuevo);
      setR((x) => ({ ...x, dias: x.dias.map((d) => ({ ...d, ejercicios: d.ejercicios.map((e) => (e.ej === viejo ? { ...e, ej: nuevo } : e)) })) }));
    } else editarEj(ei, { ej: nuevo });
    setCambiar(null);
  };

  const editarDia = (fn: (d: Rutina["dias"][number]) => Rutina["dias"][number]) => setR((x) => ({ ...x, dias: x.dias.map((d, i) => (i === di ? fn(d) : d)) }));
  const editarEj = (ei: number, cambio: Partial<Rutina["dias"][number]["ejercicios"][number]>) => editarDia((d) => ({ ...d, ejercicios: d.ejercicios.map((e, i) => (i === ei ? { ...e, ...cambio } : e)) }));
  const mover = (ei: number, delta: number) => editarDia((d) => {
    const l = [...d.ejercicios]; const j = ei + delta;
    if (j < 0 || j >= l.length) return d;
    [l[ei], l[j]] = [l[j], l[ei]];
    return { ...d, ejercicios: l };
  });
  const nuevoDia = () => { setR((x) => ({ ...x, dias: [...x.dias, { id: uidE(), nombre: `Día ${String.fromCharCode(65 + x.dias.length)}`, ejercicios: [] }] })); setDi(r.dias.length); };
  /** Asigna días de la semana a este día de la rutina (y se los quita a los demás). */
  const setSemana = (v: number[]) => setR((x) => ({ ...x, dias: x.dias.map((d, i) => (i === di ? { ...d, semana: v } : { ...d, semana: (d.semana ?? []).filter((w) => !v.includes(w)) })) }));
  const etiqueta = (d: Rutina["dias"][number]) => (d.semana?.length ? SEMANA_LD.filter((w) => d.semana!.includes(w)).map((w) => DIAS_SEMANA[w].slice(0, 3)).join(", ") : "Sin día");
  const borrarDia = () => { if (r.dias.length <= 1) return; setR((x) => ({ ...x, dias: x.dias.filter((_, i) => i !== di) })); setDi(0); };

  return (
    <div>
      <label className="block">
        <span className="lab mb-1 block">Nombre de la rutina</span>
        <input className={inputCls} value={r.nombre} maxLength={40} onChange={(e) => setR((x) => ({ ...x, nombre: e.target.value }))} />
      </label>

      <p className="lab mb-1.5 mt-4">Días</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {r.dias.map((d, i) => (
          <button key={d.id} onClick={() => setDi(i)} aria-pressed={i === di}
            className={`shrink-0 rounded-[12px] border px-3 py-1.5 text-left text-sm ${i === di ? chipOn : "border-line bg-surface text-muted"}`}>
            <span className="block font-medium">{d.nombre || `Día ${i + 1}`}</span><span className="lab block !text-[11px] !text-current opacity-80">{etiqueta(d)}</span></button>
        ))}
        <button onClick={nuevoDia} className="shrink-0 rounded-full border border-dashed border-line px-3.5 py-1.5 text-sm text-muted">+ Día</button>
      </div>

      {dia && (
        <div className="mt-3 rounded-[16px] border border-line bg-surface p-3">
          <div className="flex gap-2">
            <input className={`${inputCls} py-2`} value={dia.nombre} maxLength={24} aria-label="Nombre del día" onChange={(e) => editarDia((d) => ({ ...d, nombre: e.target.value }))} />
            {r.dias.length > 1 && <button onClick={borrarDia} className="shrink-0 rounded-[12px] border border-line px-3 text-sm text-ember">Borrar día</button>}
          </div>
          <p className="lab mb-1.5 mt-3">¿Qué días de la semana?</p>
          <SelectorSemana valor={dia.semana ?? []} onCambio={setSemana} />
          <ul className="mt-3">
            {dia.ejercicios.map((e, ei) => {
              const info = ejercicioPorId(e.ej);
              if (!info) return null;
              return (
                <li key={`${e.ej}-${ei}`} className="border-b border-line py-2.5 last:border-b-0">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setVer(info)}><FotoEjercicio id={e.ej} size={44} /></button>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{info.n}</span>
                    <button onClick={() => setCambiar(ei)} className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink">Cambiar</button>
                    <button onClick={() => mover(ei, -1)} aria-label="Subir" className="px-1.5 text-muted disabled:opacity-30" disabled={ei === 0}>↑</button>
                    <button onClick={() => mover(ei, 1)} aria-label="Bajar" className="px-1.5 text-muted disabled:opacity-30" disabled={ei === dia.ejercicios.length - 1}>↓</button>
                    <button onClick={() => editarDia((d) => ({ ...d, ejercicios: d.ejercicios.filter((_, i) => i !== ei) }))} aria-label={`Quitar ${info.n}`} className="px-1.5 text-lg text-muted hover:text-ember">×</button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 pl-[54px]">
                    <label className="block"><span className="lab block !text-[11px]">Series</span>
                      <select className={`${inputCls} px-2 py-1.5 text-sm`} value={e.series} onChange={(x) => editarEj(ei, { series: Number(x.target.value) })}>
                        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
                      </select></label>
                    <label className="block"><span className="lab block !text-[11px]">{info.cardio ? "Tiempo" : "Reps"}</span>
                      <input className={`${inputCls} px-2 py-1.5 text-sm`} value={e.reps} maxLength={10} onChange={(x) => editarEj(ei, { reps: x.target.value })} /></label>
                    <label className="block"><span className="lab block !text-[11px]">Descanso</span>
                      <select className={`${inputCls} px-2 py-1.5 text-sm`} value={e.descanso} onChange={(x) => editarEj(ei, { descanso: Number(x.target.value) })}>
                        {DESCANSOS.map((n) => <option key={n} value={n}>{n < 60 ? `${n} s` : `${n / 60} min`}</option>)}
                      </select></label>
                  </div>
                </li>
              );
            })}
          </ul>
          {!dia.ejercicios.length && <p className="py-3 text-sm text-muted">Este día no tiene ejercicios todavía.</p>}
          <button onClick={() => setAgregar(true)} className="mt-2 w-full rounded-[12px] border border-dashed border-line py-2 text-sm text-muted hover:text-ink">+ Agregar ejercicio</button>
        </div>
      )}

      {faltan.some((f) => f.sugerido) && (
        <div className="mt-3 rounded-[16px] border border-dashed border-line p-3">
          <p className="lab">Sugerencias · músculos con pocas series a la semana</p>
          <ul className="mt-1">
            {faltan.filter((f) => f.sugerido).map((f) => (
              <li key={f.grupo} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                <button onClick={() => setVer(f.sugerido!)} aria-label={`Ver ${f.sugerido!.n}`}><FotoEjercicio id={f.sugerido!.id} size={40} /></button>
                <span className="min-w-0 flex-1 text-sm"><b className="font-medium">{f.grupo}</b> <span className="text-muted">· {f.series} series</span>
                  <span className="block truncate text-xs text-muted">{f.sugerido!.n}</span></span>
                {dia && <button onClick={() => editarDia((d) => ({ ...d, ejercicios: [...d.ejercicios, { ej: f.sugerido!.id, series: 3, reps: "10-12", descanso: 90 }] }))}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-line-strong">+ A {dia.nombre || "este día"}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {onBorrar && <button onClick={onBorrar} className={`${btnSecundario} text-sm text-ember`}>Borrar rutina</button>}
        <button onClick={() => onGuardar({ ...r, nombre: r.nombre.trim() || "Mi rutina" })} disabled={!r.dias.some((d) => d.ejercicios.length)} className={`${btnPrimario} flex-1`}>Guardar rutina</button>
      </div>

      <Hoja abierta={agregar} onClose={() => setAgregar(false)} titulo="Agregar ejercicio" ancha>
        <Biblioteca onVer={setVer} lugar={lugar} yaAgregados={dia?.ejercicios.map((x) => x.ej)} onElegir={(l) => { editarDia((d) => ({ ...d, ejercicios: [...d.ejercicios, ...l.map((e) => ({ ej: e.id, series: e.cardio ? 1 : 3, reps: e.cardio ? "20 min" : "10-12", descanso: e.cardio ? 60 : 90 }))] })); setAgregar(false); }} />
      </Hoja>
      <Hoja abierta={cambiar !== null} onClose={() => setCambiar(null)} titulo="Cambiar ejercicio" ancha>
        {cambiar !== null && dia?.ejercicios[cambiar] && (
          <CambiarEjercicio actual={dia.ejercicios[cambiar].ej} lugar={lugar} excluir={dia.ejercicios.map((x) => x.ej)} onVer={setVer}
            onElegir={(id, o) => cambiarEj(cambiar, id, o.historial)} />
        )}
      </Hoja>
      <Hoja abierta={!!ver} onClose={() => setVer(null)} titulo="Ejercicio" ancha>
        {ver && <DetalleEjercicio e={ver} />}
      </Hoja>
    </div>
  );
}
