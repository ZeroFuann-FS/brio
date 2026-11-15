import { useEffect, useState } from "react";
import { MUSCULOS, NOMBRE_MUSCULO, fotosEjercicio, type Musculo } from "../../data/ejercicios";

/** Alterna suavemente la foto inicial y final del ejercicio. */
export function AnimEjercicio({ id, className = "", alt = "" }: { id: string; className?: string; alt?: string }) {
  const [f0, f1] = fotosEjercicio(id);
  const [paso, setPaso] = useState(0);
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (pausa || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setPaso((p) => 1 - p), 1400);
    return () => clearInterval(t);
  }, [pausa]);
  return (
    <button type="button" onClick={() => setPausa((x) => !x)} aria-label={pausa ? "Reanudar animación" : "Pausar animación"}
      className={`group relative block overflow-hidden bg-white ${className}`}>
      <img src={f0} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      <img src={f1} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out" style={{ opacity: paso }} />
      <span className="absolute bottom-2 left-2 flex gap-1">
        {[0, 1].map((i) => <i key={i} className={`h-1.5 w-5 rounded-full transition ${paso === i ? "bg-lime" : "bg-white/70"}`} />)}
      </span>
      <span className="lab absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 !text-[10px] !text-white opacity-0 transition group-hover:opacity-100">{pausa ? "Reanudar" : "Pausar"}</span>
    </button>
  );
}

/** Miniatura fija (primera foto). */
export function FotoEjercicio({ id, size = 48 }: { id: string; size?: number }) {
  return <img src={fotosEjercicio(id)[0]} alt="" loading="lazy" className="shrink-0 rounded-[11px] border border-line bg-white object-cover" style={{ width: size, height: size }} />;
}

type Zonas = Partial<Record<Musculo, number>>;
const MAX = 12; // ~12 series por semana = color pleno

function relleno(n: number | undefined) {
  if (!n) return "var(--mm-vacio)";
  const t = Math.min(1, n / MAX);
  return `color-mix(in oklab, var(--color-lime) ${Math.round(28 + t * 72)}%, var(--mm-vacio))`;
}

/* Medio cuerpo (lado izquierdo de la figura). El derecho se dibuja reflejado. viewBox 200×420, centro x=100. */
const SILUETA = "M100 58 C92 58 88 62 88 66 C78 68 66 70 58 76 C50 82 46 92 45 104 C43 120 42 136 41 150 C39 170 35 192 34 214 C33 224 31 234 30 242 C29 248 33 250 36 246 C38 240 41 232 44 222 C48 204 52 182 55 162 C57 150 60 136 63 124 L65 128 C65 146 66 164 68 180 C69 192 66 204 63 216 C59 240 59 266 63 292 C65 304 66 312 64 324 C61 346 63 370 68 392 C69 400 66 406 64 410 C63 414 70 416 80 415 C88 414 90 410 89 404 C87 392 89 372 91 352 C92 336 92 320 93 304 C95 276 97 250 98 232 L100 226 Z";

const FRENTE: { m: Musculo; d: string }[] = [
  { m: "trapecio", d: "M89 66 C82 68 72 70 64 74 C72 76 80 76 88 77 Z" },
  { m: "hombros", d: "M63 75 C52 78 46 88 46 102 C50 108 56 108 62 104 C64 94 66 84 70 78 Z" },
  { m: "pecho", d: "M98 80 C90 77 80 77 72 80 C66 86 64 96 66 106 C72 114 86 116 98 110 Z" },
  { m: "biceps", d: "M48 108 C44 120 44 134 46 146 C50 152 56 150 59 144 C61 132 62 120 61 108 C57 105 52 105 48 108 Z" },
  { m: "antebrazos", d: "M45 154 C40 170 37 190 36 210 L44 214 C49 196 53 178 57 160 C55 152 49 150 45 154 Z" },
  { m: "abdomen", d: "M88 118 L98 118 L98 134 L88 134 C87 128 87 122 88 118 Z M88 137 L98 137 L98 153 L88 153 Z M88 156 L98 156 L98 172 L88 172 Z M88 175 L98 175 L98 200 C94 200 90 196 88 190 Z" },
  { m: "abdomen", d: "M70 118 C68 136 68 156 71 174 C75 186 80 194 85 198 L85 120 C80 116 75 116 70 118 Z" },
  { m: "cuadriceps", d: "M68 214 C62 236 61 262 65 290 C70 298 76 296 78 288 C78 262 77 238 76 218 Z M78 220 C77 244 78 270 81 292 C86 298 92 296 94 288 C95 264 94 242 91 224 Z M90 270 C88 282 88 294 92 302 C97 302 98 296 97 286 Z" },
  { m: "aductores", d: "M92 222 C95 226 98 230 99 236 L97 268 C94 256 92 240 92 222 Z" },
  { m: "pantorrillas", d: "M66 312 C61 336 62 360 68 380 L75 380 C78 356 78 332 75 312 Z M84 314 C88 338 88 362 86 382 L80 382 C79 358 79 334 81 314 Z" },
];
const ESPALDA: { m: Musculo; d: string }[] = [
  { m: "trapecio", d: "M100 54 L89 66 C80 70 70 72 64 76 C76 82 86 92 92 108 L100 128 Z" },
  { m: "hombros", d: "M63 75 C52 78 46 88 46 102 C50 108 56 108 62 104 C64 94 66 84 70 78 Z" },
  { m: "espalda-media", d: "M70 84 C66 92 67 100 72 104 C80 104 86 100 88 94 C84 88 78 84 70 84 Z M90 98 C93 108 96 118 98 128 L98 100 Z" },
  { m: "dorsales", d: "M68 106 C66 128 69 150 76 166 C82 176 90 182 96 184 L96 150 C92 132 86 118 78 108 Z" },
  { m: "triceps", d: "M48 106 C43 120 43 136 46 148 C52 152 57 150 60 144 C62 132 62 118 61 106 C57 102 52 102 48 106 Z" },
  { m: "antebrazos", d: "M45 154 C40 170 37 190 36 210 L44 214 C49 196 53 178 57 160 C55 152 49 150 45 154 Z" },
  { m: "lumbar", d: "M88 168 C86 180 86 192 88 202 L98 206 L98 168 Z" },
  { m: "gluteos", d: "M70 206 C62 222 63 242 72 254 C84 260 94 258 99 250 L99 210 C90 204 80 202 70 206 Z" },
  { m: "femorales", d: "M66 262 C62 284 63 306 68 322 L79 322 C80 302 80 282 79 264 Z M82 264 C83 284 84 304 84 322 L94 320 C97 300 97 282 95 264 Z" },
  { m: "pantorrillas", d: "M66 330 C58 350 62 368 70 380 C78 374 81 358 80 340 C77 332 72 328 66 330 Z M83 332 C82 352 84 368 88 380 C96 366 96 348 92 334 Z" },
];

function Figura({ lado, z, resaltar, sec }: { lado: "frente" | "espalda"; z: Zonas; resaltar?: Musculo[]; sec?: Musculo[] }) {
  const partes = lado === "frente" ? FRENTE : ESPALDA;
  const color = (m: Musculo) => resaltar
    ? (resaltar.includes(m) ? "var(--color-lime)" : sec?.includes(m) ? "color-mix(in oklab, var(--color-lime) 40%, var(--mm-vacio))" : "var(--mm-vacio)")
    : relleno(z[m]);
  const mitad = (
    <>
      <path d={SILUETA} fill="var(--mm-piel)" />
      {partes.map((p, i) => (
        <path key={i} d={p.d} fill={color(p.m)} stroke="var(--mm-linea)" strokeWidth="0.9" strokeLinejoin="round">
          <title>{NOMBRE_MUSCULO[p.m]}{z[p.m] ? ` · ${z[p.m]} series` : ""}</title>
        </path>
      ))}
    </>
  );
  return (
    <svg viewBox="0 0 200 420" className="h-full w-full" role="img" aria-label={`Músculos, vista de ${lado}`}>
      <ellipse cx="100" cy="30" rx="17" ry="22" fill="var(--mm-piel)" />
      <path d="M90 48 L110 48 L112 64 L88 64 Z" fill="var(--mm-piel)" />
      <g>{mitad}</g>
      <g transform="translate(200 0) scale(-1 1)">{mitad}</g>
    </svg>
  );
}

/** Mapa muscular. Con `zonas` colorea por series; con `resaltar` marca músculos principales (y `sec` los secundarios). */
export default function MapaMuscular({ zonas = {}, resaltar, sec, compacto = false, mini = false }: { zonas?: Zonas; resaltar?: Musculo[]; sec?: Musculo[]; compacto?: boolean; mini?: boolean }) {
  const lista = MUSCULOS.filter((m) => (zonas[m.id] ?? 0) > 0).sort((a, b) => (zonas[b.id] ?? 0) - (zonas[a.id] ?? 0));
  const figuras = (
    <div className={`mm mx-auto grid w-full grid-cols-2 ${mini ? "gap-0.5" : "gap-2"} ${compacto ? "max-w-[240px]" : "max-w-[320px]"}`}>
      {(["frente", "espalda"] as const).map((l) => (
        <div key={l}>
          <div className="aspect-[200/420]"><Figura lado={l} z={zonas} resaltar={resaltar} sec={sec} /></div>
          {!mini && <p className="lab mt-1 text-center">{l === "frente" ? "Frente" : "Espalda"}</p>}
        </div>
      ))}
    </div>
  );
  if (compacto || mini || resaltar) return figuras;
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr] md:grid-cols-1 lg:grid-cols-[1fr_1fr]">
      <div>
        {figuras}
        <div className="mx-auto mt-3 flex max-w-[260px] items-center gap-2">
          <span className="lab !text-[10px]">0</span>
          <span className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, var(--mm-vacio), var(--color-lime))` }} />
          <span className="lab !text-[10px]">12+ series</span>
        </div>
      </div>
      <div className="self-center">
        {lista.length ? (
          <ul className="space-y-1.5">
            {lista.map((m) => {
              const n = zonas[m.id] ?? 0;
              return (
                <li key={m.id} className="grid grid-cols-[100px_1fr_40px] items-center gap-2 text-sm">
                  <span>{m.t}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-track"><span className="block h-full rounded-full bg-lime" style={{ width: `${Math.min(100, (n / MAX) * 100)}%` }} /></span>
                  <span className="num text-right text-muted">{n % 1 ? n.toFixed(1) : n}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted">Aún no entrenas esta semana. Cuando registres series, aquí verás qué músculos trabajaste.</p>}
        {lista.length > 0 && <p className="mt-3 text-xs text-muted">Series de los últimos 7 días. Entre 10 y 20 por músculo a la semana es un buen rango para crecer.</p>}
      </div>
    </div>
  );
}
