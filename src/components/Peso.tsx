import { useState } from "react";
import { motion } from "motion/react";
import { fechaCorta, hoyISO, pesoEnFecha, type Metas, type Perfil } from "../lib/calc";
import Proyeccion from "./Proyeccion";
import Medidas from "./Medidas";
import { useBrio } from "../lib/store";
import { Numero, Tarjeta, Toast, btnPrimario, ease, inputCls, useToast } from "./ui";

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
            A tu ritmo (hoy −{metas.kgSemana.toFixed(2)} kg/sem) llegas a tu meta el <b className="text-ink">{fechaCorta(metas.fechaEstimada)}</b>
            {perfil.motivo && <>; para tu {perfil.motivo.titulo} estarías en ~<b className="text-ink">{pesoEnFecha(perfil, actual, perfil.motivo.fecha).toFixed(1)} kg</b></>}.
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
        <h2 className="mb-3 font-display text-lg font-bold">Tu camino a {perfil.pesoMeta} kg</h2>
        {metas.fechaEstimada
          ? <Proyeccion datos={perfil} pesoActual={actual} motivo={perfil.motivo} reales={pesos} />
          : <p className="py-6 text-center text-sm text-muted">🎉 ¡Estás en tu meta! Ahora toca mantener.</p>}
      </Tarjeta>

      <Medidas perfil={perfil} pesos={pesos} />

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
