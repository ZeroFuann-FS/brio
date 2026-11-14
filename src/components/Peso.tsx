import { useState } from "react";
import { motion } from "motion/react";
import { fechaCorta, hoyISO, pesoEnFecha, type Metas, type Perfil } from "../lib/calc";
import { useBrio } from "../lib/store";
import { Numero, Tarjeta, Toast, btnPrimario, ease, inputCls, useToast } from "./ui";

function Grafica({ pesos, meta }: { pesos: { fecha: string; kg: number }[]; meta: number }) {
  if (pesos.length < 2) {
    return <p className="py-8 text-center text-sm text-muted">Registra tu peso un par de días más para ver tu gráfica 📈</p>;
  }
  const W = 320, H = 150, P = 12;
  const kgs = pesos.map((p) => p.kg);
  const min = Math.min(...kgs, meta) - 1, max = Math.max(...kgs) + 1;
  const t0 = new Date(pesos[0].fecha).getTime(), t1 = new Date(pesos[pesos.length - 1].fecha).getTime() || t0 + 1;
  const x = (f: string) => P + ((new Date(f).getTime() - t0) / Math.max(1, t1 - t0)) * (W - 2 * P);
  const y = (kg: number) => P + ((max - kg) / (max - min)) * (H - 2 * P);
  const linea = pesos.map((p, i) => `${i ? "L" : "M"}${x(p.fecha).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfica de peso">
      <line x1={P} x2={W - P} y1={y(meta)} y2={y(meta)} stroke="var(--color-lime)" strokeDasharray="4 4" strokeOpacity={0.5} />
      <text x={W - P} y={y(meta) - 5} textAnchor="end" fontSize="10" fill="var(--color-lime)">meta {meta} kg</text>
      <motion.path d={linea} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease }} />
      {pesos.map((p, i) => (
        <motion.circle key={p.fecha} cx={x(p.fecha)} cy={y(p.kg)} r={3.5} fill="var(--color-lime)"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }} />
      ))}
    </svg>
  );
}

export default function Peso({ perfil, metas, actual }: { perfil: Perfil; metas: Metas; actual: number }) {
  const pesos = useBrio((s) => s.pesos);
  const { addPeso, removePeso } = useBrio();
  const [valor, setValor] = useState("");
  const [toast, setToast] = useToast();

  const perdido = perfil.pesoInicial - actual;
  const total = perfil.pesoInicial - perfil.pesoMeta;
  const progreso = total !== 0 ? Math.max(0, Math.min(1, perdido / total)) : 1;
  const hoyRegistrado = pesos.some((p) => p.fecha === hoyISO());

  const guardar = () => {
    const kg = Number(valor.replace(",", "."));
    if (!(kg >= 30 && kg <= 300)) return;
    const anterior = actual;
    addPeso(Math.round(kg * 10) / 10);
    setValor("");
    const dif = kg - anterior;
    setToast(dif < -0.05 ? `¡Eso es brío! −${Math.abs(dif).toFixed(1)} kg 💪` : dif > 0.05 ? "Normal que suba un poco. Mira la tendencia, no el día 📈" : "Registrado ✅");
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Peso</h1>

      <Tarjeta>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Actual</p>
            <p className="font-display text-5xl font-extrabold"><Numero valor={actual} decimales={1} /><span className="ml-1 text-lg text-muted">kg</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">{perdido >= 0 ? "Llevas" : "Subiste"}</p>
            <p className={`font-display text-2xl font-bold ${perdido >= 0 ? "text-lime" : "text-ember"}`}>{Math.abs(perdido) < 0.05 ? "" : perdido > 0 ? "−" : "+"}{Math.abs(perdido).toFixed(1)} kg</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted"><span>{perfil.pesoInicial} kg</span><span>{Math.round(progreso * 100)} %</span><span>{perfil.pesoMeta} kg</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-lime to-emerald-400" initial={{ width: 0 }} animate={{ width: `${progreso * 100}%` }} transition={{ duration: 1, ease }} />
          </div>
        </div>
        {metas.fechaEstimada && (
          <p className="mt-4 text-sm text-muted">
            A tu ritmo (−{metas.kgSemana.toFixed(2)} kg/sem) llegas a tu meta el <b className="text-ink">{fechaCorta(metas.fechaEstimada)}</b>
            {perfil.motivo && <>; para tu {perfil.motivo.titulo} estarías en ~<b className="text-ink">{pesoEnFecha(actual, metas, perfil.pesoMeta, perfil.motivo.fecha).toFixed(1)} kg</b></>}.
          </p>
        )}
      </Tarjeta>

      <Tarjeta delay={0.05}>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          <input className={inputCls} inputMode="decimal" placeholder={hoyRegistrado ? "Corregir el de hoy (kg)" : "Peso de hoy (kg)"} value={valor} onChange={(e) => setValor(e.target.value)} />
          <button type="submit" className={btnPrimario} disabled={!valor}>Guardar</button>
        </form>
        <p className="mt-2 text-xs text-muted">Tip: pésate en ayunas, después del baño, 1–3 veces por semana.</p>
      </Tarjeta>

      <Tarjeta delay={0.1}>
        <h2 className="mb-2 font-display text-lg font-bold">Tendencia</h2>
        <Grafica pesos={pesos} meta={perfil.pesoMeta} />
      </Tarjeta>

      {pesos.length > 0 && (
        <Tarjeta delay={0.15}>
          <h2 className="mb-2 font-display text-lg font-bold">Historial</h2>
          <ul className="divide-y divide-line">
            {[...pesos].reverse().map((p) => (
              <li key={p.fecha} className="flex items-center justify-between py-2.5">
                <span className="text-muted">{fechaCorta(p.fecha)}</span>
                <span className="flex items-center gap-3">
                  <b className="tabular-nums">{p.kg.toFixed(1)} kg</b>
                  {pesos.length > 1 && <button onClick={() => removePeso(p.fecha)} className="text-muted hover:text-ember" aria-label="Borrar">✕</button>}
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
      <Toast texto={toast} />
    </div>
  );
}
