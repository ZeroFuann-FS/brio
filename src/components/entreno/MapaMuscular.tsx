import { useEffect, useState } from "react";
import { MUSCULOS, fotosEjercicio, type Musculo } from "../../data/ejercicios";

/** Alterna la foto inicial y final del ejercicio, como animación. */
export function AnimEjercicio({ id, className = "", alt = "" }: { id: string; className?: string; alt?: string }) {
  const [f0, f1] = fotosEjercicio(id);
  const [paso, setPaso] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setPaso((p) => 1 - p), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <img src={f0} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <img src={f1} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style={{ opacity: paso }} />
    </div>
  );
}

/** Miniatura fija (primera foto). */
export function FotoEjercicio({ id, size = 48 }: { id: string; size?: number }) {
  return <img src={fotosEjercicio(id)[0]} alt="" loading="lazy" className="shrink-0 rounded-[11px] border border-line bg-white object-cover" style={{ width: size, height: size }} />;
}

type Zonas = Partial<Record<Musculo, number>>;

function color(n: number | undefined, max: number) {
  if (!n) return "var(--color-track)";
  const t = Math.min(1, n / max);
  return `color-mix(in oklab, var(--color-lime) ${Math.round(30 + t * 70)}%, var(--color-track))`;
}

/** Figura simplificada de frente y espalda. */
function Figura({ lado, z, max, resaltar }: { lado: "frente" | "espalda"; z: Zonas; max: number; resaltar?: Musculo[] }) {
  const c = (m: Musculo) => (resaltar ? (resaltar.includes(m) ? "var(--color-lime)" : "var(--color-track)") : color(z[m], max));
  const base = "var(--color-line)";
  const borde = { stroke: "var(--color-bg)", strokeWidth: 1.2 };
  return (
    <svg viewBox="0 0 120 250" className="h-full w-full" aria-hidden>
      {/* silueta */}
      <circle cx="60" cy="18" r="12" fill={base} />
      <rect x="54" y="28" width="12" height="10" rx="3" fill={base} />
      <rect x="40" y="132" width="40" height="14" rx="6" fill={base} />
      <ellipse cx="22" cy="140" rx="5" ry="7" fill={base} />
      <ellipse cx="98" cy="140" rx="5" ry="7" fill={base} />
      <ellipse cx="49" cy="240" rx="8" ry="5" fill={base} />
      <ellipse cx="71" cy="240" rx="8" ry="5" fill={base} />
      {lado === "frente" ? (
        <g {...borde}>
          <path d="M46 36 L60 40 L74 36 L72 44 L48 44 Z" fill={c("trapecio")} />
          <circle cx="35" cy="52" r="10" fill={c("hombros")} />
          <circle cx="85" cy="52" r="10" fill={c("hombros")} />
          <path d="M44 46 Q52 42 59 46 L59 72 Q50 76 43 68 Z" fill={c("pecho")} />
          <path d="M76 46 Q68 42 61 46 L61 72 Q70 76 77 68 Z" fill={c("pecho")} />
          <ellipse cx="29" cy="80" rx="6.5" ry="15" fill={c("biceps")} />
          <ellipse cx="91" cy="80" rx="6.5" ry="15" fill={c("biceps")} />
          <ellipse cx="24" cy="112" rx="5.5" ry="16" fill={c("antebrazos")} />
          <ellipse cx="96" cy="112" rx="5.5" ry="16" fill={c("antebrazos")} />
          <rect x="49" y="75" width="22" height="52" rx="7" fill={c("abdomen")} />
          <path d="M42 76 L48 78 L48 124 L42 118 Z" fill={c("abdomen")} />
          <path d="M78 76 L72 78 L72 124 L78 118 Z" fill={c("abdomen")} />
          <ellipse cx="49" cy="172" rx="10" ry="27" fill={c("cuadriceps")} />
          <ellipse cx="71" cy="172" rx="10" ry="27" fill={c("cuadriceps")} />
          <ellipse cx="57.5" cy="160" rx="3" ry="14" fill={c("aductores")} />
          <ellipse cx="62.5" cy="160" rx="3" ry="14" fill={c("aductores")} />
          <ellipse cx="49" cy="215" rx="6" ry="18" fill={c("pantorrillas")} />
          <ellipse cx="71" cy="215" rx="6" ry="18" fill={c("pantorrillas")} />
        </g>
      ) : (
        <g {...borde}>
          <path d="M46 34 L60 30 L74 34 L68 62 L60 68 L52 62 Z" fill={c("trapecio")} />
          <circle cx="35" cy="52" r="10" fill={c("hombros")} />
          <circle cx="85" cy="52" r="10" fill={c("hombros")} />
          <path d="M42 58 L52 64 L56 100 L46 104 Q40 84 42 58 Z" fill={c("dorsales")} />
          <path d="M78 58 L68 64 L64 100 L74 104 Q80 84 78 58 Z" fill={c("dorsales")} />
          <path d="M53 66 L60 70 L67 66 L64 96 L56 96 Z" fill={c("espalda-media")} />
          <ellipse cx="29" cy="80" rx="6.5" ry="15" fill={c("triceps")} />
          <ellipse cx="91" cy="80" rx="6.5" ry="15" fill={c("triceps")} />
          <ellipse cx="24" cy="112" rx="5.5" ry="16" fill={c("antebrazos")} />
          <ellipse cx="96" cy="112" rx="5.5" ry="16" fill={c("antebrazos")} />
          <rect x="49" y="102" width="22" height="26" rx="6" fill={c("lumbar")} />
          <circle cx="51" cy="146" r="12" fill={c("gluteos")} />
          <circle cx="69" cy="146" r="12" fill={c("gluteos")} />
          <ellipse cx="49" cy="182" rx="9.5" ry="22" fill={c("femorales")} />
          <ellipse cx="71" cy="182" rx="9.5" ry="22" fill={c("femorales")} />
          <ellipse cx="49" cy="217" rx="7" ry="17" fill={c("pantorrillas")} />
          <ellipse cx="71" cy="217" rx="7" ry="17" fill={c("pantorrillas")} />
        </g>
      )}
    </svg>
  );
}

/** Mapa muscular: con `zonas` colorea por series; con `resaltar` marca músculos (detalle de ejercicio). */
export default function MapaMuscular({ zonas = {}, resaltar, compacto = false }: { zonas?: Zonas; resaltar?: Musculo[]; compacto?: boolean }) {
  const max = 12; // ~12 series por semana = verde intenso
  const lista = MUSCULOS.filter((m) => (zonas[m.id] ?? 0) > 0).sort((a, b) => (zonas[b.id] ?? 0) - (zonas[a.id] ?? 0));
  return (
    <div className={compacto ? "" : "grid gap-4 sm:grid-cols-[1fr_1fr]"}>
      <div className={`mx-auto grid w-full grid-cols-2 gap-2 ${compacto ? "max-w-[220px]" : "max-w-[300px]"}`}>
        <div><div className="aspect-[12/25]"><Figura lado="frente" z={zonas} max={max} resaltar={resaltar} /></div><p className="lab mt-1 text-center">Frente</p></div>
        <div><div className="aspect-[12/25]"><Figura lado="espalda" z={zonas} max={max} resaltar={resaltar} /></div><p className="lab mt-1 text-center">Espalda</p></div>
      </div>
      {!compacto && !resaltar && (
        <div className="self-center">
          {lista.length ? (
            <ul className="space-y-1.5">
              {lista.map((m) => {
                const n = zonas[m.id] ?? 0;
                return (
                  <li key={m.id} className="grid grid-cols-[96px_1fr_44px] items-center gap-2 text-sm">
                    <span>{m.t}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-track"><span className="block h-full rounded-full bg-lime" style={{ width: `${Math.min(100, (n / max) * 100)}%` }} /></span>
                    <span className="num text-right text-muted">{n % 1 ? n.toFixed(1) : n}</span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-muted">Aún no entrenas esta semana. Cuando registres series, aquí verás qué músculos trabajaste.</p>}
          {lista.length > 0 && <p className="mt-3 text-xs text-muted">Series de los últimos 7 días. Entre 10 y 20 por músculo a la semana es un buen rango para crecer.</p>}
        </div>
      )}
    </div>
  );
}
