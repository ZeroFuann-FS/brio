import { useState } from "react";
import { motion } from "motion/react";
import { diasEntre, fechaCorta, grasaNavy, hoyISO, ratioCintura, type Perfil } from "../lib/calc";
import { DIAS_ENTRE_MEDIDAS, MEDIDAS, useBrio, type IdMedida, type Peso, type RegistroMedidas } from "../lib/store";
import { Hoja, Tarjeta, btnPrimario, btnSecundario, ease, inputCls } from "./ui";

function ultimoValor(medidas: RegistroMedidas[], id: IdMedida, hasta = medidas.length) {
  for (let i = hasta - 1; i >= 0; i--) if (medidas[i][id] != null) return medidas[i][id]!;
  return undefined;
}
function pesoCerca(pesos: Peso[], fecha: string) {
  let r: number | undefined;
  for (const p of pesos) if (p.fecha <= fecha) r = p.kg;
  return r ?? pesos[0]?.kg;
}

function Mini({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const W = 80, H = 26, min = Math.min(...valores), max = Math.max(...valores), rango = max - min || 1;
  const d = valores.map((v, i) => `${i ? "L" : "M"}${(i / (valores.length - 1)) * W},${H - 3 - ((v - min) / rango) * (H - 6)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-20" aria-hidden>
      <motion.path d={d} fill="none" stroke="var(--color-lime)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease }} />
    </svg>
  );
}

/** Mensaje que cruza peso y cintura: el peso no distingue músculo de grasa, la cintura sí. */
function mensaje(medidas: RegistroMedidas[], pesos: Peso[]) {
  const conCintura = medidas.filter((m) => m.cintura != null);
  if (conCintura.length < 2) return null;
  const a = conCintura[conCintura.length - 2], b = conCintura[conCintura.length - 1];
  const dC = b.cintura! - a.cintura!;
  const pa = pesoCerca(pesos, a.fecha), pb = pesoCerca(pesos, b.fecha);
  const dP = pa != null && pb != null ? pb - pa : 0;
  if (dC <= -0.5 && Math.abs(dP) < 0.5) return { ok: true, t: `Tu peso casi no se movió, pero tu cintura bajó ${Math.abs(dC).toFixed(1)} cm. Eso es grasa que se fue y músculo que se queda ` };
  if (dC <= -0.5) return { ok: true, t: `Bajaste ${Math.abs(dP).toFixed(1)} kg y ${Math.abs(dC).toFixed(1)} cm de cintura. ¡Vas perdiendo grasa!` };
  if (dC >= 0.5) return { ok: false, t: `Tu cintura subió ${dC.toFixed(1)} cm desde el ${fechaCorta(a.fecha, false)}. Revisa tus comidas de estas semanas: se puede ajustar.` };
  return { ok: true, t: "Tu cintura se mantiene estable. La constancia hace el resto." };
}

export default function Medidas({ perfil, pesos }: { perfil: Perfil; pesos: Peso[] }) {
  const medidas = useBrio((s) => s.medidas);
  const { addMedidas, removeMedidas } = useBrio();
  const [hoja, setHoja] = useState(false);
  const [guia, setGuia] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});

  const cintura = ultimoValor(medidas, "cintura");
  const ratio = cintura ? ratioCintura(cintura, perfil.estatura) : null;
  const grasa = grasaNavy(perfil.sexo, perfil.estatura, cintura, ultimoValor(medidas, "cuello"), ultimoValor(medidas, "cadera"));
  const ultimaFecha = medidas[medidas.length - 1]?.fecha;
  const toca = ultimaFecha ? diasEntre(ultimaFecha, hoyISO()) >= DIAS_ENTRE_MEDIDAS : false;
  const msg = mensaje(medidas, pesos);
  const faltanParaGrasa = perfil.sexo === "h" ? ["cintura", "cuello"] : ["cintura", "cuello", "cadera"];

  const abrir = () => { setF({}); setHoja(true); };
  const guardar = () => {
    const m: RegistroMedidas = { fecha: hoyISO() };
    for (const x of MEDIDAS) {
      const v = Number((f[x.id] ?? "").replace(",", "."));
      if (v >= 10 && v <= 250) m[x.id] = Math.round(v * 10) / 10;
    }
    if (Object.keys(m).length > 1) addMedidas(m);
    setHoja(false);
  };

  return (
    <>
      <Tarjeta delay={0.12}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium">Medidas</h2>
          {medidas.length > 0 && <button onClick={abrir} className="text-sm text-lime-ink hover:underline">+ Medirme</button>}
        </div>

        {!medidas.length ? (
          <div className="mt-3">
            <p className="text-sm leading-relaxed text-muted">
              La báscula no distingue músculo de grasa, <b className="text-ink">tu cintura sí</b>. Si entrenas, puedes bajar grasa aunque el peso no se mueva.
              Con una cinta métrica y 2 minutos cada 2 semanas basta.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setGuia(true)} className={`${btnSecundario} whitespace-nowrap`}>¿Cómo medirme?</button>
              <button onClick={abrir} className={`${btnPrimario} !text-[15px] !tracking-[0.06em]`}>Agregar</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {toca && (
              <button onClick={abrir} className="w-full rounded-2xl bg-lime/10 px-4 py-2.5 text-left text-sm">
                Ya pasaron {diasEntre(ultimaFecha!, hoyISO())} días desde tu última medición. <b className="text-lime-ink">Toca medirte</b>
              </button>
            )}

            {ratio && (
              <div className="rounded-2xl bg-bg p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm text-muted">Cintura ÷ estatura</p>
                  <p className="font-serif text-xl font-medium">{ratio.r.toFixed(2)} <span className={`text-sm font-medium ${ratio.ok ? "text-lime-ink" : "text-ember"}`}>{ratio.t}</span></p>
                </div>
                <div className="relative mt-3 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#38bdf8 0%,#38bdf8 25%,#c6f432 25%,#c6f432 50%,#fbbf24 50%,#fbbf24 75%,#ff8a3d 75%)" }}>
                  <motion.span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-ink"
                    initial={{ left: "0%" }} animate={{ left: `${Math.min(100, Math.max(0, ((ratio.r - 0.3) / 0.4) * 100))}%` }} transition={{ duration: 0.9, ease }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-muted"><span>0.3</span><span>0.4</span><span>0.5</span><span>0.6</span><span>0.7</span></div>
                {!ratio.ok && ratio.r >= 0.5 && <p className="mt-2 text-xs text-muted">Meta: cintura menor a <b className="text-ink">{ratio.limite} cm</b> (te faltan {(cintura! - ratio.limite).toFixed(1)} cm).</p>}
              </div>
            )}

            <div className="rounded-2xl bg-bg p-4">
              <p className="text-sm text-muted">% de grasa estimado</p>
              {grasa ? (
                <p className="mt-1 font-display text-2xl font-bold">{grasa.v} % <span className="text-sm font-medium text-muted">· {grasa.t}</span></p>
              ) : (
                <p className="mt-1 text-sm">Agrega {faltanParaGrasa.filter((id) => ultimoValor(medidas, id as IdMedida) == null).join(" y ")} para estimarlo.</p>
              )}
              <p className="mt-1 text-[11px] text-muted">Fórmula de la Marina de EE. UU. Margen de ±3–4 %.</p>
            </div>

            {msg && <p className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.ok ? "bg-lime/10" : "bg-ember/10"}`}>{msg.t}</p>}

            <ul className="divide-y divide-line">
              {MEDIDAS.filter((x) => medidas.some((m) => m[x.id] != null)).map((x) => {
                const serie = medidas.map((m) => m[x.id]).filter((v): v is number => v != null);
                const dif = serie[serie.length - 1] - serie[0];
                return (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="w-16 text-sm">{x.t}</span>
                    <Mini valores={serie} />
                    <span className="ml-auto text-right">
                      <b className="tabular-nums">{serie[serie.length - 1]} cm</b>
                      {serie.length > 1 && Math.abs(dif) >= 0.1 && (
                        <span className={`block text-xs ${dif < 0 ? "text-lime-ink" : "text-muted"}`}>{dif > 0 ? "+" : "−"}{Math.abs(dif).toFixed(1)} desde el inicio</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>

            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Historial ({medidas.length})</summary>
              <ul className="mt-2 space-y-1">
                {[...medidas].reverse().map((m) => (
                  <li key={m.fecha} className="flex items-center justify-between rounded-xl bg-bg px-3 py-2">
                    <span className="text-muted">{fechaCorta(m.fecha)}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs">{MEDIDAS.filter((x) => m[x.id] != null).map((x) => `${x.t} ${m[x.id]}`).join(" · ")}</span>
                      <button onClick={() => removeMedidas(m.fecha)} className="text-muted hover:text-ember" aria-label="Borrar">✕</button>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </Tarjeta>

      <Hoja abierta={hoja} onClose={() => setHoja(false)} titulo="Mis medidas de hoy">
        <p className="mb-4 text-sm text-muted">Todas son opcionales. Con <b className="text-ink">cintura</b> ya tienes lo más importante. Usa una cinta métrica de costura, sin apretar.</p>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          {MEDIDAS.map((x) => (
            <label key={x.id} className="block">
              <span className="flex items-baseline justify-between text-sm">
                <span>{x.t}{x.id === "cintura" && <span className="ml-1 text-lime-ink">· la más importante</span>}</span>
                {ultimoValor(medidas, x.id) != null && <span className="text-xs text-muted">antes: {ultimoValor(medidas, x.id)} cm</span>}
              </span>
              <span className="mb-1.5 block text-xs text-muted">{x.como}</span>
              <div className="relative">
                <input className={inputCls} inputMode="decimal" placeholder="cm" value={f[x.id] ?? ""} onChange={(e) => setF({ ...f, [x.id]: e.target.value })} />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">cm</span>
              </div>
            </label>
          ))}
          <button type="submit" className={`${btnPrimario} w-full`} disabled={!Object.values(f).some((v) => Number(v.replace(",", ".")) >= 10)}>Guardar medidas</button>
        </form>
      </Hoja>

      <Hoja abierta={guia} onClose={() => setGuia(false)} titulo="Cómo medirte">
        <ul className="space-y-3 text-sm">
          <li>Usa una <b>cinta métrica de costura</b> (las venden en papelerías y mercerías).</li>
          <li>Mídete <b>en la mañana</b>, en ayunas y sin ropa ajustada.</li>
          <li>Para la cintura: <b>respira normal y mide al final de exhalar</b>, sin meter la panza.</li>
          <li>La cinta debe ir <b>recta y pegada</b> a la piel, sin apretar.</li>
          <li>Repite <b>cada 2 semanas</b>, siempre igual: mismo lugar, misma hora.</li>
        </ul>
        <div className="mt-4 space-y-2">
          {MEDIDAS.map((x) => (
            <p key={x.id} className="rounded-xl bg-bg px-3 py-2 text-sm"><b>{x.t}:</b> <span className="text-muted">{x.como}</span></p>
          ))}
        </div>
        <button onClick={() => { setGuia(false); abrir(); }} className={`${btnPrimario} mt-4 w-full`}>Medirme ahora</button>
      </Hoja>
    </>
  );
}
