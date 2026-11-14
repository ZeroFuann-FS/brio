import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { calcularMetas, fechaCorta, hoyISO, pesoEnFecha, type DiaADia, type Habito, type Perfil, type Ritmo, type Sexo } from "../lib/calc";
import { CATALOGO_HABITOS, MAX_HABITOS, habitosDe } from "../lib/store";
import { Numero, btnPrimario, ease, inputCls } from "./ui";
import Logo from "./Logo";
import Proyeccion from "./Proyeccion";

type Borrador = {
  nombre: string; sexo: Sexo | ""; edad: string; estatura: string; peso: string; meta: string;
  diaADia: DiaADia | ""; diasEntreno: number; ritmo: Ritmo; habitos: Habito[]; nuevoHabito: string; motivoTitulo: string; motivoFecha: string;
};

const MOTIVOS = ["Graduación", "Viaje", "Boda", "Cumpleaños", "Vacaciones", "Una competencia"];

const num = (s: string) => Number(s.replace(",", "."));

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition ${activa ? "border-lime bg-lime/10" : "border-line bg-surface hover:border-muted"}`}
    >
      {children}
    </motion.button>
  );
}

function Campo({ label, sufijo, ...props }: { label: string; sufijo?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input className={inputCls} {...props} />
        {sufijo && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">{sufijo}</span>}
      </div>
    </label>
  );
}

export default function Onboarding({ inicial, onDone }: { inicial?: Perfil | null; onDone: (p: Perfil) => void }) {
  const [b, setB] = useState<Borrador>({
    nombre: inicial?.nombre ?? "",
    sexo: inicial?.sexo ?? "",
    edad: inicial ? String(inicial.edad) : "",
    estatura: inicial ? String(inicial.estatura) : "",
    peso: inicial ? String(inicial.pesoInicial) : "",
    meta: inicial ? String(inicial.pesoMeta) : "",
    diaADia: inicial?.diaADia ?? "",
    diasEntreno: inicial?.diasEntreno ?? 3,
    ritmo: inicial?.ritmo ?? 0.75,
    habitos: habitosDe(inicial ?? null),
    nuevoHabito: "",
    motivoTitulo: inicial?.motivo?.titulo ?? "",
    motivoFecha: inicial?.motivo?.fecha ?? "",
  });
  const [paso, setPaso] = useState(0);
  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) => setB((x) => ({ ...x, [k]: v }));

  const base = useMemo(() => {
    if (!b.sexo || !b.diaADia || !(num(b.peso) > 0) || !(num(b.meta) > 0)) return null;
    return { sexo: b.sexo, edad: num(b.edad), estatura: num(b.estatura), pesoInicial: num(b.peso), pesoMeta: num(b.meta), diaADia: b.diaADia, diasEntreno: b.diasEntreno };
  }, [b]);

  const metasPor = (ritmo: Ritmo) => (base ? calcularMetas({ ...base, ritmo }, base.pesoInicial) : null);
  const metas = metasPor(b.ritmo);
  const perder = base ? base.pesoInicial > base.pesoMeta : true;

  const toggleHabito = (h: Habito) =>
    setB((x) => {
      const tiene = x.habitos.some((y) => y.id === h.id);
      if (!tiene && x.habitos.length >= MAX_HABITOS) return x;
      return { ...x, habitos: tiene ? x.habitos.filter((y) => y.id !== h.id) : [...x.habitos, h] };
    });
  const agregarPropio = () => {
    const t = b.nuevoHabito.trim();
    if (!t || b.habitos.length >= MAX_HABITOS) return;
    setB((x) => ({ ...x, habitos: [...x.habitos, { id: `p-${Date.now()}`, e: "✨", t }], nuevoHabito: "" }));
  };
  const propios = b.habitos.filter((h) => !CATALOGO_HABITOS.some((c) => c.id === h.id));

  const pasos: { id: string; titulo: string; sub?: string; valido: boolean; cuerpo: ReactNode }[] = [
    {
      id: "nombre",
      titulo: "¿Cómo te llamo?",
      sub: "Así te va a saludar Brío.",
      valido: b.nombre.trim().length > 0,
      cuerpo: <Campo label="Tu nombre o apodo" value={b.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej. Alex" autoFocus maxLength={30} />,
    },
    {
      id: "datos",
      titulo: "Tus datos base",
      sub: "Los usamos solo para calcular tu gasto de energía (fórmula Mifflin-St Jeor).",
      valido: !!b.sexo && num(b.edad) >= 14 && num(b.edad) <= 90 && num(b.estatura) >= 120 && num(b.estatura) <= 220,
      cuerpo: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Opcion activa={b.sexo === "h"} onClick={() => set("sexo", "h")}>🙋‍♂️ Hombre</Opcion>
            <Opcion activa={b.sexo === "m"} onClick={() => set("sexo", "m")}>🙋‍♀️ Mujer</Opcion>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Edad" sufijo="años" inputMode="numeric" value={b.edad} onChange={(e) => set("edad", e.target.value)} placeholder="22" />
            <Campo label="Estatura" sufijo="cm" inputMode="numeric" value={b.estatura} onChange={(e) => set("estatura", e.target.value)} placeholder="163" />
          </div>
        </div>
      ),
    },
    {
      id: "peso",
      titulo: "Tu peso",
      sub: "Si no tienes báscula hoy, pon el último que recuerdes. Luego lo actualizas.",
      valido: num(b.peso) >= 30 && num(b.peso) <= 300 && num(b.meta) >= 30 && num(b.meta) <= 300,
      cuerpo: (
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Peso actual" sufijo="kg" inputMode="decimal" value={b.peso} onChange={(e) => set("peso", e.target.value)} placeholder="86.4" />
          <Campo label="Peso meta" sufijo="kg" inputMode="decimal" value={b.meta} onChange={(e) => set("meta", e.target.value)} placeholder="65" />
        </div>
      ),
    },
    {
      id: "dia",
      titulo: "Tu día a día",
      sub: "Con esto estimamos cuánta energía gastas al día.",
      valido: !!b.diaADia,
      cuerpo: (
        <div className="space-y-3">
          {([
            ["sentado", "🪑 Casi todo el día sentado", "Escuela, oficina, compu"],
            ["de-pie", "🚶 De pie o caminando seguido", "Tienda, maestro, mesero"],
            ["fisico", "💪 Trabajo físico", "Carga, obra, campo"],
          ] as const).map(([id, t, d]) => (
            <Opcion key={id} activa={b.diaADia === id} onClick={() => set("diaADia", id)}>
              <p className="font-medium">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </Opcion>
          ))}
          <p className="pt-2 text-sm text-muted">¿Cuántos días entrenas por semana?</p>
          <div className="grid grid-cols-8 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("diasEntreno", n)}
                className={`h-11 rounded-xl border font-display font-bold transition ${b.diasEntreno === n ? "border-lime bg-lime text-bg" : "border-line bg-surface"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "ritmo",
      titulo: perder ? "¿A qué ritmo quieres bajar?" : "Tu ritmo",
      sub: perder ? "Nunca más de 1 % de tu peso por semana: así cuidas tu músculo y no rebotas." : "Brío ajusta tus calorías a tu meta.",
      valido: true,
      cuerpo: (
        <div className="space-y-3">
          {([
            [0.5, "🌱 Tranquilo", "Fácil de sostener"],
            [0.75, "⚡ Recomendado", "Buen balance entre avance y energía"],
            [1, "🔥 Intenso", "Más rápido, pide más disciplina"],
          ] as const).map(([r, t, d]) => {
            const m = metasPor(r);
            return (
              <Opcion key={r} activa={b.ritmo === r} onClick={() => set("ritmo", r)}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-sm text-muted">{d}</p>
                  </div>
                  {m && perder && (
                    <div className="text-right">
                      <p className="whitespace-nowrap font-display font-bold">{m.kcal} kcal</p>
                      <p className="whitespace-nowrap text-xs text-muted">−{m.kgSemana.toFixed(2)} kg/sem</p>
                    </div>
                  )}
                </div>
              </Opcion>
            );
          })}
          {base && perder && (
            <div key={b.ritmo} className="rounded-2xl border border-line bg-surface p-3">
              <Proyeccion datos={{ ...base, ritmo: b.ritmo }} pesoActual={base.pesoInicial} alto={150} />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "habitos",
      titulo: "Tus hábitos",
      sub: "Elige los que quieres construir. Cada día que cumplas la mayoría suma a tu racha 🔥",
      valido: b.habitos.length > 0,
      cuerpo: (
        <div className="space-y-2">
          {[...CATALOGO_HABITOS, ...propios].map((h) => {
            const activo = b.habitos.some((y) => y.id === h.id);
            return (
              <Opcion key={h.id} activa={activo} onClick={() => toggleHabito(h)}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{h.e}</span>
                  <span className="flex-1">{h.t}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border text-sm font-bold ${activo ? "border-lime bg-lime text-bg" : "border-line"}`}>{activo ? "✓" : ""}</span>
                </div>
              </Opcion>
            );
          })}
          <div className="flex gap-2 pt-2">
            <input className={inputCls} placeholder="Agregar uno propio" value={b.nuevoHabito} maxLength={40}
              onChange={(e) => set("nuevoHabito", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarPropio(); } }} />
            <button type="button" onClick={agregarPropio} disabled={!b.nuevoHabito.trim() || b.habitos.length >= MAX_HABITOS} className={`${btnPrimario} shrink-0`}>+</button>
          </div>
          <p className="text-xs text-muted">{b.habitos.length}/{MAX_HABITOS} elegidos · el agua se cuenta sola con tu meta diaria.</p>
        </div>
      ),
    },
    {
      id: "motivo",
      titulo: "¿Qué te motiva?",
      sub: "Opcional. Una fecha que te importe: Brío te la recuerda cada día.",
      valido: !b.motivoTitulo.trim() || !!b.motivoFecha,
      cuerpo: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button key={m} type="button" onClick={() => set("motivoTitulo", b.motivoTitulo === m ? "" : m)}
                className={`rounded-full border px-3.5 py-2 text-sm transition ${b.motivoTitulo === m ? "border-lime bg-lime/10 text-ink" : "border-line bg-surface text-muted"}`}>
                {m}
              </button>
            ))}
          </div>
          <Campo label="O escribe el tuyo" value={b.motivoTitulo} onChange={(e) => set("motivoTitulo", e.target.value)} placeholder="Ej. Mi graduación" maxLength={40} />
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted">Fecha</span>
            <input type="date" className={`${inputCls} campo-fecha`} min={hoyISO()} value={b.motivoFecha} onChange={(e) => set("motivoFecha", e.target.value)} />
          </label>
        </div>
      ),
    },
    {
      id: "resumen",
      titulo: `Listo, ${b.nombre.trim() || "crack"} ⚡`,
      sub: "Esto es lo que Brío calculó para ti:",
      valido: true,
      cuerpo: metas && base ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["🔥", "Calorías", metas.kcal, "kcal"],
              ["🥩", "Proteína", metas.proteina, "g"],
              ["💧", "Agua", metas.aguaMl / 1000, "L"],
              ["⚖️", perder ? "Bajarás al inicio" : "Ritmo", Math.abs(metas.kgSemana), "kg/sem"],
            ].map(([e, t, v, u], i) => (
              <motion.div
                key={t as string}
                className="rounded-2xl border border-line bg-surface p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.1, ease }}
              >
                <p className="text-sm text-muted">{e} {t}</p>
                <p className="mt-1 font-display text-2xl font-bold">
                  <Numero valor={v as number} decimales={u === "L" ? 1 : u === "kg/sem" ? 2 : 0} /> <span className="text-sm font-medium text-muted">{u}</span>
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div className="rounded-2xl border border-line bg-surface p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, ease }}>
            <p className="text-sm text-muted">⚡ Tu gasto de energía</p>
            <div className="mt-2 flex items-center justify-between gap-2 text-center">
              <div><p className="font-display text-lg font-bold"><Numero valor={metas.tdee} /></p><p className="text-[11px] text-muted">gastas al día</p></div>
              <span className="text-muted">−</span>
              <div><p className="font-display text-lg font-bold"><Numero valor={metas.kcal} /></p><p className="text-[11px] text-muted">comerás</p></div>
              <span className="text-muted">=</span>
              <div><p className={`font-display text-lg font-bold ${perder ? "text-lime" : "text-ember"}`}><Numero valor={Math.abs(metas.tdee - metas.kcal)} /></p><p className="text-[11px] text-muted">{perder ? "de déficit" : "de superávit"}</p></div>
            </div>
          </motion.div>
          {metas.fechaEstimada && (
            <motion.div className="rounded-2xl border border-line bg-surface p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, ease }}>
              <p className="mb-2 text-sm text-muted">📉 Así cambiaría tu peso</p>
              <Proyeccion datos={{ ...base, ritmo: b.ritmo }} pesoActual={base.pesoInicial}
                motivo={b.motivoTitulo.trim() && b.motivoFecha ? { titulo: b.motivoTitulo.trim(), fecha: b.motivoFecha } : undefined} />
            </motion.div>
          )}
          {metas.fechaEstimada && (
            <motion.p className="rounded-2xl bg-lime/10 p-4 text-sm leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              A este ritmo llegas a <b>{base.pesoMeta} kg</b> alrededor del <b className="text-lime">{fechaCorta(metas.fechaEstimada)}</b>.
              {b.motivoTitulo && b.motivoFecha && (
                <> Para tu <b>{b.motivoTitulo.trim()}</b> ({fechaCorta(b.motivoFecha)}) estarías en ~<b>{pesoEnFecha({ ...base, ritmo: b.ritmo }, base.pesoInicial, b.motivoFecha).toFixed(1)} kg</b>.</>
              )}
            </motion.p>
          )}
          {metas.limitadoPorMinimo && (
            <p className="text-xs text-ember">Ajustamos tus calorías al mínimo seguro. No bajamos de ahí.</p>
          )}
          <p className="text-xs text-muted">Son estimaciones: al bajar de peso tu cuerpo gasta menos, por eso la curva se va suavizando. Brío las ajusta con tu peso real. No sustituye a un profesional de la salud.</p>
        </div>
      ) : null,
    },
  ];

  const actual = pasos[paso];
  const ultimo = paso === pasos.length - 1;

  const terminar = () => {
    if (!base) return;
    onDone({
      nombre: b.nombre.trim(),
      sexo: base.sexo,
      edad: base.edad,
      estatura: base.estatura,
      pesoInicial: base.pesoInicial,
      pesoMeta: base.pesoMeta,
      diaADia: base.diaADia,
      diasEntreno: base.diasEntreno,
      ritmo: b.ritmo,
      motivo: b.motivoTitulo.trim() && b.motivoFecha ? { titulo: b.motivoTitulo.trim(), fecha: b.motivoFecha } : undefined,
      habitos: b.habitos,
      creado: inicial?.creado ?? hoyISO(),
    });
  };

  return (
    <motion.div className="mx-auto flex h-full max-w-md flex-col px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between pt-[max(env(safe-area-inset-top),1.25rem)]">
        <Logo className="text-2xl" />
        <span className="text-sm tabular-nums text-muted">{paso + 1}/{pasos.length}</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
        <motion.div className="h-full bg-lime" animate={{ width: `${((paso + 1) / pasos.length) * 100}%` }} transition={{ ease }} />
      </div>

      <form
        className="flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (!actual.valido) return;
          if (ultimo) terminar();
          else setPaso(paso + 1);
        }}
      >
        <div className="flex-1 overflow-y-auto py-8">
          <AnimatePresence mode="wait">
            <motion.div key={paso} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3, ease }}>
              <h1 className="font-display text-3xl font-bold leading-tight">{actual.titulo}</h1>
              {actual.sub && <p className="mt-2 text-muted">{actual.sub}</p>}
              <div className="mt-7">{actual.cuerpo}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          {paso > 0 && (
            <button type="button" onClick={() => setPaso(paso - 1)} className="h-14 w-14 rounded-2xl border border-line text-xl text-muted" aria-label="Anterior">←</button>
          )}
          <button type="submit" disabled={!actual.valido} className={`${btnPrimario} h-14 flex-1 text-lg`}>
            {ultimo ? "Empezar con brío ⚡" : actual.id === "motivo" && !b.motivoTitulo.trim() ? "Saltar" : "Continuar"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
