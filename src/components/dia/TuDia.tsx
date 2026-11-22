import { useState } from "react";
import { aMin, choques, explicar, hora12, horasSueno } from "../../lib/agenda";
import { agendaDe, agendaDelDia } from "../../lib/agendaDatos";
import { diasEntre, hoyISO, type Perfil } from "../../lib/calc";
import { useBrio } from "../../lib/store";
import { proximoPagoISO } from "../../../supabase/functions/_shared/avisos";
import { Hoja, Tarjeta, btnPrimario, btnSecundario } from "../ui";
import AgendaDia, { PUNTO } from "./AgendaDia";
import EditorAgenda from "./EditorAgenda";
import Recordatorios from "./Recordatorios";

/** Aviso del pago del gym en Hoy (3 días antes y mientras siga pendiente). */
export function AvisoPago({ perfil, className = "" }: { perfil: Perfil; className?: string }) {
  const setRec = useBrio((s) => s.setRecordatorios);
  const p = perfil.recordatorios?.pago;
  if (!p?.activo || !p.dia) return null;
  const hoy = hoyISO();
  const fecha = proximoPagoISO(p, hoy);
  const dias = diasEntre(hoy, fecha);
  if (dias > 3) return null;
  const cuando = dias < 0 ? `venció hace ${-dias} ${dias === -1 ? "día" : "días"}` : dias === 0 ? "es hoy" : dias === 1 ? "es mañana" : `es en ${dias} días`;
  return (
    <div className={`flex items-center gap-3 rounded-[18px] border px-4 py-3 ${dias < 0 ? "border-ember/60 bg-ember/10" : "border-lime/60 bg-lime/10"} ${className}`}>
      <span className="min-w-0 flex-1 text-sm"><b className="font-medium">Pago del gym {cuando}</b>{p.monto ? ` · $${p.monto.toLocaleString("es-MX")}` : ""}</span>
      <button onClick={() => setRec({ ...perfil.recordatorios, pago: { ...p, pagadoHasta: fecha.slice(0, 7) } })} className="shrink-0 rounded-full bg-lime px-3.5 py-1.5 text-sm font-semibold text-on-lime">Ya pagué</button>
    </div>
  );
}

export default function TuDia({ perfil, className = "", delay = 0, tour }: { perfil: Perfil; className?: string; delay?: number; tour?: string }) {
  const menu = useBrio((s) => s.menu);
  const [vista, setVista] = useState<"dia" | "editar" | "avisos" | null>(null);
  const hoy = hoyISO();
  const ev = agendaDelDia(perfil, menu, hoy);
  const ag = agendaDe(perfil);
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  const despierto = ev.filter((e) => e.tipo !== "dormir");
  const actual = despierto.find((e) => e.inicio <= ahora && e.fin > ahora);
  const siguiente = despierto.find((e) => e.inicio > ahora);
  const ch = choques(ev);
  const desp = aMin(ag.despertar), dorm = aMin(ag.dormir) > desp ? aMin(ag.dormir) : 1440;
  const sueno = horasSueno(ag);
  const configurado = !!perfil.agenda;
  const avisosOn = Object.values(perfil.recordatorios ?? {}).some((x) => (x as { activo?: boolean })?.activo);

  return (
    <>
      <Tarjeta delay={delay} className={className} tour={tour}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-serif text-xl font-medium">Tu día</h2>
          <div className="flex gap-3">
            <button onClick={() => setVista("avisos")} className="lab hover:underline">{avisosOn ? "Avisos ✓" : "Avisos"}</button>
            {configurado && <button onClick={() => setVista("dia")} className="lab !text-lime-ink hover:underline">Ver mi día →</button>}
          </div>
        </div>
        {!configurado ? (
          <>
            <p className="mt-1 text-sm text-muted">Dime a qué hora despiertas, trabajas, vas al gym y comes. Brío arma tu día, aparta tiempo para cocinar y te avisa si algo choca.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setVista("editar")} className={`${btnPrimario} flex-1`}>Armar mi horario</button>
              <button onClick={() => setVista("avisos")} className={`${btnSecundario} flex-1`}>Activar avisos</button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[14px] border border-line bg-bg/40 px-3 py-2">
                <p className="lab">Ahora</p>
                <p className="truncate font-medium">{actual ? actual.titulo : ahora < desp || ahora >= dorm ? "Hora de descansar" : "Tiempo libre"}</p>
                {actual && <p className="lab !tracking-[0.05em]">hasta {hora12(actual.fin)}</p>}
              </div>
              <div className="rounded-[14px] border border-line bg-bg/40 px-3 py-2">
                <p className="lab">Después</p>
                <p className="truncate font-medium">{siguiente ? siguiente.titulo : "Dormir"}</p>
                <p className="lab !tracking-[0.05em]">{siguiente ? `${hora12(siguiente.inicio)}${siguiente.detalle ? ` · ${siguiente.detalle}` : ""}` : hora12(aMin(ag.dormir))}</p>
              </div>
            </div>
            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-track" aria-hidden>
              {despierto.map((e) => (
                <i key={e.id} className={`absolute top-0 h-full ${PUNTO[e.tipo]}`} style={{ left: `${((Math.max(e.inicio, desp) - desp) / (dorm - desp)) * 100}%`, width: `${((Math.min(e.fin, dorm) - Math.max(e.inicio, desp)) / (dorm - desp)) * 100}%` }} />
              ))}
              {ahora > desp && ahora < dorm && <i className="absolute top-0 h-full w-0.5 bg-ember" style={{ left: `${((ahora - desp) / (dorm - desp)) * 100}%` }} />}
            </div>
            <div className="mt-1 flex justify-between"><span className="lab !text-[11px]">{hora12(desp)}</span><span className="lab !text-[11px]">{hora12(aMin(ag.dormir))}</span></div>
            {(ch.length > 0 || sueno < 7) && (
              <button onClick={() => setVista("dia")} className="mt-2 w-full rounded-[12px] border border-ember/50 bg-ember/10 px-3 py-2 text-left text-sm">
                ⚠ {ch.length ? explicar(ch[0]) : `Duermes ${sueno.toFixed(1).replace(".0", "")} h; lo ideal son 7–9 h.`}{ch.length > 1 ? ` (+${ch.length - 1} más)` : ""}
              </button>
            )}
          </>
        )}
      </Tarjeta>

      <Hoja abierta={vista === "dia"} onClose={() => setVista(null)} titulo="Mi día" media>
        <div><AgendaDia perfil={perfil} onEditar={() => setVista("editar")} /></div>
      </Hoja>
      <Hoja abierta={vista === "editar"} onClose={() => setVista(null)} titulo="Mi horario" media>
        <div><EditorAgenda perfil={perfil} onListo={() => setVista("dia")} /></div>
      </Hoja>
      <Hoja abierta={vista === "avisos"} onClose={() => setVista(null)} titulo="Avisos" media>
        <div><Recordatorios perfil={perfil} /></div>
      </Hoja>
    </>
  );
}
