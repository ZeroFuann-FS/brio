import { useState } from "react";
import { motion } from "motion/react";
import { diasEntre, hoyISO, sumarDias, type Perfil } from "../../lib/calc";
import {
  AREAS, IDEAS, NOMBRE_AREA, avance, fechaEstimadaMonto, lunes, metaDeIdea, metaNueva, nuevoPaso, rachaSemanas, sumaEntre, total,
  type AreaMeta, type Meta, type TipoMeta,
} from "../../lib/metas";
import { habitosDe, useBrio } from "../../lib/store";
import { Barra, Hoja, Tarjeta, Toast, btnPrimario, btnSecundario, ease, inputCls, useToast } from "../ui";

const SIN_METAS: Meta[] = [];
const dinero = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;
const horas = (m: number) => (m >= 60 ? `${(m / 60).toFixed(1).replace(".0", "")} h` : `${m} min`);
const fechaLarga = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
const TIPOS: { id: TipoMeta; t: string; d: string }[] = [
  { id: "pasos", t: "Pasos", d: "Una lista de cosas por lograr" },
  { id: "monto", t: "Dinero", d: "Juntar un monto" },
  { id: "tiempo", t: "Tiempo", d: "Horas a la semana" },
];

function detalle(m: Meta, hoy: string) {
  if (m.tipo === "pasos") {
    const hechos = m.pasos?.filter((p) => p.hecho).length ?? 0, sig = m.pasos?.find((p) => !p.hecho);
    return `${hechos} de ${m.pasos?.length ?? 0} pasos${sig ? ` · sigue: ${sig.t}` : ""}`;
  }
  if (m.tipo === "monto") {
    const est = fechaEstimadaMonto(m, hoy);
    return `${dinero(total(m))} de ${dinero(m.objetivo ?? 0)}${est ? ` · a este ritmo llegas el ${fechaLarga(est)}` : ""}`;
  }
  const l = lunes(hoy), r = rachaSemanas(m, hoy);
  return `${horas(sumaEntre(m, l, sumarDias(l, 6)))} de ${horas(m.objetivo ?? 0)} esta semana${r ? ` · ${r} ${r === 1 ? "semana" : "semanas"} seguidas` : ""}`;
}

function EditorMeta({ inicial, onGuardar, onBorrar, onCerrar }: { inicial: Meta; onGuardar: (m: Meta) => void; onBorrar?: () => void; onCerrar: () => void }) {
  const [m, setM] = useState<Meta>(inicial);
  const [paso, setPaso] = useState("");
  const set = <K extends keyof Meta>(k: K, v: Meta[K]) => setM((x) => ({ ...x, [k]: v }));
  const hoy = hoyISO();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {AREAS.map((a) => <button key={a.id} onClick={() => set("area", a.id)} aria-pressed={m.area === a.id}
          className={`rounded-full border px-3 py-1 text-sm ${m.area === a.id ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{a.t}</button>)}
      </div>
      <label className="block"><span className="lab mb-1 block">¿Qué quieres lograr?</span>
        <input className={inputCls} value={m.titulo} maxLength={60} placeholder="Ej. Juntar para una laptop" onChange={(e) => set("titulo", e.target.value)} /></label>
      {m.tipo !== "pasos" && (
        <label className="block"><span className="lab mb-1 block">{m.tipo === "monto" ? "Monto a juntar ($)" : "Minutos por semana"}</span>
          <input className={`${inputCls} num text-xl`} inputMode="numeric" value={m.objetivo || ""} onChange={(e) => set("objetivo", Number(e.target.value.replace(/\D/g, "")) || 0)} />
          {m.tipo === "tiempo" && !!m.objetivo && <span className="mt-1 block text-xs text-muted">≈ {horas(m.objetivo)} a la semana, unos {Math.round(m.objetivo / 5)} min al día entre semana.</span>}
        </label>
      )}
      <label className="block"><span className="lab mb-1 block">Fecha objetivo (opcional)</span>
        <input type="date" className={`${inputCls} campo-fecha`} min={hoy} value={m.fecha ?? ""} onChange={(e) => set("fecha", e.target.value || undefined)} /></label>
      {m.tipo === "pasos" && (
        <div>
          <p className="lab mb-1">Pasos</p>
          <ul>
            {(m.pasos ?? []).map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 border-b border-line py-1.5">
                <span className="num w-5 text-muted">{i + 1}</span>
                <input className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none" value={p.t} onChange={(e) => set("pasos", m.pasos!.map((x) => (x.id === p.id ? { ...x, t: e.target.value } : x)))} />
                <button onClick={() => set("pasos", m.pasos!.filter((x) => x.id !== p.id))} aria-label="Quitar paso" className="px-1 text-muted hover:text-ember">×</button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); if (paso.trim()) { set("pasos", [...(m.pasos ?? []), nuevoPaso(paso.trim())]); setPaso(""); } }} className="mt-2 flex gap-2">
            <input className={`${inputCls} py-2`} value={paso} placeholder="Agregar un paso" onChange={(e) => setPaso(e.target.value)} />
            <button className={`${btnSecundario} h-11 shrink-0 px-4`}>+</button>
          </form>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        {onBorrar && <button onClick={onBorrar} className={`${btnSecundario} text-sm text-ember`}>Borrar</button>}
        <button onClick={onCerrar} className={`${btnSecundario} flex-1`}>Cancelar</button>
        <button disabled={!m.titulo.trim() || (m.tipo === "pasos" ? !m.pasos?.length : !m.objetivo)} onClick={() => onGuardar({ ...m, titulo: m.titulo.trim() })} className={`${btnPrimario} flex-1`}>Guardar</button>
      </div>
    </div>
  );
}

function TarjetaMeta({ m, i, onEditar, onRegistrar, onPaso }: { m: Meta; i: number; onEditar: () => void; onRegistrar: (v: number) => void; onPaso: (id: string) => void }) {
  const hoy = hoyISO();
  const [abierta, setAbierta] = useState(false);
  const [otro, setOtro] = useState("");
  const a = avance(m, hoy);
  const restan = m.fecha ? diasEntre(hoy, m.fecha) : null;
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease }} className="rounded-[18px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => setAbierta((x) => !x)} className="min-w-0 flex-1 text-left">
          <span className="lab">{NOMBRE_AREA[m.area]}{restan !== null ? ` · ${restan >= 0 ? `faltan ${restan} días` : "fecha pasada"}` : ""}</span>
          <span className="mt-0.5 block font-serif text-lg font-medium leading-snug">{m.titulo}</span>
        </button>
        <span className="num text-2xl">{Math.round(a * 100)}<small className="text-sm text-muted">%</small></span>
      </div>
      <div className="mt-2"><Barra progreso={a} color="bg-lime" alto="h-2" /></div>
      <p className="mt-1.5 text-sm text-muted">{detalle(m, hoy)}</p>

      {m.tipo === "tiempo" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[15, 30, 60].map((v) => <button key={v} onClick={() => onRegistrar(v)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-lime">+{v} min</button>)}
        </div>
      )}
      {m.tipo === "monto" && (
        <form onSubmit={(e) => { e.preventDefault(); const v = Number(otro.replace(/[^\d-]/g, "")); if (v) { onRegistrar(v); setOtro(""); } }} className="mt-3 flex flex-wrap items-center gap-1.5">
          {[100, 500].map((v) => <button type="button" key={v} onClick={() => onRegistrar(v)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-lime">+{dinero(v)}</button>)}
          <input className="num h-9 w-24 rounded-full border border-line bg-bg px-3 text-sm outline-none" inputMode="numeric" placeholder="Otro" value={otro} onChange={(e) => setOtro(e.target.value)} aria-label="Otra cantidad" />
          <button className="rounded-full bg-lime px-3 py-1.5 text-sm font-semibold text-on-lime" disabled={!otro}>Agregar</button>
        </form>
      )}
      {(m.tipo === "pasos" || abierta) && m.tipo === "pasos" && (
        <ul className="mt-2">
          {(m.pasos ?? []).map((p) => (
            <li key={p.id}>
              <button onClick={() => onPaso(p.id)} className="flex w-full items-center gap-2.5 py-1.5 text-left text-sm">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] text-[11px] font-extrabold ${p.hecho ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{p.hecho ? "✓" : ""}</span>
                <span className={p.hecho ? "text-muted line-through" : ""}>{p.t}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierta && m.tipo !== "pasos" && !!m.registros?.length && (
        <ul className="mt-3 border-t border-line pt-2 text-sm">
          {[...m.registros].reverse().slice(0, 6).map((r, k) => <li key={k} className="flex justify-between py-0.5 text-muted"><span>{fechaLarga(r.fecha)}</span><span className="num">{m.tipo === "monto" ? dinero(r.v) : horas(r.v)}</span></li>)}
        </ul>
      )}
      <div className="mt-2 flex justify-between">
        {m.tipo !== "pasos" ? <button onClick={() => setAbierta((x) => !x)} className="lab hover:underline">{abierta ? "Ocultar historial" : "Ver historial"}</button> : <span />}
        <button onClick={onEditar} className="lab !text-lime-ink hover:underline">Editar</button>
      </div>
    </motion.li>
  );
}

export default function MetasCrecimiento({ perfil }: { perfil: Perfil }) {
  const metas = useBrio((s) => s.perfil?.metas) ?? SIN_METAS;
  const { setMetas, marcarHabito } = useBrio();
  const [editando, setEditando] = useState<Meta | null>(null);
  const [nueva, setNueva] = useState(false);
  const [area, setArea] = useState<AreaMeta>("aprender");
  const [toast, setToast] = useToast();
  const hoy = hoyISO();
  const activas = metas.filter((m) => !m.lograda), logradas = metas.filter((m) => m.lograda);
  const habitos = habitosDe(perfil).map((h) => h.id);

  const guardar = (m: Meta) => { setMetas(metas.some((x) => x.id === m.id) ? metas.map((x) => (x.id === m.id ? m : x)) : [...metas, m]); setEditando(null); setNueva(false); };
  const actualizar = (m: Meta, msg?: string) => {
    const completa = avance(m) >= 1 && m.tipo !== "tiempo" && !m.lograda;
    const final = completa ? { ...m, lograda: hoy } : m;
    setMetas(metas.map((x) => (x.id === m.id ? final : x)));
    setToast(completa ? `¡Lograste "${m.titulo}"! 🎉` : msg ?? "");
  };
  const registrar = (m: Meta, v: number) => {
    actualizar({ ...m, registros: [...(m.registros ?? []), { fecha: hoy, v }] }, m.tipo === "monto" ? `${v > 0 ? "+" : ""}${dinero(v)} registrado` : `+${v} min registrados`);
    const h = AREAS.find((a) => a.id === m.area)?.habito;
    if (h && habitos.includes(h) && v > 0) marcarHabito(hoy, h);
  };
  const paso = (m: Meta, id: string) => actualizar({ ...m, pasos: m.pasos!.map((p) => (p.id === id ? { ...p, hecho: p.hecho ? undefined : hoy } : p)) });

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-medium">Tus metas</h2>
          <p className="text-sm text-muted">Lo que quieres lograr además de tu cuerpo: aprender, tu carrera, tu dinero.</p>
        </div>
        <button onClick={() => setNueva(true)} className={`${btnPrimario} h-11 shrink-0 px-4`}>+ Meta</button>
      </div>

      {activas.length ? (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {activas.map((m, i) => <TarjetaMeta key={m.id} m={m} i={i} onEditar={() => setEditando(m)} onRegistrar={(v) => registrar(m, v)} onPaso={(id) => paso(m, id)} />)}
        </ul>
      ) : (
        <Tarjeta className="mt-4">
          <p className="font-serif text-lg font-medium">Aún no tienes metas aquí</p>
          <p className="mt-1 text-sm text-muted">Empieza con una idea y ajústala a ti. Lo que registres aquí también cuenta para tus hábitos de estudiar y ahorrar.</p>
          <button onClick={() => setNueva(true)} className={`${btnSecundario} mt-3 w-full`}>Ver ideas</button>
        </Tarjeta>
      )}

      {logradas.length > 0 && (
        <div className="mt-6">
          <p className="lab mb-2">Logradas · {logradas.length}</p>
          <ul className="space-y-1.5">
            {logradas.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-[14px] border border-lime/50 bg-lime/10 px-3 py-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-lime text-xs font-extrabold text-on-lime">✓</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.titulo}</span>
                <span className="lab">{fechaLarga(m.lograda!)}</span>
                <button onClick={() => setMetas(metas.map((x) => (x.id === m.id ? { ...x, lograda: undefined } : x)))} className="lab hover:underline">Reabrir</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Hoja abierta={nueva} onClose={() => setNueva(false)} titulo="Nueva meta" ancha>
        <div className="md:max-w-2xl">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {AREAS.map((a) => <button key={a.id} onClick={() => setArea(a.id)} aria-pressed={area === a.id}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm ${area === a.id ? "border-ink bg-ink text-bg dark:border-lime dark:bg-lime dark:text-on-lime" : "border-line bg-surface text-muted"}`}>{a.t}</button>)}
          </div>
          <p className="lab mb-2 mt-4">Ideas</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {IDEAS.filter((x) => x.area === area).map((x) => (
              <li key={x.titulo}><button onClick={() => { setNueva(false); setEditando(metaDeIdea(x)); }} className="h-full w-full rounded-[14px] border border-line bg-surface p-3 text-left hover:border-lime">
                <b className="block font-medium">{x.titulo}</b><span className="block text-xs text-muted">{x.desc}</span></button></li>
            ))}
            {!IDEAS.some((x) => x.area === area) && <li className="text-sm text-muted">Sin ideas para esta área; créala desde cero.</li>}
          </ul>
          <p className="lab mb-2 mt-5">O desde cero</p>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map((t) => (
              <button key={t.id} onClick={() => { setNueva(false); setEditando(metaNueva(area, t.id)); }} className="rounded-[14px] border border-dashed border-line p-3 text-left hover:border-lime">
                <b className="block text-sm font-medium">{t.t}</b><span className="block text-xs text-muted">{t.d}</span>
              </button>
            ))}
          </div>
        </div>
      </Hoja>
      <Hoja abierta={!!editando} onClose={() => setEditando(null)} titulo={editando && metas.some((x) => x.id === editando.id) ? "Editar meta" : "Tu meta"}>
        {editando && <EditorMeta key={editando.id} inicial={editando} onGuardar={guardar} onCerrar={() => setEditando(null)}
          onBorrar={metas.some((x) => x.id === editando.id) ? () => { setMetas(metas.filter((x) => x.id !== editando.id)); setEditando(null); } : undefined} />}
      </Hoja>
      <Toast texto={toast} />
    </div>
  );
}
