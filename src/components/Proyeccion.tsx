import { useId } from "react";
import { motion } from "motion/react";
import { diasEntre, fechaCorta, pesoEnFecha, proyeccion, type DatosCalculo } from "../lib/calc";
import { ease } from "./ui";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

type Props = {
  datos: DatosCalculo;
  pesoActual: number;
  motivo?: { titulo: string; fecha: string };
  reales?: { fecha: string; kg: number }[];
  alto?: number;
};

/** Curva de cómo baja (o sube) tu peso hasta la meta, con fechas. */
export default function Proyeccion({ datos, pesoActual, motivo, reales = [], alto = 190 }: Props) {
  const gid = useId().replace(/:/g, "");
  const { puntos, fechaMeta } = proyeccion(datos, pesoActual);
  if (puntos.length < 2) return null;

  const W = 340, H = alto, PL = 34, PR = 14, PT = 26, PB = 26;
  const inicio = reales.length ? (reales[0].fecha < puntos[0].fecha ? reales[0].fecha : puntos[0].fecha) : puntos[0].fecha;
  const fin = puntos[puntos.length - 1].fecha;
  const total = Math.max(1, diasEntre(inicio, fin));
  const kgs = [...puntos.map((p) => p.kg), ...reales.map((r) => r.kg)];
  const kMax = Math.ceil(Math.max(...kgs) + 1), kMin = Math.floor(Math.min(...kgs) - 1);

  const x = (f: string) => PL + (diasEntre(inicio, f) / total) * (W - PL - PR);
  const y = (kg: number) => PT + ((kMax - kg) / (kMax - kMin)) * (H - PT - PB);

  const linea = puntos.map((p, i) => `${i ? "L" : "M"}${x(p.fecha).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  const area = `${linea} L${x(fin).toFixed(1)},${H - PB} L${x(puntos[0].fecha).toFixed(1)},${H - PB} Z`;

  // marcas de mes (máx ~5)
  const meses: { f: string; t: string }[] = [];
  const [y0, m0] = inicio.split("-").map(Number);
  const nMeses = Math.ceil(total / 30) + 1;
  const cada = Math.max(1, Math.ceil(nMeses / 5));
  for (let i = 1; i <= nMeses; i += cada) {
    const m = (m0 - 1 + i) % 12, a = y0 + Math.floor((m0 - 1 + i) / 12);
    const f = `${a}-${String(m + 1).padStart(2, "0")}-01`;
    if (f > inicio && f < fin) meses.push({ f, t: m === 0 ? `ene ${String(a).slice(2)}` : MESES[m] });
  }

  // marcas de peso cada 5 kg
  const marcasKg: number[] = [];
  for (let k = Math.ceil(kMin / 5) * 5; k <= kMax; k += 5) marcasKg.push(k);

  const mostrarMotivo = motivo && motivo.fecha > puntos[0].fecha && motivo.fecha < fin;
  const kgMotivo = mostrarMotivo ? pesoEnFecha(datos, pesoActual, motivo.fecha) : 0;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img"
        aria-label={`Proyección: de ${pesoActual} kg a ${datos.pesoMeta} kg${fechaMeta ? ` el ${fechaCorta(fechaMeta)}` : ""}`}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--lime)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {marcasKg.map((k) => (
          <g key={k}>
            <line x1={PL} x2={W - PR} y1={y(k)} y2={y(k)} stroke="var(--line)" />
            <text x={PL - 6} y={y(k) + 3.5} textAnchor="end" fontSize="11" fontFamily="Barlow Condensed, sans-serif" fill="var(--muted)">{k}</text>
          </g>
        ))}
        {meses.map((m) => (
          <text key={m.f} x={x(m.f)} y={H - 8} textAnchor="middle" fontSize="11" fontFamily="Barlow Condensed, sans-serif" fill="var(--muted)">{m.t}</text>
        ))}

        <motion.path d={area} fill={`url(#g${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} />
        <motion.path d={linea} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />

        {mostrarMotivo && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <line x1={x(motivo.fecha)} x2={x(motivo.fecha)} y1={PT - 6} y2={H - PB} stroke="var(--lime-ink)" strokeDasharray="3 3" />
            <circle cx={x(motivo.fecha)} cy={y(kgMotivo)} r={5} fill="var(--lime)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={x(motivo.fecha) > W * 0.6 ? x(motivo.fecha) - 8 : x(motivo.fecha) + 8} textAnchor={x(motivo.fecha) > W * 0.6 ? "end" : "start"} y={y(kgMotivo) - 14} fontSize="12" fontWeight="700" fontFamily="Barlow Condensed, sans-serif" fill="var(--ink)">~{kgMotivo.toFixed(1)} kg · {motivo.titulo.toLowerCase()}</text>
          </motion.g>
        )}

        {reales.map((r) => (
          <circle key={r.fecha} cx={x(r.fecha)} cy={y(r.kg)} r={3.5} fill="var(--ink)" opacity={0.55} />
        ))}

        {/* inicio */}
        <circle cx={x(puntos[0].fecha)} cy={y(pesoActual)} r={4.5} fill="var(--ink)" />
        <text x={x(puntos[0].fecha) + 8} y={y(pesoActual) - 8} fontSize="12" fontWeight="700" fontFamily="Barlow Condensed, sans-serif" fill="var(--ink)">{pesoActual.toFixed(1)} kg hoy</text>

        {/* meta */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.4 }}>
          <circle cx={x(fin)} cy={y(datos.pesoMeta)} r={6} fill="var(--lime)" stroke="var(--ink)" strokeWidth={1.5} />
          <text x={W - PR + 4} y={y(datos.pesoMeta) - 30} textAnchor="end" fontSize="12" fontWeight="700" fontFamily="Barlow Condensed, sans-serif" fill="var(--ink)">
            {datos.pesoMeta} kg{fechaMeta ? ` · ${fechaCorta(fechaMeta)}` : ""}
          </text>
        </motion.g>
      </svg>
      <div className="lab mt-2 flex flex-wrap gap-x-4 gap-y-1 !tracking-[0.08em]">
        <span><span className="mr-1 inline-block h-[3px] w-3 rounded-full bg-ink align-middle" />Proyección</span>
        {mostrarMotivo && <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-lime-ink align-middle" />{motivo.titulo} ({fechaCorta(motivo.fecha, false)})</span>}
        {reales.length > 1 && <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-ink align-middle" />Tu peso real</span>}
      </div>
    </div>
  );
}
