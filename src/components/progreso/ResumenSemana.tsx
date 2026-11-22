import { useMemo, useState } from "react";
import { hoyISO, sumarDias, type Metas, type Perfil } from "../../lib/calc";
import { DIAS_CORTOS } from "../../lib/entreno";
import { lunes } from "../../lib/metas";
import { resumenSemana } from "../../lib/resumen";
import { useBrio } from "../../lib/store";
import { Tarjeta } from "../ui";

const corta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

function Dato({ t, v, sub, ok }: { t: string; v: string; sub?: string; ok?: boolean | null }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-3">
      <p className="lab">{t}</p>
      <p className={`num mt-0.5 text-[28px] leading-none ${ok === true ? "text-lime-ink" : ok === false ? "text-ember" : ""}`}>{v}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function ResumenSemana({ perfil, metas }: { perfil: Perfil; metas: Metas }) {
  const dias = useBrio((s) => s.dias), sesiones = useBrio((s) => s.sesiones), pesos = useBrio((s) => s.pesos);
  const hoy = hoyISO(), actual = lunes(hoy);
  const [semana, setSemana] = useState(actual);
  const r = useMemo(() => resumenSemana({ perfil, metas, dias, sesiones, pesos }, semana), [perfil, metas, dias, sesiones, pesos, semana]);
  const dPeso = r.pesoIni && r.pesoFin && Math.abs(r.pesoFin - r.pesoIni) >= 0.05 ? r.pesoFin - r.pesoIni : null;
  const enCurso = semana === actual;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button onClick={() => setSemana(sumarDias(semana, -7))} className="grid h-10 w-10 place-items-center rounded-full border border-line" aria-label="Semana anterior">‹</button>
        <div className="text-center">
          <p className="lab">{enCurso ? "Esta semana" : semana === sumarDias(actual, -7) ? "Semana pasada" : "Semana"}</p>
          <p className="font-serif text-xl font-medium">{corta(r.desde)} – {corta(r.hasta)}</p>
        </div>
        <button onClick={() => setSemana(sumarDias(semana, 7))} disabled={enCurso} className="grid h-10 w-10 place-items-center rounded-full border border-line disabled:opacity-30" aria-label="Semana siguiente">›</button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {r.dias.map((d) => {
          const futuro = d.fecha > hoy;
          return (
            <div key={d.fecha} className={`flex flex-col items-center gap-1 rounded-[12px] border py-2 ${d.brio ? "border-lime bg-lime text-on-lime" : futuro ? "border-dashed border-line text-muted/60" : "border-line bg-surface"}`}>
              <span className="num text-[15px] uppercase leading-none">{DIAS_CORTOS[new Date(`${d.fecha}T12:00:00`).getDay()]}</span>
              <span className="flex gap-0.5" aria-hidden>
                <i className={`h-1.5 w-1.5 rounded-full ${d.registro ? (d.brio ? "bg-on-lime" : "bg-lime") : "bg-current opacity-20"}`} />
                <i className={`h-1.5 w-1.5 rounded-full ${d.entreno ? (d.brio ? "bg-on-lime" : "bg-ink dark:bg-white") : "bg-current opacity-20"}`} />
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted">Verde = día con brío · puntos: comida registrada y entreno</p>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Dato t="Días con brío" v={`${r.diasBrio}/7`} sub={`${r.habitosPct}% de hábitos y agua`} ok={r.diasBrio >= 5 ? true : null} />
        <Dato t="Entrenos" v={`${r.entrenos}/${r.metaEntrenos}`} sub={r.series ? `${r.series} series · ${r.volumen.toLocaleString("es-MX")} kg` : "Sin series registradas"} ok={r.entrenos >= r.metaEntrenos ? true : null} />
        <Dato t="Calorías promedio" v={r.diasRegistro ? r.kcalProm.toLocaleString("es-MX") : "—"} sub={r.diasRegistro ? `meta ${metas.kcal.toLocaleString("es-MX")} · ${r.diasRegistro} ${r.diasRegistro === 1 ? "día registrado" : "días registrados"}` : "Registra tus comidas"}
          ok={r.diasRegistro ? Math.abs(r.kcalProm - metas.kcal) <= metas.kcal * 0.1 : null} />
        <Dato t="Proteína promedio" v={r.diasRegistro ? `${r.protProm} g` : "—"} sub={`meta ${metas.proteina} g`} ok={r.diasRegistro ? r.protProm >= metas.proteina * 0.85 : null} />
        <Dato t="Agua promedio" v={`${(r.aguaProm / 1000).toFixed(1)} L`} sub={`meta ${(metas.aguaMl / 1000).toFixed(1)} L`} ok={r.aguaProm >= metas.aguaMl * 0.9 ? true : null} />
        <Dato t="Peso" v={r.pesoFin ? `${r.pesoFin} kg` : "—"} sub={dPeso !== null ? `${dPeso <= 0 ? "−" : "+"}${Math.abs(dPeso).toFixed(1)} kg vs semana anterior` : r.pesoFin ? "Sin cambio vs semana anterior" : "Pésate al menos una vez"} ok={dPeso !== null ? (perfil.pesoMeta < perfil.pesoInicial ? dPeso < 0 : dPeso > 0) : null} />
        <Dato t="Estudio" v={r.aprenderMin ? `${(r.aprenderMin / 60).toFixed(1).replace(".0", "")} h` : "—"} sub="de tus metas de tiempo" />
        <Dato t="Ahorro" v={r.ahorro ? `$${r.ahorro.toLocaleString("es-MX")}` : "—"} sub={r.pasosHechos ? `${r.pasosHechos} ${r.pasosHechos === 1 ? "paso de meta cumplido" : "pasos de metas cumplidos"}` : "de tus metas de dinero"} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Tarjeta tono="habit" className="!p-4">
          <p className="lab">Lo que salió bien</p>
          {r.logros.length ? <ul className="mt-2 space-y-1.5 text-sm">{r.logros.map((l) => <li key={l} className="flex gap-2"><span className="text-lime-ink">✓</span>{l}</li>)}</ul>
            : <p className="mt-2 text-sm text-muted">{enCurso ? "La semana apenas va. Cada registro cuenta." : "Esta semana no hubo mucho registro. La que sigue es nueva."}</p>}
          {r.mejorDia && <p className="mt-3 text-xs text-muted">Tu mejor día: <b className="text-ink">{new Date(`${r.mejorDia.fecha}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long" })}</b> ({r.mejorDia.puntos} puntos).</p>}
        </Tarjeta>
        <Tarjeta className="!p-4">
          <p className="lab">Para la próxima semana</p>
          {r.consejos.length ? <ul className="mt-2 space-y-2 text-sm">{r.consejos.map((c) => <li key={c} className="flex gap-2"><span className="text-ember">→</span>{c}</li>)}</ul>
            : <p className="mt-2 text-sm text-muted">Vas muy bien. Sigue igual y sube un poco el reto en el gym.</p>}
        </Tarjeta>
      </div>
    </div>
  );
}
