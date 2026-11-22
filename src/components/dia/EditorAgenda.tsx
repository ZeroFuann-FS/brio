import { useState } from "react";
import { horasSueno, nombreTipo, type Actividad, type Agenda, type BloqueFijo, type Compra, type Momento, type Pasos, type TipoComidaAgenda } from "../../lib/agenda";
import { agendaDe } from "../../lib/agendaDatos";
import type { Perfil } from "../../lib/calc";
import { DIAS_SEMANA, SEMANA_LD, diaDeSemana, uidE } from "../../lib/entreno";
import { habitosDe, useBrio } from "../../lib/store";
import { SelectorSemana } from "../entreno/ElegirRutina";
import { btnPrimario, btnSecundario, inputCls, chipOn } from "../ui";

function Hora({ label, valor, onCambio }: { label: string; valor: string; onCambio: (v: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="lab mb-1 block">{label}</span>
      <input type="time" className={`${inputCls} campo-fecha py-2.5`} value={valor} onChange={(e) => onCambio(e.target.value)} />
    </label>
  );
}

const TIPOS: BloqueFijo["tipo"][] = ["trabajo", "escuela", "traslado", "otro"];
const CUANDO_BANO = [["despertar", "Al despertar"], ["gym", "Después del gym"], ["noche", "En la noche"]] as const;
const MOMENTOS: [Momento, string][] = [["manana", "Mañana"], ["tarde", "Tarde"], ["noche", "Noche"]];
const soloNum = (v: string) => Number(v.replace(/\D/g, "")) || 0;

function Minutos({ label, valor, onCambio }: { label: string; valor: number | undefined; onCambio: (v: number) => void }) {
  return (
    <label className="block"><span className="lab mb-1 block">{label}</span>
      <input className={`${inputCls} num py-2.5 text-lg`} inputMode="numeric" value={valor || ""} placeholder="0" onChange={(e) => onCambio(soloNum(e.target.value))} /></label>
  );
}

/** Bloque con lista de pasos (antes del gym, antes de salir). */
function EditorPasos({ titulo, ayuda, valor, ejemplo, onCambio }: { titulo: string; ayuda: string; valor?: Pasos; ejemplo: string[]; onCambio: (v: Pasos | undefined) => void }) {
  const [paso, setPaso] = useState("");
  const v = valor ?? { min: 0, pasos: [] };
  const agregar = () => { const t = paso.trim(); if (t) { onCambio({ ...v, pasos: [...v.pasos, t].slice(0, 12) }); setPaso(""); } };
  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="lab">{titulo}</p>
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
          <input aria-label={`Minutos: ${titulo}`} inputMode="numeric" className={`${inputCls} num !w-16 px-2 py-1.5 text-center`} placeholder="0" value={v.min || ""}
            onChange={(e) => { const min = soloNum(e.target.value); onCambio(min || v.pasos.length ? { ...v, min } : undefined); }} /> min
        </label>
      </div>
      <p className="mb-2 text-xs text-muted">{ayuda}</p>
      <ul className="flex flex-wrap gap-1.5">
        {v.pasos.map((p, i) => (
          <li key={`${p}-${i}`} className="flex items-center gap-1 rounded-full border border-line bg-surface py-1 pl-3 pr-1.5 text-sm">
            {p}<button aria-label={`Quitar ${p}`} onClick={() => onCambio({ ...v, pasos: v.pasos.filter((_, j) => j !== i) })} className="px-1 text-muted hover:text-ember">×</button>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); agregar(); }}>
        <input className={`${inputCls} py-2 text-sm`} placeholder={`Ej. ${ejemplo.join(", ")}`} maxLength={40} value={paso} onChange={(e) => setPaso(e.target.value)} />
        <button type="submit" disabled={!paso.trim()} className={`${btnSecundario} px-4`}>+</button>
      </form>
    </section>
  );
}

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
                  className={`rounded-full border px-3 py-1 text-sm ${nuevo.tipo === t ? chipOn : "border-line bg-surface text-muted"}`}>{nombreTipo(t)}</button>
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
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Minutos label="Cardio extra (min)" valor={a.gym.extra} onCambio={(v) => set("gym", { ...a.gym, extra: v })} />
          <Minutos label="Descanso al llegar (min)" valor={a.llegada} onCambio={(v) => set("llegada", v || undefined)} />
        </div>
        <p className="mt-1.5 text-xs text-muted">{diasGym.length ? `Días: ${diasGym.join(", ")} (de tu rutina en Entreno). El cardio (caminadora) se suma al tiempo de tu rutina.` : "Elige tus días de gym en Entreno para que aparezcan aquí."}</p>
      </section>

      <EditorPasos titulo="Antes del gym" ayuda="Lo que haces al despertar antes de irte. Termina justo cuando sales al gym."
        valor={a.preGym} ejemplo={["Tenis", "Café preentreno"]} onCambio={(v) => set("preGym", v)} />

      <EditorPasos titulo="Antes de salir" ayuda="Lo que haces antes de irte al trabajo o la escuela. Termina justo cuando sales (agrega tu traslado arriba)."
        valor={a.salida} ejemplo={["Lonchera", "Mochila", "Trastes"]} onCambio={(v) => set("salida", v)} />

      <Compras valor={a.compras ?? []} onCambio={(v) => set("compras", v)} />

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
        <p className="lab mb-1">¿Qué cocinas en la mañana?</p>
        <p className="mb-2 text-xs text-muted">Lo que elijas se prepara junto en un solo bloque antes del desayuno; lo demás te lo llevas hecho (por ejemplo, a la residencia).</p>
        <div className="flex flex-wrap gap-1.5">
          {(["desayuno", "comida", ...(colaciones ? ["colacion"] : []), "cena"] as TipoComidaAgenda[]).map((t) => {
            const on = a.cocinaManana?.includes(t) ?? false;
            return (
              <button key={t} aria-pressed={on} onClick={() => set("cocinaManana", on ? (a.cocinaManana ?? []).filter((x) => x !== t) : [...(a.cocinaManana ?? []), t])}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? chipOn : "border-line bg-surface text-muted"}`}>{t === "colacion" ? "Colaciones" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="lab mb-2">Baño</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {CUANDO_BANO.map(([k, t]) => {
            const on = a.bano?.cuando === k;
            return (
              <button key={k} aria-pressed={on} onClick={() => set("bano", on ? undefined : { min: a.bano?.min || 20, cuando: k })}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? chipOn : "border-line bg-surface text-muted"}`}>{t}</button>
            );
          })}
          {a.bano && (
            <label className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-muted">
              <input aria-label="Minutos de baño" inputMode="numeric" className={`${inputCls} num !w-16 px-2 py-1.5 text-center`} value={a.bano.min || ""}
                onChange={(e) => set("bano", { ...a.bano!, min: Number(e.target.value.replace(/\D/g, "")) || 0 })} /> min
            </label>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted">Brío lo acomoda solo en el primer hueco libre.</p>
      </section>

      <TiempoParaTi valor={a.actividades ?? []} onCambio={(v) => set("actividades", v)} />

      <section>
        <p className="lab mb-2">Hábitos con hora (opcional)</p>
        <ul className="space-y-2">
          {habitosDe(perfil).map((h) => {
            const cfg = a.habitos?.[h.id];
            return (
              <li key={h.id} className="grid grid-cols-[1fr_110px_70px] items-center gap-2">
                <span className="min-w-0 text-sm"><span className="block truncate">{h.t}</span>
                  {h.id === "entreno" && diasGym.length > 0 && <span className="lab block !tracking-[0.04em]">Los días de gym ya cuenta tu gym</span>}</span>
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

/** Actividades flexibles (leer, llamada, aprender…): Brío las acomoda en un hueco libre. */
function TiempoParaTi({ valor, onCambio }: { valor: Actividad[]; onCambio: (v: Actividad[]) => void }) {
  const [nueva, setNueva] = useState<Actividad | null>(null);
  const momento = (m: Momento) => MOMENTOS.find((x) => x[0] === m)?.[1].toLowerCase();
  return (
    <section>
      <p className="lab mb-1">Tiempo para ti</p>
      <p className="mb-2 text-xs text-muted">Leer, una llamada, aprender algo… Dime cuánto tiempo y en qué parte del día; Brío lo acomoda en un hueco libre.</p>
      <ul className="space-y-2">
        {valor.map((x) => (
          <li key={x.id} className="flex items-center gap-2 rounded-[14px] border border-line bg-surface px-3 py-2">
            <span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{x.titulo}</b>
              <span className="lab !tracking-[0.05em]">{x.min} min · en la {momento(x.cuando)} · {x.dias.length === 7 ? "diario" : SEMANA_LD.filter((w) => x.dias.includes(w)).map((w) => DIAS_SEMANA[w].slice(0, 3)).join(" ")}</span></span>
            <button onClick={() => setNueva(x)} className="rounded-full border border-line px-3 py-1 text-xs text-muted">Editar</button>
            <button onClick={() => onCambio(valor.filter((y) => y.id !== x.id))} aria-label={`Quitar ${x.titulo}`} className="px-1 text-lg text-muted hover:text-ember">×</button>
          </li>
        ))}
      </ul>
      {nueva ? (
        <div className="mt-2 space-y-2 rounded-[14px] border border-lime/60 bg-lime/5 p-3">
          <input className={inputCls} placeholder="Ej. Llamada con mi novia, Leer, Aprender inglés" maxLength={40} value={nueva.titulo} onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })} />
          <div className="flex flex-wrap items-center gap-1.5">
            {MOMENTOS.map(([k, t]) => (
              <button key={k} aria-pressed={nueva.cuando === k} onClick={() => setNueva({ ...nueva, cuando: k })}
                className={`rounded-full border px-3 py-1.5 text-sm ${nueva.cuando === k ? chipOn : "border-line bg-surface text-muted"}`}>{t}</button>
            ))}
            <label className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-muted">
              <input aria-label="Minutos" inputMode="numeric" className={`${inputCls} num !w-16 px-2 py-1.5 text-center`} value={nueva.min || ""} onChange={(e) => setNueva({ ...nueva, min: soloNum(e.target.value) })} /> min
            </label>
          </div>
          <SelectorSemana valor={nueva.dias} onCambio={(v) => setNueva({ ...nueva, dias: v })} />
          <div className="flex gap-2">
            <button onClick={() => setNueva(null)} className={`${btnSecundario} flex-1`}>Cancelar</button>
            <button disabled={!nueva.titulo.trim() || !nueva.min || !nueva.dias.length}
              onClick={() => { onCambio(valor.some((y) => y.id === nueva.id) ? valor.map((y) => (y.id === nueva.id ? nueva : y)) : [...valor, nueva]); setNueva(null); }}
              className={`${btnPrimario} flex-1`}>Listo</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setNueva({ id: uidE(), titulo: "", min: 30, cuando: "noche", dias: [0, 1, 2, 3, 4, 5, 6] })}
          className="mt-2 w-full rounded-[12px] border border-dashed border-line py-2 text-sm text-muted hover:text-ink">+ Agregar tiempo para ti</button>
      )}
    </section>
  );
}

/** Compras con día fijo: el súper de la semana, pasar por verduras… */
function Compras({ valor, onCambio }: { valor: Compra[]; onCambio: (v: Compra[]) => void }) {
  const cambiar = (id: string, c: Partial<Compra>) => onCambio(valor.map((x) => (x.id === id ? { ...x, ...c } : x)));
  return (
    <section>
      <p className="lab mb-1">Compras</p>
      <p className="mb-2 text-xs text-muted">El súper de la semana o pasar rápido por verduras. Si ese día vas al gym, va saliendo de ahí; si no, en la tarde.</p>
      <ul className="space-y-2">
        {valor.map((c) => (
          <li key={c.id} className="space-y-2 rounded-[14px] border border-line bg-surface p-3">
            <div className="flex items-center gap-2">
              <input aria-label="Qué compras" className={`${inputCls} py-2 text-sm`} maxLength={30} value={c.titulo} onChange={(e) => cambiar(c.id, { titulo: e.target.value })} />
              <label className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
                <input aria-label={`Minutos: ${c.titulo}`} inputMode="numeric" className={`${inputCls} num !w-16 px-2 py-2 text-center`} value={c.min || ""} onChange={(e) => cambiar(c.id, { min: soloNum(e.target.value) })} /> min
              </label>
              <button onClick={() => onCambio(valor.filter((x) => x.id !== c.id))} aria-label={`Quitar ${c.titulo}`} className="px-1 text-lg text-muted hover:text-ember">×</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEMANA_LD.map((w) => (
                <button key={w} aria-pressed={c.dia === w} onClick={() => cambiar(c.id, { dia: w })}
                  className={`rounded-full border px-2.5 py-1 text-sm ${c.dia === w ? chipOn : "border-line bg-surface text-muted"}`}>{DIAS_SEMANA[w].slice(0, 3)}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <button onClick={() => onCambio([...valor, { id: uidE(), titulo: valor.length ? "Pasar por verduras" : "Súper de la semana", dia: valor.length ? 1 : 0, min: valor.length ? 10 : 30 }])}
        className="mt-2 w-full rounded-[12px] border border-dashed border-line py-2 text-sm text-muted hover:text-ink">+ Agregar compra</button>
    </section>
  );
}
