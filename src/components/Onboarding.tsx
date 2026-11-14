import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { calcularMetas, categoriaImc, fechaCorta, hoyISO, imc, pesoEnFecha, pesoReferencia, rangoSaludable, type DiaADia, type Habito, type Perfil, type Ritmo, type Sexo } from "../lib/calc";
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
      className={`w-full rounded-[14px] border bg-surface px-4 py-3.5 text-left transition ${activa ? "border-line-strong shadow-[inset_0_0_0_1px_var(--line-strong)] dark:border-lime dark:shadow-[inset_0_0_0_1px_var(--lime)]" : "border-line hover:border-muted"}`}
    >
      {children}
    </motion.button>
  );
}

function Campo({ label, sufijo, ...props }: { label: string; sufijo?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="lab mb-1.5 block">{label}</span>
      <div className="relative">
        <input className={`${inputCls} ${props.inputMode === "decimal" || props.inputMode === "numeric" ? "num h-[58px] text-2xl" : ""}`} {...props} />
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

  const guiaImc = (() => {
    const cm = num(b.estatura), kg = num(b.peso), edad = num(b.edad);
    if (!(cm >= 120 && kg >= 30 && edad >= 18) || !b.sexo) return null;
    const valor = imc(kg, cm);
    const rango = rangoSaludable(cm, edad);
    const ref = pesoReferencia(b.sexo, cm, edad);
    const opciones: { t: string; d: string; kg: number }[] = [];
    if (kg > rango.max) {
      if (valor >= 30) opciones.push({ t: "Primer paso", d: "Bajar 10 % ya mejora mucho tu salud", kg: Math.round(kg * 0.9) });
      opciones.push({ t: "Límite saludable", d: "El máximo del rango para tu estatura", kg: Math.floor(rango.max) });
    } else if (kg < rango.min) {
      opciones.push({ t: "Mínimo saludable", d: "El inicio del rango para tu estatura", kg: Math.ceil(rango.min) });
    }
    opciones.push({ t: "Peso de referencia", d: `Según tu sexo y estatura (Robinson)`, kg: ref });
    return { valor, cat: categoriaImc(valor, edad), rango, opciones: opciones.filter((o, i, arr) => arr.findIndex((x) => x.kg === o.kg) === i) };
  })();
  const metaFuera = guiaImc && num(b.meta) > 0
    ? num(b.meta) < guiaImc.rango.min ? `Ojo: ${b.meta} kg queda por debajo del rango saludable.` : null
    : null;

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
            <Opcion activa={b.sexo === "h"} onClick={() => set("sexo", "h")}>Hombre</Opcion>
            <Opcion activa={b.sexo === "m"} onClick={() => set("sexo", "m")}>Mujer</Opcion>
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
      sub: "Si no tienes báscula hoy, pon el último que recuerdes. Te ayudamos a elegir tu meta.",
      valido: num(b.peso) >= 30 && num(b.peso) <= 300 && num(b.meta) >= 30 && num(b.meta) <= 300,
      cuerpo: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Peso actual" sufijo="kg" inputMode="decimal" value={b.peso} onChange={(e) => set("peso", e.target.value)} placeholder="80" />
            <Campo label="Peso meta" sufijo="kg" inputMode="decimal" value={b.meta} onChange={(e) => set("meta", e.target.value)} placeholder="70" />
          </div>
          {guiaImc && (
            <motion.div className="rounded-[20px] border border-line bg-t-food p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
              <div className="flex items-baseline justify-between">
                <p className="lab">Tu IMC</p>
                <p className="num text-[26px]">
                  {guiaImc.valor.toFixed(1)} <span className="lab !text-ink">{guiaImc.cat.t}</span>
                </p>
              </div>
              <div className="relative mt-3 grid h-2 grid-cols-[14fr_26fr_20fr_40fr] gap-[3px]">
                <i className="rounded-[2px] bg-[#7cc3ff]" /><i className="rounded-[2px] bg-lime" /><i className="rounded-[2px] bg-[#f5c542]" /><i className="rounded-[2px] bg-[#f08a4b]" />
                <motion.span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink"
                  animate={{ left: `${Math.min(100, Math.max(0, ((guiaImc.valor - 15) / 25) * 100))}%` }} transition={{ ease }} />
              </div>
              <div className="num mt-1.5 flex justify-between text-[11px] font-medium text-muted"><span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
              <p className="mt-3 text-sm leading-relaxed">
                Para {b.estatura} cm, un peso saludable va de <b>{guiaImc.rango.min}</b> a <b>{guiaImc.rango.max} kg</b>
                {num(b.edad) >= 65 ? " (rango ajustado a tu edad)" : ""}.
              </p>
              <p className="lab mt-3">Toca una opción para usarla como meta</p>
              <div className="mt-2 grid gap-2">
                {guiaImc.opciones.map((o) => (
                  <button key={o.t} type="button" onClick={() => set("meta", String(o.kg))}
                    className={`flex items-center justify-between rounded-[14px] border bg-surface px-3.5 py-3 text-left transition ${num(b.meta) === o.kg ? "border-line-strong shadow-[inset_0_0_0_1px_var(--line-strong)] dark:border-lime dark:shadow-[inset_0_0_0_1px_var(--lime)]" : "border-line"}`}>
                    <span>{o.t}<span className="lab mt-0.5 block">{o.d}</span></span>
                    <b className="num text-[22px]">{o.kg} kg</b>
                  </button>
                ))}
              </div>
              {metaFuera && <p className="mt-3 text-xs text-ember">{metaFuera}</p>}
            </motion.div>
          )}
          <p className="lab leading-relaxed">Tip: el IMC no distingue músculo de grasa. Después podrás agregar tu cintura y otras medidas en Progreso.</p>
          <p className="text-xs text-muted">Si tienes alguna condición de salud, consulta a un profesional.</p>
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
            ["sentado", "Casi todo el día sentado", "Escuela, oficina, compu"],
            ["de-pie", "De pie o caminando seguido", "Tienda, maestro, mesero"],
            ["fisico", "Trabajo físico", "Carga, obra, campo"],
          ] as const).map(([id, t, d]) => (
            <Opcion key={id} activa={b.diaADia === id} onClick={() => set("diaADia", id)}>
              <p className="font-medium">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </Opcion>
          ))}
          <p className="lab pt-3">¿Cuántos días entrenas por semana?</p>
          <div className="grid grid-cols-8 gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("diasEntreno", n)}
                className={`num h-11 rounded-[12px] border text-lg transition ${b.diasEntreno === n ? "border-lime bg-lime text-on-lime" : "border-line bg-surface"}`}
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
            [0.5, "Tranquilo", "Fácil de sostener"],
            [0.75, "Recomendado", "Buen balance"],
            [1, "Intenso", "Pide más disciplina"],
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
                      <p className="num whitespace-nowrap text-[22px]">{m.kcal.toLocaleString("es-MX")}</p>
                      <p className="lab whitespace-nowrap">−{m.kgSemana.toFixed(2)} kg/sem</p>
                    </div>
                  )}
                </div>
              </Opcion>
            );
          })}
          {base && perder && (
            <div key={b.ritmo} className="rounded-[20px] border border-line bg-surface p-3.5">
              <Proyeccion datos={{ ...base, ritmo: b.ritmo }} pesoActual={base.pesoInicial} alto={150} />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "habitos",
      titulo: "Tus hábitos",
      sub: "Elige los que quieres construir. Cada día que cumplas la mayoría suma a tu racha.",
      valido: b.habitos.length > 0,
      cuerpo: (
        <div className="space-y-2">
          {[...CATALOGO_HABITOS, ...propios].map((h) => {
            const activo = b.habitos.some((y) => y.id === h.id);
            return (
              <Opcion key={h.id} activa={activo} onClick={() => toggleHabito(h)}>
                <div className="flex items-center gap-3">
                  <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold ${activo ? "border-lime bg-lime text-on-lime" : "border-line-strong"}`}>{activo ? "✓" : ""}</span>
                  <span className="flex-1">{h.t}</span>
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
          <p className="lab">{b.habitos.length}/{MAX_HABITOS} elegidos · el agua se cuenta sola</p>
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
                className={`rounded-full border px-3.5 py-2 text-sm transition ${b.motivoTitulo === m ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>
                {m}
              </button>
            ))}
          </div>
          <Campo label="O escribe el tuyo" value={b.motivoTitulo} onChange={(e) => set("motivoTitulo", e.target.value)} placeholder="Ej. Mi graduación" maxLength={40} />
          <label className="block">
            <span className="lab mb-1.5 block">Fecha</span>
            <input type="date" className={`${inputCls} campo-fecha`} min={hoyISO()} value={b.motivoFecha} onChange={(e) => set("motivoFecha", e.target.value)} />
          </label>
        </div>
      ),
    },
    {
      id: "resumen",
      titulo: `Listo, ${b.nombre.trim() || "crack"}.`,
      sub: "Este es tu plan. Brío lo ajusta solo cada vez que registres tu peso.",
      valido: true,
      cuerpo: metas && base ? (() => {
        const kp = metas.proteina * 4, kc = metas.carbos * 4, kg = metas.grasa * 9;
        const motivoOk = b.motivoTitulo.trim() && b.motivoFecha && metas.fechaEstimada && b.motivoFecha < metas.fechaEstimada;
        return (
          <div>
            <div className="border-b border-line pb-5">
              <p className="lab">Tu meta diaria</p>
              <p className="num mt-1.5 text-[clamp(72px,20vw,104px)] leading-[0.9]">
                <Numero valor={metas.kcal} /><span className="ml-1.5 font-serif text-xl font-normal italic tracking-normal text-muted">kcal</span>
              </p>
              <div className="mt-4 flex h-3.5 gap-[3px]">
                {[["bg-ink dark:bg-[#f2f3f0]", kp], ["bg-lime", kc], ["bg-fat", kg]].map(([c, v], i) => (
                  <motion.i key={i} className={`rounded-[3px] ${c}`} style={{ flex: v as number }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 + i * 0.12, ease }} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3">
                {([["Proteína", metas.proteina, "bg-ink dark:bg-[#f2f3f0]"], ["Carbos", metas.carbos, "bg-lime"], ["Grasa", metas.grasa, "bg-fat"]] as const).map(([t, v, c]) => (
                  <div key={t}>
                    <p className="lab"><i className={`mr-1.5 inline-block h-2 w-2 rounded-[2px] align-[1px] ${c}`} />{t}</p>
                    <p className="num text-[26px] leading-none">{v}<small className="text-sm font-medium text-muted"> g</small></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-line py-5">
              <p className="lab">De dónde sale</p>
              <div className="mt-3 flex h-10 overflow-hidden rounded-[10px] border border-line-strong">
                <motion.span className="num flex items-center whitespace-nowrap bg-ink pl-3 text-[15px] uppercase tracking-[0.06em] text-bg dark:bg-[#f2f3f0] dark:text-[#17191c]"
                  initial={{ width: 0 }} animate={{ width: `${(metas.kcal / metas.tdee) * 100}%` }} transition={{ delay: 0.3, duration: 0.8, ease }}>
                  Comerás {metas.kcal.toLocaleString("es-MX")}
                </motion.span>
                <span className="num flex flex-1 items-center justify-center text-[15px] text-on-lime" style={{ background: "repeating-linear-gradient(135deg,var(--lime) 0 8px,color-mix(in srgb,var(--lime) 70%,transparent) 8px 14px)" }}>
                  {perder ? "−" : "+"}{Math.abs(metas.tdee - metas.kcal)}
                </span>
              </div>
              <div className="mt-2 flex justify-between"><span className="lab">0</span><span className="lab">Tu cuerpo gasta {metas.tdee.toLocaleString("es-MX")} kcal al día</span></div>
            </div>

            {metas.fechaEstimada && (
              <div className="border-b border-line py-5">
                <p className="lab">Tu camino</p>
                <div className="relative mt-4 grid grid-cols-3 before:absolute before:left-2 before:right-2 before:top-[7px] before:h-0.5 before:bg-line-strong">
                  <div className="relative pt-6">
                    <span className="absolute left-0 top-0 h-4 w-4 rounded-full border-2 border-ink bg-bg" />
                    <p className="num text-[28px] leading-none">{base.pesoInicial}</p><p className="lab">Hoy</p>
                  </div>
                  <div className="relative pt-6 text-center">
                    {motivoOk && <>
                      <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-lime-ink bg-bg" />
                      <p className="num text-[28px] leading-none">~{Math.round(pesoEnFecha({ ...base, ritmo: b.ritmo }, base.pesoInicial, b.motivoFecha))}</p>
                      <p className="lab">{fechaCorta(b.motivoFecha, false)} · {b.motivoTitulo.trim()}</p>
                    </>}
                  </div>
                  <div className="relative pt-6 text-right">
                    <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-ink bg-lime" />
                    <p className="num text-[28px] leading-none">{base.pesoMeta}</p><p className="lab">{fechaCorta(metas.fechaEstimada)}</p>
                  </div>
                </div>
              </div>
            )}

            <ul className="pt-2">
              {[
                ["Agua al día", `${(metas.aguaMl / 1000).toFixed(1)} L`],
                [perder ? "Ritmo al inicio" : "Ritmo", `${perder ? "−" : "+"}${Math.abs(metas.kgSemana).toFixed(2)} kg/sem`],
                ["Hábitos elegidos", String(b.habitos.length)],
              ].map(([t, v]) => (
                <li key={t} className="flex items-baseline justify-between border-b border-line py-2.5 last:border-b-0">
                  <span>{t}</span><b className="num text-xl">{v}</b>
                </li>
              ))}
            </ul>
            {metas.limitadoPorMinimo && <p className="mt-2 text-xs text-ember">Ajustamos tus calorías al mínimo seguro. No bajamos de ahí.</p>}
            <p className="mt-3 text-xs text-muted">Son estimaciones y no sustituyen a un profesional de la salud.</p>
          </div>
        );
      })() : null,
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
    <motion.div className="mx-auto flex h-full max-w-[560px] flex-col px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between pt-[max(env(safe-area-inset-top),1.25rem)]">
        <Logo className="text-2xl" />
        <span className="lab">{paso + 1} de {pasos.length}</span>
      </div>
      <div className="mt-3.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${pasos.length}, 1fr)` }}>
        {pasos.map((p, i) => <i key={p.id} className={`h-[5px] rounded-[2px] transition-colors ${i <= paso ? "bg-ink dark:bg-lime" : "bg-track"}`} />)}
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
              <h1 className="font-serif text-[clamp(32px,8.5vw,42px)] font-medium leading-[1.05] tracking-tight">{actual.titulo}</h1>
              {actual.sub && <p className="mt-2 text-muted">{actual.sub}</p>}
              <div className="mt-7">{actual.cuerpo}</div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          {paso > 0 && (
            <button type="button" onClick={() => setPaso(paso - 1)} className="h-[54px] w-[54px] rounded-[14px] border border-line text-xl text-muted" aria-label="Anterior">←</button>
          )}
          <button type="submit" disabled={!actual.valido} className={`${btnPrimario} h-[54px] flex-1`}>
            {ultimo ? "Empezar con brío" : actual.id === "motivo" && !b.motivoTitulo.trim() ? "Saltar" : "Continuar"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
