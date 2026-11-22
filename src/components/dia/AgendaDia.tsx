import { useState } from "react";
import { aMin, choques, explicar, hora12, horasSueno, type Evento, type TipoBloque } from "../../lib/agenda";
import { agendaDe, agendaDelDia } from "../../lib/agendaDatos";
import { hoyISO, sumarDias, type Perfil } from "../../lib/calc";
import { DIAS_CORTOS, DIAS_SEMANA, SEMANA_LD, lunesDe } from "../../lib/entreno";
import { useBrio } from "../../lib/store";

export const COLOR: Record<TipoBloque, string> = {
  dormir: "bg-t-water text-ink border-water/30",
  trabajo: "bg-surface text-ink border-line-strong",
  escuela: "bg-surface text-ink border-line-strong",
  traslado: "bg-track/70 text-muted border-line",
  gym: "bg-lime text-on-lime border-lime",
  cocinar: "bg-t-food text-ink border-lime/40",
  comer: "bg-lime/35 text-ink border-lime/60",
  bano: "bg-t-water text-ink border-water/40",
  habito: "bg-t-habit text-ink border-line",
  otro: "bg-surface text-ink border-line",
};
export const PUNTO: Record<TipoBloque, string> = {
  dormir: "bg-water", trabajo: "bg-ink dark:bg-[#f2f3f0]", escuela: "bg-ink dark:bg-[#f2f3f0]", traslado: "bg-line-strong", gym: "bg-lime",
  cocinar: "bg-fat", comer: "bg-lime/60", bano: "bg-water/70", habito: "bg-ember/70", otro: "bg-muted",
};

const duracion = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}`);

/** Reparte eventos encimados en columnas. */
function carriles(ev: Evento[]) {
  const fin: number[] = [];
  return ev.map((e) => {
    let c = fin.findIndex((f) => f <= e.inicio);
    if (c === -1) { c = fin.length; fin.push(e.fin); } else fin[c] = e.fin;
    return { e, c };
  }).map((x, _, arr) => ({ ...x, n: Math.max(...arr.filter((y) => y.e.inicio < x.e.fin && y.e.fin > x.e.inicio).map((y) => y.c)) + 1 }));
}

export default function AgendaDia({ perfil, onEditar }: { perfil: Perfil; onEditar: () => void }) {
  const menu = useBrio((s) => s.menu);
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(hoy);
  const [vista, setVistaRaw] = useState<"lista" | "horario">(() => { try { return localStorage.getItem("brio:vista-dia") === "horario" ? "horario" : "lista"; } catch { return "lista"; } });
  const setVista = (v: "lista" | "horario") => { setVistaRaw(v); try { localStorage.setItem("brio:vista-dia", v); } catch { /* sin storage */ } };
  const ev = agendaDelDia(perfil, menu, fecha);
  const ag = agendaDe(perfil);
  const visibles = ev.filter((e) => e.tipo !== "dormir");
  const ch = choques(ev);
  const desp = aMin(ag.despertar), dorm = aMin(ag.dormir);
  const ini = Math.max(0, Math.min(desp, ...visibles.map((e) => e.inicio)) - 30);
  const fin = Math.min(1440, Math.max(dorm > desp ? dorm : 1440, ...visibles.map((e) => e.fin)) + 30);
  const PX = 1.05;
  const ahora = new Date().getHours() * 60 + new Date().getMinutes();
  const lunes = lunesDe(hoy);
  const sueno = horasSueno(ag);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {SEMANA_LD.map((wd, i) => {
          const f = sumarDias(lunes, i);
          return (
            <button key={wd} onClick={() => setFecha(f)} aria-pressed={f === fecha} aria-label={DIAS_SEMANA[wd]}
              className={`num h-11 rounded-[11px] border text-[15px] uppercase ${f === fecha ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"} ${f === hoy ? "ring-2 ring-lime ring-offset-1 ring-offset-[var(--color-bg)]" : ""}`}>{DIAS_CORTOS[wd]}</button>
          );
        })}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-serif text-xl font-medium">{fecha === hoy ? "Hoy" : DIAS_SEMANA[new Date(`${fecha}T12:00:00`).getDay()]}</p>
        <div className="flex items-center gap-3">
          <div role="group" aria-label="Vista" className="flex rounded-full border border-line p-0.5 text-xs">
            {(["lista", "horario"] as const).map((v) => (
              <button key={v} aria-pressed={vista === v} onClick={() => setVista(v)}
                className={`rounded-full px-2.5 py-1 ${vista === v ? "bg-ink text-bg dark:bg-lime dark:text-on-lime" : "text-muted"}`}>{v === "lista" ? "Lista" : "Horario"}</button>
            ))}
          </div>
          <button onClick={onEditar} className="lab !text-lime-ink hover:underline">Editar horario</button>
        </div>
      </div>

      {(ch.length > 0 || sueno < 7) && (
        <div className="mt-2 space-y-1.5 rounded-[14px] border border-ember/50 bg-ember/10 p-3 text-sm">
          {sueno < 7 && <p>Duermes {sueno.toFixed(1).replace(".0", "")} h. Lo recomendado son 7–9 h para recuperarte y tener menos antojos.</p>}
          {ch.map((c, i) => <p key={i}>⚠ {explicar(c)}</p>)}
        </div>
      )}

      {vista === "lista" ? (
        <ol className="mt-3 divide-y divide-line">
          {visibles.map((e) => {
            const choca = ch.some((x) => x.a.id === e.id || x.b.id === e.id);
            const ya = fecha === hoy && ahora >= e.inicio && ahora < e.fin;
            return (
              <li key={e.id} className={`grid grid-cols-[4.6rem_1fr] gap-3 py-2.5 ${ya ? "rounded-[12px] bg-lime/10 px-2 -mx-2" : ""}`}>
                <span className="num pt-0.5 text-right text-[13px] leading-tight text-muted">{hora12(e.inicio)}<br /><span className="text-[11px] opacity-75">{duracion(e.fin - e.inicio)}</span></span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${PUNTO[e.tipo]}`} />
                    <b className={`text-[15px] font-semibold leading-tight ${choca ? "text-ember" : ""}`}>{e.titulo}</b>
                    {ya && <span className="lab !text-lime-ink">Ahora</span>}
                  </span>
                  {e.detalle && <span className="mt-0.5 block pl-[18px] text-[13px] leading-snug text-muted">{e.detalle}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
      <div className="relative mt-3" style={{ height: (fin - ini) * PX }}>
        {Array.from({ length: Math.ceil((fin - ini) / 60) + 1 }, (_, k) => Math.ceil(ini / 60) * 60 + k * 60).filter((m) => m <= fin).map((m) => (
          <div key={m} className="absolute left-0 right-0 flex items-start gap-2" style={{ top: (m - ini) * PX }}>
            <span className="num w-12 -translate-y-2 text-right text-[12px] text-muted">{hora12(m).replace(":00", "")}</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ))}
        <div className="absolute bottom-0 left-14 right-0 top-0">
          {carriles(visibles).map(({ e, c, n }) => {
            const alto = Math.max(22, (e.fin - e.inicio) * PX - 2);
            return (
              <div key={e.id} className={`absolute overflow-hidden rounded-[10px] border px-2 py-1 ${COLOR[e.tipo]} ${ch.some((x) => x.a.id === e.id || x.b.id === e.id) ? "ring-2 ring-ember" : ""}`}
                style={{ top: (e.inicio - ini) * PX + 1, height: alto, left: `${(c / n) * 100}%`, width: `calc(${100 / n}% - 4px)` }}>
                <p className="truncate text-[13px] font-semibold leading-tight">{e.titulo}</p>
                {alto > 34 && <p className="truncate text-[11px] opacity-75">{hora12(e.inicio)} – {hora12(e.fin)}{e.detalle ? ` · ${e.detalle}` : ""}</p>}
              </div>
            );
          })}
          {fecha === hoy && ahora >= ini && ahora <= fin && (
            <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: (ahora - ini) * PX }}>
              <i className="-ml-1.5 h-3 w-3 rounded-full bg-ember" /><span className="h-0.5 flex-1 bg-ember" />
            </div>
          )}
        </div>
      </div>
      )}
      <p className="mt-3 text-xs text-muted">Despiertas {hora12(desp)} · duermes {hora12(dorm)}. El gym sale de tu rutina y las comidas de tu menú (con el tiempo que toma cocinar).</p>
    </div>
  );
}
