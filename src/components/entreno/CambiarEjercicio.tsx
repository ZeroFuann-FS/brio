import { useState } from "react";
import { NOMBRE_MUSCULO, ejercicioPorId, type Ejercicio } from "../../data/ejercicios";
import { alternativas, esRecomendado, type Lugar } from "../../lib/entreno";
import { useBrio } from "../../lib/store";
import Biblioteca from "./Biblioteca";
import { FotoEjercicio } from "./MapaMuscular";

export interface OpcionesCambio { historial: boolean; rutina: boolean }

/**
 * Cambia un ejercicio por otro: primero los parecidos (mismo músculo, los mejores arriba) y, si no está, el catálogo.
 * `conRutina` muestra la opción de cambiarlo también en la rutina (útil durante el entreno).
 */
export default function CambiarEjercicio({ actual, lugar, excluir = [], conRutina = false, nota, onElegir, onVer }: {
  actual: string; lugar?: Lugar; excluir?: string[]; conRutina?: boolean; nota?: string;
  onElegir: (id: string, o: OpcionesCambio) => void; onVer?: (e: Ejercicio) => void;
}) {
  const info = ejercicioPorId(actual);
  const yaHecho = useBrio((s) => s.sesiones.some((x) => x.ejercicios.some((e) => e.ej === actual)));
  const [catalogo, setCatalogo] = useState(false);
  const [historial, setHistorial] = useState(false);
  const [rutina, setRutina] = useState(true);
  const lista = alternativas(actual, lugar, excluir);
  const elegir = (id: string) => onElegir(id, { historial, rutina: conRutina && rutina });

  return (
    <div>
      {info && (
        <div className="flex items-center gap-3 rounded-[14px] border border-line bg-surface p-3">
          <FotoEjercicio id={actual} size={44} />
          <span className="min-w-0 flex-1"><span className="lab block">Cambiar</span><span className="block truncate font-medium">{info.n}</span></span>
        </div>
      )}
      {nota && <p className="mt-2 text-xs text-muted">{nota}</p>}

      <div className="mt-3 space-y-2 text-sm">
        {conRutina && (
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={rutina} onChange={(e) => setRutina(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-lime)]" />
            <span>Cambiarlo también en mi rutina <span className="block text-xs text-muted">Así la próxima vez ya aparece el nuevo.</span></span>
          </label>
        )}
        {yaHecho && (
          <label className="flex items-start gap-2.5">
            <input type="checkbox" checked={historial} onChange={(e) => setHistorial(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-lime)]" />
            <span>Me equivoqué de ejercicio: corregir mi historial <span className="block text-xs text-muted">Tus entrenos pasados de {info?.n ?? "este ejercicio"} (pesos, récords y "la vez pasada") pasan al nuevo.</span></span>
          </label>
        )}
      </div>

      {!catalogo ? (
        <>
          <p className="lab mb-1.5 mt-4">Parecidos · {info ? NOMBRE_MUSCULO[info.m[0]] : ""}</p>
          {lista.length ? (
            <ul>
              {lista.map((e) => (
                <li key={e.id} className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
                  <button onClick={() => onVer?.(e)} aria-label={`Cómo se hace ${e.n}`}><FotoEjercicio id={e.id} size={44} /></button>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.n}</span>
                    <span className="lab !tracking-[0.04em]">{e.eq}</span>
                    {esRecomendado(e.id) && <span className="ml-1.5 rounded-full bg-lime px-2 py-0.5 align-middle text-[10px] font-semibold text-on-lime">Recomendado</span>}
                  </span>
                  <button onClick={() => elegir(e.id)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-line-strong">Usar</button>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">No hay parecidos con tu equipo; búscalo en el catálogo.</p>}
          <button onClick={() => setCatalogo(true)} className="mt-3 w-full rounded-[12px] border border-dashed border-line py-2 text-sm text-muted hover:text-ink">¿No está? Buscar en todo el catálogo</button>
        </>
      ) : (
        <div className="mt-4">
          <button onClick={() => setCatalogo(false)} className="lab mb-2 hover:underline">← Ver parecidos</button>
          <Biblioteca uno lugar={lugar} onVer={onVer} yaAgregados={excluir} onElegir={(l) => l[0] && elegir(l[0].id)} />
        </div>
      )}
    </div>
  );
}
