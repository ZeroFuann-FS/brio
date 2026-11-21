import { motion } from "motion/react";
import { diasEntre, hoyISO, type Metas, type Perfil } from "../lib/calc";
import { habitosDe, minBrio, puntosDia, seAcaban, useBrio } from "../lib/store";
import { Barra, Hoja, Numero, Segmentos, Tarjeta, Toast, ease, useToast } from "./ui";
import ComidasDia from "./ComidasDia";
import EditorHabitos from "./EditorHabitos";
import { useState } from "react";
import { TarjetaPlan } from "./PlanNutriologo";
import TuDia, { AvisoPago } from "./dia/TuDia";
import { celebrarRacha } from "./LlamaRacha";
import { Chispas, DeltaFlotante, Palomita, Vaso } from "./anim";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default function Hoy({ perfil, metas, onIrComida }: { perfil: Perfil; metas: Metas; onIrComida?: () => void }) {
  const hoy = hoyISO();
  const dias = useBrio((s) => s.dias);
  const { addAgua, toggleHabito } = useBrio();
  const d = dias[hoy] ?? { comidas: [], aguaMl: 0, habitos: {} };
  const pocos = seAcaban(useBrio((s) => s.despensa));
  const [toast, setToast] = useToast();
  const [editarHabitos, setEditarHabitos] = useState(false);

  const suma = (k: "kcal" | "proteina" | "carbos" | "grasa") => d.comidas.reduce((a, c) => a + (c[k] ?? 0), 0);
  const kcal = suma("kcal");
  const restantes = metas.kcal - kcal;
  const habitos = habitosDe(perfil);
  const MIN = minBrio(habitos.length);
  const puntos = puntosDia(d, metas.aguaMl, habitos);
  const vasos = Math.round(metas.aguaMl / 250);
  const llenos = Math.floor(d.aguaMl / 250);
  const faltaMotivo = perfil.motivo ? diasEntre(hoy, perfil.motivo.fecha) : null;
  const fecha = new Date();

  const [chispa, setChispa] = useState<{ id: string; n: number } | null>(null);
  const [olaAgua, setOlaAgua] = useState(0);
  const marcarHabito = (id: string) => {
    if (!d.habitos[id]) setChispa({ id, n: Date.now() });
    toggleHabito(hoy, id);
    if (!d.habitos[id] && puntos + 1 === MIN) { setToast("¡Día con brío! Tu racha sigue"); celebrarRacha(hoy); }
  };

  /** Tocar el vaso i deja el agua en (i+1) vasos; tocar el último lleno lo vacía. */
  const tocarVaso = (i: number) => {
    const objetivo = i + 1 === llenos ? i : i + 1;
    const ml = objetivo * 250 - d.aguaMl;
    if (!ml) return;
    sumarAgua(ml);
  };
  /** Suma (o resta) agua sin tope: se puede pasar de la meta. */
  const sumarAgua = (ml: number) => {
    if (d.aguaMl + ml < 0) ml = -d.aguaMl;
    if (!ml) return;
    addAgua(hoy, ml);
    if (d.aguaMl < metas.aguaMl && d.aguaMl + ml >= metas.aguaMl) {
      setTimeout(() => setOlaAgua(Date.now()), 450);
      setToast(puntos + 1 === MIN ? "¡Día con brío! Tu racha sigue" : "Meta de agua cumplida");
      if (puntos + 1 === MIN) celebrarRacha(hoy);
    }
  };

  const macros = [
    { t: "Proteína", v: suma("proteina"), m: metas.proteina },
    { t: "Carbos", v: suma("carbos"), m: metas.carbos },
    { t: "Grasa", v: suma("grasa"), m: metas.grasa },
  ];

  return (
    <div>
      <motion.div className="mt-1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease }}>
        <h1 className="font-serif text-[clamp(30px,8vw,44px)] font-medium leading-[1.05] tracking-tight">
          {saludo()}, <em className="font-normal">{perfil.nombre}.</em>
        </h1>
        <p className="mt-1.5 text-muted first-letter:uppercase">{DIAS[fecha.getDay()]} {fecha.getDate()} de {MESES[fecha.getMonth()]}</p>
      </motion.div>

      {pocos.length > 0 && (
        <button onClick={onIrComida} className="mt-4 flex w-full items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-left">
          <span className="min-w-0"><span className="lab block !text-ember">Se te está acabando</span>
            <span className="block truncate text-sm">{pocos.map((i) => `${i.nombre.toLowerCase()} (${i.cantidad} ${i.unidad})`).join(", ")}</span></span>
          <span className="lab shrink-0">Ver →</span>
        </button>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
        {/* Comida: número editorial + barra deportiva */}
        <Tarjeta tono="food" className="md:col-span-7" tour="kcal">
          <div className="flex justify-between"><span className="lab">{restantes >= 0 ? "Te quedan hoy" : "Te pasaste por"}</span><span className="lab">Meta {metas.kcal.toLocaleString("es-MX")}</span></div>
          <p className="num relative mt-2 text-[clamp(76px,22vw,120px)] leading-[0.85]">
            <DeltaFlotante valor={restantes} unidad="kcal" />
            <span className={restantes >= 0 ? "resalta" : "text-ember"}><Numero valor={Math.abs(restantes)} /></span>
            <span className="ml-1.5 font-serif text-xl font-normal italic text-muted">kcal</span>
          </p>
          <div className="mt-4"><Segmentos progreso={kcal / metas.kcal} /></div>
          <div className="mt-2 flex justify-between"><span className="lab">{kcal.toLocaleString("es-MX")} comido</span><span className="lab">{Math.round((kcal / metas.kcal) * 100)} %</span></div>
          <div className="mt-4 grid grid-cols-3 border-t border-line">
            {macros.map((m, i) => (
              <div key={m.t} className={`pt-3 ${i ? "border-l border-line pl-3" : ""} ${i < 2 ? "pr-3" : ""}`}>
                <p className="lab">{m.t}</p>
                <p className="num text-[28px] leading-tight">{m.v}<small className="text-[15px] font-medium text-muted"> /{m.m} g</small></p>
                <div className="mt-2"><Barra progreso={m.v / m.m} /></div>
              </div>
            ))}
          </div>
        </Tarjeta>

        {/* Agua */}
        <Tarjeta tono="water" delay={0.05} className="md:col-span-5" tour="agua">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium">Agua</h2>
            <span className="num text-[34px]">{(d.aguaMl / 1000).toFixed(1)}<small className="text-base font-medium text-muted"> / {(metas.aguaMl / 1000).toFixed(1)} L</small></span>
          </div>
          <div className="mt-3.5 grid grid-cols-6 gap-1.5">
            {Array.from({ length: Math.max(vasos, llenos) }, (_, i) => (
              <Vaso key={i} i={i} lleno={i < llenos} extra={i >= vasos} celebrar={olaAgua}
                onClick={() => tocarVaso(i)} etiqueta={`${i + 1} vasos`} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <button onClick={() => sumarAgua(250)} className="rounded-full border border-water/50 bg-surface px-3 py-1.5 text-sm font-medium">+250 ml</button>
            <button onClick={() => sumarAgua(500)} className="rounded-full border border-water/50 bg-surface px-3 py-1.5 text-sm font-medium">+500 ml</button>
            <button onClick={() => sumarAgua(-250)} disabled={!d.aguaMl} aria-label="Quitar 250 ml" className="rounded-full border border-line px-3 py-1.5 text-sm text-muted disabled:opacity-40">−250</button>
          </div>
          <p className="lab mt-2.5">{d.aguaMl > metas.aguaMl ? `¡${((d.aguaMl - metas.aguaMl) / 1000).toFixed(2).replace(/0$/, "")} L más que tu meta!` : "Toca un vaso o usa los botones"}</p>
        </Tarjeta>

        <AvisoPago perfil={perfil} className="md:col-span-12" />
        <TarjetaPlan perfil={perfil} metas={metas} delay={0.08} className="md:col-span-12" />
        <ComidasDia delay={0.1} className="md:col-span-7" tour="comidas" />

        {/* Hábitos */}
        <Tarjeta tono="habit" delay={0.15} className="md:col-span-5" tour="habitos">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-medium">Hábitos</h2>
            <span className="flex items-baseline gap-3"><span className="lab" title="Cuentan tus hábitos y la meta de agua">{puntos} de {habitos.length + 1} · con agua</span><button onClick={() => setEditarHabitos(true)} className="lab !text-lime-ink hover:underline">Editar</button></span>
          </div>
          <ul className="mt-2">
            {habitos.map((h) => {
              const ok = !!d.habitos[h.id];
              return (
                <li key={h.id} className="border-b border-line last:border-b-0">
                  <button onClick={() => marcarHabito(h.id)} className="flex w-full items-center gap-3 py-2.5 text-left">
                    <motion.span
                      className={`relative grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] text-on-lime transition-colors ${ok ? "border-lime bg-lime" : "border-line-strong"}`}
                      animate={ok ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                    >
                      <Palomita visible={ok} />
                      <Chispas disparo={chispa?.id === h.id ? chispa.n : 0} />
                    </motion.span>
                    <span className={ok ? "" : "text-ink/90"}>{h.t}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="lab mt-2.5">{puntos >= MIN ? "Día con brío · tu racha sigue" : `Cumple ${MIN - puntos} más para sumar a tu racha`}</p>
        </Tarjeta>

        <TuDia perfil={perfil} delay={0.18} className="md:col-span-12" tour="tudia" />

        {perfil.motivo && faltaMotivo !== null && faltaMotivo >= 0 && (
          <p className="border-t border-line-strong px-1 pt-4 font-serif text-[22px] italic leading-snug md:col-span-12">
            Faltan <b className="rounded-[4px] bg-lime px-1.5 font-medium not-italic text-on-lime">{faltaMotivo} días</b> para tu {perfil.motivo.titulo.toLowerCase()}. Cada día cuenta.
          </p>
        )}
      </div>
      <Hoja abierta={editarHabitos} onClose={() => setEditarHabitos(false)} titulo="Tus hábitos">
        {editarHabitos && <EditorHabitos perfil={perfil} onListo={() => { setEditarHabitos(false); setToast("Hábitos guardados"); }} />}
      </Hoja>
      <Toast texto={toast} />
    </div>
  );
}
