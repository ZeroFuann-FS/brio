import { useState } from "react";
import { horasSueno, nombreTipo, type Agenda, type BloqueFijo } from "../../lib/agenda";
import { agendaDe } from "../../lib/agendaDatos";
import type { Perfil } from "../../lib/calc";
import { DIAS_SEMANA, SEMANA_LD, diaDeSemana, uidE } from "../../lib/entreno";
import { habitosDe, useBrio } from "../../lib/store";
import { SelectorSemana } from "../entreno/ElegirRutina";
import { btnPrimario, btnSecundario, inputCls } from "../ui";

function Hora({ label, valor, onCambio }: { label: string; valor: string; onCambio: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="lab mb-1 block">{label}</span>
      <input type="time" className={`${inputCls} campo-fecha py-2.5`} value={valor} onChange={(e) => onCambio(e.target.value)} />
    </label>
  );
}

const TIPOS: BloqueFijo["tipo"][] = ["trabajo", "escuela", "traslado", "otro"];

export default function EditorAgenda({ perfil, onListo }: { perfil: Perfil; onListo: () => void }) {
  const setAgenda = useBrio((s) => s.setAgenda);
  const [a, setA] = useState<Agenda>(agendaDe(perfil));
  const [nuevo, setNuevo] = useState<BloqueFijo | null>(null);
  const set = <K extends keyof Agenda>(k: K, v: Agenda[K]) => setA((x) => ({ ...x, [k]: v }));
  const r = perfil.entreno?.rutinas?.find((x) => x.id === perfil.entreno?.activa) ?? perfil.entreno?.rutinas?.[0];
  const diasGym = r ? SEMANA_LD.filter((w) => diaDeSemana(r, w)).map((w) => DIAS_SEMANA[w].slice(0, 3)) : [];
  const sueno = horasSueno(a);
  const colaciones = perfil.prefsComida?.colaciones ?? 0;

  return (
    <div className="space-y-5">
      <section>
        <p className="lab mb-2">Sueño</p>
        <div className="grid grid-cols-2 gap-2">
          <Hora label="Me despierto" valor={a.despertar} onCambio={(v) => set("despertar", v)} />
          <Hora label="Me duermo" valor={a.dormir} onCambio={(v) => set("dormir", v)} />
        </div>
        <p className={`mt-1.5 text-xs ${sueno < 7 ? "text-ember" : "text-muted"}`}>Duermes {sueno.toFixed(1).replace(".0", "")} horas{sueno < 7 ? ": menos de lo recomendado (7–9 h)." : "."}</p>
      </section>

      <section>
        <p className="lab mb-2">Trabajo, escuela y traslados</p>
        <ul className="space-y-2">
          {a.bloques.map((b) => (
            <li key={b.id} className="flex items-center gap-2 rounded-[14px] border border-line bg-surface px-3 py-2">
              <span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{b.titulo || nombreTipo(b.tipo)}</b>
                <span className="lab !tracking-[0.05em]">{b.inicio}–{b.fin} · {SEMANA_LD.filter((w) => b.dias.includes(w)).map((w) => DIAS_SEMANA[w].slice(0, 3)).join(" ")}</span></span>
              <button onClick={() => setNuevo(b)} className="rounded-full border border-line px-3 py-1 text-xs text-muted">Editar</button>
              <button onClick={() => set("bloques", a.bloques.filter((x) => x.id !== b.id))} aria-label="Quitar" className="px-1 text-lg text-muted hover:text-ember">×</button>
            </li>
          ))}
        </ul>
        {nuevo ? (
          <div className="mt-2 space-y-2 rounded-[14px] border border-lime/60 bg-lime/5 p-3">
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map((t) => (
                <button key={t} onClick={() => setNuevo({ ...nuevo, tipo: t })} aria-pressed={nuevo.tipo === t}
                  className={`rounded-full border px-3 py-1 text-sm ${nuevo.tipo === t ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{nombreTipo(t)}</button>
              ))}
            </div>
            <input className={inputCls} placeholder="Nombre (opcional): Residencia, Uni, Camión…" value={nuevo.titulo} maxLength={30} onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Hora label="Empieza" valor={nuevo.inicio} onCambio={(v) => setNuevo({ ...nuevo, inicio: v })} />
              <Hora label="Termina" valor={nuevo.fin} onCambio={(v) => setNuevo({ ...nuevo, fin: v })} />
            </div>
            <SelectorSemana valor={nuevo.dias} onCambio={(v) => setNuevo({ ...nuevo, dias: v })} />
            <div className="flex gap-2">
              <button onClick={() => setNuevo(null)} className={`${btnSecundario} flex-1`}>Cancelar</button>
              <button disabled={!nuevo.dias.length} onClick={() => { set("bloques", a.bloques.some((x) => x.id === nuevo.id) ? a.bloques.map((x) => (x.id === nuevo.id ? nuevo : x)) : [...a.bloques, nuevo]); setNuevo(null); }} className={`${btnPrimario} flex-1`}>Listo</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setNuevo({ id: uidE(), tipo: "trabajo", titulo: "", inicio: "09:00", fin: "17:00", dias: [1, 2, 3, 4, 5] })}
            className="mt-2 w-full rounded-[12px] border border-dashed border-line py-2 text-sm text-muted hover:text-ink">+ Agregar trabajo, escuela o traslado</button>
        )}
      </section>

      <section>
        <p className="lab mb-2">Gym</p>
        <div className="grid grid-cols-2 gap-2">
          <Hora label="Hora del gym" valor={a.gym.hora} onCambio={(v) => set("gym", { ...a.gym, hora: v })} />
          <label className="block"><span className="lab mb-1 block">Traslado (min)</span>
            <input className={`${inputCls} num py-2.5 text-lg`} inputMode="numeric" value={a.gym.traslado || ""} placeholder="0" onChange={(e) => set("gym", { ...a.gym, traslado: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></label>
        </div>
        <p className="mt-1.5 text-xs text-muted">{diasGym.length ? `Días: ${diasGym.join(", ")} (de tu rutina en Entreno).` : "Elige tus días de gym en Entreno para que aparezcan aquí."}</p>
      </section>

      <section>
        <p className="lab mb-2">Comidas</p>
        <div className="grid grid-cols-3 gap-2">
          <Hora label="Desayuno" valor={a.comidas.desayuno} onCambio={(v) => set("comidas", { ...a.comidas, desayuno: v })} />
          <Hora label="Comida" valor={a.comidas.comida} onCambio={(v) => set("comidas", { ...a.comidas, comida: v })} />
          <Hora label="Cena" valor={a.comidas.cena} onCambio={(v) => set("comidas", { ...a.comidas, cena: v })} />
          {colaciones >= 1 && <Hora label="Colación 1" valor={a.comidas.colacion1 ?? "11:00"} onCambio={(v) => set("comidas", { ...a.comidas, colacion1: v })} />}
          {colaciones >= 2 && <Hora label="Colación 2" valor={a.comidas.colacion2 ?? "17:30"} onCambio={(v) => set("comidas", { ...a.comidas, colacion2: v })} />}
        </div>
        <p className="mt-1.5 text-xs text-muted">Si cocinas tú, Brío aparta el tiempo de preparación de la receta antes de cada comida.</p>
      </section>

      <section>
        <p className="lab mb-2">Hábitos con hora (opcional)</p>
        <ul className="space-y-2">
          {habitosDe(perfil).map((h) => {
            const cfg = a.habitos?.[h.id];
            return (
              <li key={h.id} className="grid grid-cols-[1fr_110px_70px] items-center gap-2">
                <span className="truncate text-sm">{h.t}</span>
                <input type="time" aria-label={`Hora de ${h.t}`} className={`${inputCls} campo-fecha px-2 py-2 text-sm`} value={cfg?.hora ?? ""}
                  onChange={(e) => setA((x) => ({ ...x, habitos: { ...x.habitos, [h.id]: { hora: e.target.value, min: cfg?.min ?? 15 } } }))} />
                <input aria-label={`Minutos de ${h.t}`} inputMode="numeric" className={`${inputCls} num px-2 py-2 text-center`} placeholder="min" value={cfg?.hora ? cfg.min : ""}
                  onChange={(e) => setA((x) => ({ ...x, habitos: { ...x.habitos, [h.id]: { hora: cfg?.hora ?? "", min: Number(e.target.value.replace(/\D/g, "")) || 0 } } }))} />
              </li>
            );
          })}
        </ul>
      </section>

      <button onClick={() => { setAgenda(a); onListo(); }} className={`${btnPrimario} w-full`}>Guardar mi horario</button>
    </div>
  );
}
