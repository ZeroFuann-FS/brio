/** Tipos y cálculos del módulo de entrenamiento. */
import { EJERCICIOS, ejercicioPorId, type Ejercicio, type Musculo } from "../data/ejercicios";
import { hoyISO, sumarDias } from "./calc";

export interface EjRutina { ej: string; series: number; reps: string; descanso: number }
/** semana: días de la semana en que toca (0 = domingo … 6 = sábado). */
export interface DiaRutina { id: string; nombre: string; ejercicios: EjRutina[]; semana?: number[] }
export interface Rutina { id: string; nombre: string; dias: DiaRutina[]; plantilla?: string }
export interface Serie { kg: number; reps: number; min?: number; km?: number; hecha: boolean }
export interface EjSesion { ej: string; reps: string; descanso: number; series: Serie[] }
export interface Sesion {
  id: string; fecha: string; inicio: number; fin?: number; nombre: string;
  rutinaId?: string; diaId?: string; ejercicios: EjSesion[]; records?: string[];
}
export type Lugar = "gym" | "basico" | "casa";
/** pasoKg: de cuánto en cuánto suben las pesas de su gym (discos y mancuernas suelen ir de 5 en 5). */
export interface PrefsEntreno { rutinas: Rutina[]; activa?: string; lugar?: Lugar; pasoKg?: number }
export const PASO_KG = 5;
export const PASOS_KG = [2.5, 5, 10];

export const uidE = () => Math.random().toString(36).slice(2, 10);

/** Texto corto de una serie: "40×12", "15 reps" (sin peso) o "25′ · 3.2 km" (cardio). */
export const textoSerie = (x: Serie) => (x.min || x.km ? [x.min ? `${x.min}′` : "", x.km ? `${x.km} km` : ""].filter(Boolean).join(" · ") : x.kg ? `${x.kg}×${x.reps}` : `${x.reps} reps`);

/** 1RM estimado (Epley). */
export const e1rm = (kg: number, reps: number) => (reps <= 0 || kg <= 0 ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));

export const seriesHechas = (s: Sesion) => s.ejercicios.reduce((a, e) => a + e.series.filter((x) => x.hecha).length, 0);
export const volumen = (s: Sesion) => Math.round(s.ejercicios.reduce((a, e) => a + e.series.reduce((b, x) => b + (x.hecha ? x.kg * x.reps : 0), 0), 0));
export const duracionMin = (s: Sesion) => Math.max(1, Math.round(((s.fin ?? Date.now()) - s.inicio) / 60000));

/** Series de la última vez que hizo ese ejercicio (para "anterior" y para prellenar). */
export function ultimaVez(sesiones: Sesion[], ej: string): Serie[] | null {
  for (let i = sesiones.length - 1; i >= 0; i--) {
    const e = sesiones[i].ejercicios.find((x) => x.ej === ej);
    const hechas = e?.series.filter((x) => x.hecha);
    if (hechas?.length) return hechas;
  }
  return null;
}

export interface Marca { kg: number; reps: number; e1rm: number; fecha: string }
/** Mejor marca por 1RM estimado. */
export function mejorMarca(sesiones: Sesion[], ej: string): Marca | null {
  let mejor: Marca | null = null;
  for (const s of sesiones) for (const e of s.ejercicios) if (e.ej === ej) for (const x of e.series) {
    if (!x.hecha) continue;
    const v = e1rm(x.kg, x.reps);
    if (v > 0 && (!mejor || v > mejor.e1rm)) mejor = { kg: x.kg, reps: x.reps, e1rm: v, fecha: s.fecha };
  }
  return mejor;
}

/** Ejercicios de la sesión que superan la mejor marca anterior. */
export function recordsDe(s: Sesion, previas: Sesion[]): string[] {
  const r: string[] = [];
  for (const e of s.ejercicios) {
    const antes = mejorMarca(previas, e.ej);
    const hoy = Math.max(0, ...e.series.filter((x) => x.hecha).map((x) => e1rm(x.kg, x.reps)));
    if (hoy > 0 && antes && hoy > antes.e1rm + 0.01) r.push(e.ej);
  }
  return r;
}

/** Series por músculo en los últimos 7 días (principal = 1, secundario = 0.5). */
export function seriesPorMusculo(sesiones: Sesion[], dias = 7): Partial<Record<Musculo, number>> {
  const desde = sumarDias(hoyISO(), -(dias - 1));
  const t: Partial<Record<Musculo, number>> = {};
  for (const s of sesiones) {
    if (s.fecha < desde) continue;
    for (const e of s.ejercicios) {
      const info = ejercicioPorId(e.ej);
      const n = e.series.filter((x) => x.hecha).length;
      if (!info || !n || info.cardio) continue;
      for (const m of info.m) t[m] = (t[m] ?? 0) + n;
      for (const m of info.s) t[m] = (t[m] ?? 0) + n * 0.5;
    }
  }
  return t;
}

/** Día de la rutina que sigue después del último que entrenó. */
export function siguienteDia(r: Rutina, sesiones: Sesion[]): DiaRutina | undefined {
  if (!r.dias.length) return undefined;
  const ultima = [...sesiones].reverse().find((s) => s.rutinaId === r.id && s.diaId);
  const i = ultima ? r.dias.findIndex((d) => d.id === ultima.diaId) : -1;
  return r.dias[(i + 1) % r.dias.length];
}

/** Arma una sesión nueva a partir de un día de rutina, prellenando con la última vez. */
export function nuevaSesion(sesiones: Sesion[], r?: Rutina, d?: DiaRutina): Sesion {
  const ejercicios: EjSesion[] = (d?.ejercicios ?? []).map((x) => serieInicial(sesiones, x.ej, x.series, x.reps, x.descanso));
  return { id: uidE(), fecha: hoyISO(), inicio: Date.now(), nombre: d ? d.nombre : "Entreno libre", rutinaId: r?.id, diaId: d?.id, ejercicios };
}

export function serieInicial(sesiones: Sesion[], ej: string, n = 3, reps = "10", descanso = 90): EjSesion {
  const prev = ultimaVez(sesiones, ej);
  const objetivo = Number((reps.match(/\d+/g) ?? ["10"]).slice(-1)[0]) || 10;
  const cardio = ejercicioPorId(ej)?.cardio;
  const series: Serie[] = Array.from({ length: n }, (_, i) => {
    const p = prev?.[i] ?? prev?.[prev.length - 1];
    return cardio ? { kg: 0, reps: 0, min: p?.min ?? 20, hecha: false } : { kg: p?.kg ?? 0, reps: p?.reps ?? objetivo, hecha: false };
  });
  return { ej, reps, descanso, series };
}

/** Racha de semanas con al menos un entreno. */
export function entrenosSemana(sesiones: Sesion[]) {
  const desde = sumarDias(hoyISO(), -6);
  return sesiones.filter((s) => s.fecha >= desde).length;
}

export const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DIAS_CORTOS = ["D", "L", "M", "M", "J", "V", "S"];
/** Orden lunes → domingo. */
export const SEMANA_LD = [1, 2, 3, 4, 5, 6, 0];

/** Días de la semana sugeridos según cuántos días entrena. */
export function semanaSugerida(n: number): number[] {
  return ({ 1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] } as Record<number, number[]>)[Math.min(7, Math.max(1, n))];
}

/** Reparte los días de la rutina en los días de la semana elegidos (en ciclo). */
export function asignarSemana(r: Rutina, dias: number[]): Rutina {
  const orden = SEMANA_LD.filter((d) => dias.includes(d));
  const asign: Record<string, number[]> = {};
  orden.forEach((wd, i) => { const d = r.dias[i % r.dias.length]; (asign[d.id] ??= []).push(wd); });
  return { ...r, dias: r.dias.map((d) => ({ ...d, semana: asign[d.id] ?? [] })) };
}

export const tieneSemana = (r: Rutina) => r.dias.some((d) => d.semana?.length);
export const diaDeSemana = (r: Rutina, wd: number) => r.dias.find((d) => d.semana?.includes(wd));

/** Lunes de la semana de una fecha ISO. */
export function lunesDe(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  const wd = d.getDay();
  d.setDate(d.getDate() - ((wd + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Qué toca hoy según la rutina con días de la semana. */
export function planHoy(r: Rutina, sesiones: Sesion[], hoy: string) {
  const wd = new Date(`${hoy}T12:00:00`).getDay();
  const hechoHoy = sesiones.some((s) => s.fecha === hoy);
  const deHoy = diaDeSemana(r, wd);
  let proximo: { wd: number; dia: DiaRutina } | undefined;
  for (let k = 1; k <= 7; k++) {
    const w = (wd + k) % 7, d = diaDeSemana(r, w);
    if (d) { proximo = { wd: w, dia: d }; break; }
  }
  return { wd, deHoy, hechoHoy, proximo };
}

/** Número superior del rango de reps ("8-12" → 12). */
export const repsTope = (reps: string) => Number((reps.match(/\d+/g) ?? []).slice(-1)[0]) || 0;

/** ¿Le toca subir peso? Si la última vez llegó al tope de reps en todas las series. Sugiere el siguiente peso que existe en su gym. */
export function tocaSubir(sesiones: Sesion[], ej: string, reps: string, paso = PASO_KG): number | null {
  if (/s|min/i.test(reps)) return null;
  const tope = repsTope(reps);
  const prev = ultimaVez(sesiones, ej);
  if (!tope || !prev?.length || prev.length < 2 || !prev.every((x) => x.reps >= tope && x.kg > 0)) return null;
  const kg = Math.max(...prev.map((x) => x.kg));
  return siguientePeso(kg, paso);
}

/** El siguiente peso arriba de kg en pasos de `paso` (42 kg con paso 5 → 45; 45 → 50). */
export const siguientePeso = (kg: number, paso = PASO_KG) => Math.round((Math.floor(kg / paso + 1e-9) + 1) * paso * 10) / 10;

/** Historial de 1RM estimado por fecha (para la gráfica de progreso). */
export function progreso(sesiones: Sesion[], ej: string): { fecha: string; v: number }[] {
  const out: { fecha: string; v: number }[] = [];
  for (const s of sesiones) {
    const e = s.ejercicios.find((x) => x.ej === ej);
    if (!e) continue;
    const v = Math.max(0, ...e.series.filter((x) => x.hecha).map((x) => e1rm(x.kg, x.reps)));
    if (v > 0) out.push({ fecha: s.fecha, v: Math.round(v * 10) / 10 });
  }
  return out;
}

/** Minutos aproximados de un día de rutina. */
export const minutosDia = (d: Pick<DiaRutina, "ejercicios">) => Math.round(d.ejercicios.reduce((a, e) => a + e.series * (0.75 + e.descanso / 60), 0) + 5);

/** "45 min", "1 h", "1 h 15 min". */
export function formatoMin(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Cronómetro: "4:05" o, pasando la hora, "1:04:05". */
export function reloj(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/* ---------- Recomendaciones ---------- */

/** Equipo disponible según dónde entrena (nombres del campo `eq`). */
const EQ_BASICO = new Set(["Mancuernas", "Barra", "Barra Z", "Peso corporal", "Barra fija / paralelas", "Barra fija", "Pesa rusa", "Banda", "Rueda abdominal", "Cuerda"]);
const EQ_CASA = new Set(["Peso corporal", "Mancuernas", "Pesa rusa", "Banda", "Rueda abdominal", "Cuerda"]);
export const hayEquipo = (eq: string, lugar?: Lugar) => (!lugar || lugar === "gym" ? true : (lugar === "basico" ? EQ_BASICO : EQ_CASA).has(eq));

/** Los que más rinden por músculo (de mejor a menos), para recomendar. */
const MEJORES: Partial<Record<Musculo, string[]>> = {
  pecho: ["press-banca", "press-mancuernas", "press-inclinado", "press-maquina", "fondos-pecho", "lagartijas", "cruce-poleas", "peck-deck"],
  hombros: ["press-hombro-sentado", "press-militar", "press-hombro-maquina", "elevaciones-laterales", "lateral-polea", "vuelo-posterior-maquina", "face-pull", "pajaros", "press-arnold"],
  biceps: ["curl-mancuernas", "curl-barra", "curl-inclinado", "curl-martillo", "curl-polea", "curl-predicador", "curl-maquina"],
  triceps: ["triceps-cuerda", "press-frances", "fondos-triceps", "extension-triceps", "triceps-polea", "press-cerrado", "fondos-banco", "lagartijas-cerradas"],
  dorsales: ["dominadas", "jalon-pecho", "jalon-cerrado", "jalon-una-mano", "dominadas-supinas"],
  "espalda-media": ["remo-barra", "remo-mancuerna", "remo-polea", "remo-maquina", "remo-t", "remo-invertido", "remo-pesa-rusa"],
  cuadriceps: ["sentadilla", "prensa", "sentadilla-goblet", "hack-squat", "desplantes-mancuernas", "sentadilla-dividida-mancuernas", "extension-pierna", "sentadilla-libre"],
  femorales: ["peso-muerto-rumano", "curl-femoral-acostado", "curl-femoral-sentado", "peso-muerto-mancuernas", "swing-pesa-rusa", "peso-muerto-una-pierna"],
  gluteos: ["hip-thrust", "puente-gluteo-elevado", "pull-through", "patada-polea", "puente-gluteo", "abductor-maquina"],
  abdomen: ["plancha", "crunch-inverso", "abdominal-polea", "elevacion-piernas", "rueda", "bicho-muerto"],
  lumbar: ["hiperextensiones", "superman", "peso-muerto"],
  pantorrillas: ["pantorrilla-de-pie", "pantorrilla-prensa", "pantorrilla-mancuerna", "pantorrilla-sentado"],
};
const rango = (m: Musculo, id: string) => { const i = MEJORES[m]?.indexOf(id) ?? -1; return i === -1 ? 99 : i; };

/** ¿Es de los más recomendados para su músculo principal? */
export const esRecomendado = (id: string) => { const e = ejercicioPorId(id); return !!e && rango(e.m[0], id) < 3; };

/** Ejercicios que trabajan el mismo músculo, los mejores primero (para cambiar uno por otro). */
export function alternativas(id: string, lugar?: Lugar, excluir: string[] = []): Ejercicio[] {
  const e = ejercicioPorId(id);
  if (!e) return [];
  const m = e.m[0];
  return EJERCICIOS
    .filter((x) => x.id !== id && !excluir.includes(x.id) && x.cardio === e.cardio && x.m[0] === m && hayEquipo(x.eq, lugar))
    .sort((a, b) => rango(m, a.id) - rango(m, b.id) || Number(b.eq === e.eq) - Number(a.eq === e.eq))
    .slice(0, 8);
}

/** Grupos que revisamos para avisar si la rutina los deja cortos. */
// min = series a la semana para no quedarse corto (los secundarios cuentan como media serie)
const GRUPOS_CLAVE: { t: string; m: Musculo[]; min: number }[] = [
  { t: "Pecho", m: ["pecho"], min: 6 }, { t: "Espalda", m: ["dorsales", "espalda-media"], min: 6 }, { t: "Hombros", m: ["hombros"], min: 6 },
  { t: "Bíceps", m: ["biceps"], min: 6 }, { t: "Tríceps", m: ["triceps"], min: 6 }, { t: "Cuádriceps", m: ["cuadriceps"], min: 6 },
  { t: "Femorales", m: ["femorales"], min: 6 }, { t: "Glúteos", m: ["gluteos"], min: 6 },
  // Abdomen y lumbar sostienen todo lo demás (sentadilla, peso muerto, press) y protegen la espalda baja
  { t: "Abdomen", m: ["abdomen"], min: 6 }, { t: "Lumbar", m: ["lumbar"], min: 4 },
];
export interface Faltante { grupo: string; series: number; sugerido?: Ejercicio }

/**
 * Músculos que la rutina trabaja poco a la semana (menos de 6 series, contando los secundarios como media)
 * y el mejor ejercicio para cubrirlos con el equipo que tiene.
 */
export function faltantesRutina(r: Rutina, lugar?: Lugar, max = 3): Faltante[] {
  const conSemana = tieneSemana(r);
  const t: Partial<Record<Musculo, number>> = {};
  const usados = new Set<string>();
  for (const d of r.dias) {
    const veces = conSemana ? d.semana?.length ?? 0 : 1;
    for (const x of d.ejercicios) {
      usados.add(x.ej);
      const info = ejercicioPorId(x.ej);
      if (!info || info.cardio || !veces) continue;
      for (const m of info.m) t[m] = (t[m] ?? 0) + x.series * veces;
      for (const m of info.s) t[m] = (t[m] ?? 0) + x.series * veces * 0.5;
    }
  }
  return GRUPOS_CLAVE
    .map((g) => ({ g, series: g.m.reduce((a, m) => a + (t[m] ?? 0), 0) }))
    .filter((x) => x.series < x.g.min)
    .sort((a, b) => a.series - b.series)
    .slice(0, max)
    .map(({ g, series }) => {
      const ids = g.m.flatMap((m) => MEJORES[m] ?? []);
      const sugerido = ids.map(ejercicioPorId).find((e): e is Ejercicio => !!e && !usados.has(e.id) && hayEquipo(e.eq, lugar));
      return { grupo: g.t, series: Math.round(series), sugerido };
    });
}

/* ---------- Logros durante el entreno ---------- */

/** Mensaje de logro al marcar una serie: récord de peso, récord de fuerza o mejora contra la vez pasada. */
export function logroSerie(sesiones: Sesion[], ej: string, si: number, x: Serie): string | null {
  if (x.kg <= 0 && x.reps <= 0) return null;
  const nombre = ejercicioPorId(ej)?.n ?? "este ejercicio";
  let maxKg = 0, maxRepsSinPeso = 0;
  for (const s of sesiones) for (const e of s.ejercicios) if (e.ej === ej) for (const y of e.series) {
    if (!y.hecha) continue;
    maxKg = Math.max(maxKg, y.kg);
    if (!y.kg) maxRepsSinPeso = Math.max(maxRepsSinPeso, y.reps);
  }
  const marca = mejorMarca(sesiones, ej);
  if (!marca && !maxRepsSinPeso) return null; // primera vez: no hay con qué comparar
  if (x.kg > 0 && x.kg > maxKg && maxKg > 0) return `¡Récord de peso! ${x.kg} kg en ${nombre}`;
  if (x.kg > 0 && marca && e1rm(x.kg, x.reps) > marca.e1rm + 0.01) return `¡Nuevo récord! ${x.kg} kg × ${x.reps} en ${nombre}`;
  if (!x.kg && maxRepsSinPeso && x.reps > maxRepsSinPeso) return `¡Récord de repeticiones! ${x.reps} en ${nombre}`;
  const p = ultimaVez(sesiones, ej)?.[si];
  if (!p) return null;
  if (x.kg > p.kg && x.reps >= p.reps) return `+${Math.round((x.kg - p.kg) * 10) / 10} kg que la vez pasada`;
  if (x.kg >= p.kg && x.reps > p.reps) return `+${x.reps - p.reps} rep${x.reps - p.reps > 1 ? "s" : ""} que la vez pasada`;
  return null;
}

/** Cambia un ejercicio por otro en todo el historial (cuando se registró con el nombre equivocado). */
export function corregirHistorial(sesiones: Sesion[], de: string, a: string): Sesion[] {
  return sesiones.map((s) => (s.ejercicios.some((e) => e.ej === de) || s.records?.includes(de)
    ? { ...s, ejercicios: s.ejercicios.map((e) => (e.ej === de ? { ...e, ej: a } : e)), records: s.records?.map((r) => (r === de ? a : r)) }
    : s));
}

export interface AvisoRutina { tipo: "repetido" | "exceso"; texto: string }
/** Arriba de esto (series directas a la semana) el beneficio extra es poco y el cansancio sí sube. */
const TOPE_SEMANA = 25;

/**
 * Cosas que revisar en la rutina: el mismo ejercicio dos veces en un día
 * y músculos con demasiadas series directas a la semana.
 */
export function revisarRutina(r: Rutina): AvisoRutina[] {
  const out: AvisoRutina[] = [];
  const conSemana = tieneSemana(r);
  const directas: Partial<Record<Musculo, number>> = {};
  for (const d of r.dias) {
    const veces = conSemana ? d.semana?.length ?? 0 : 1;
    const cuenta = new Map<string, number>();
    for (const x of d.ejercicios) {
      cuenta.set(x.ej, (cuenta.get(x.ej) ?? 0) + 1);
      const info = ejercicioPorId(x.ej);
      if (info && !info.cardio && veces) for (const m of info.m) directas[m] = (directas[m] ?? 0) + x.series * veces;
    }
    for (const [ej, n] of cuenta) if (n > 1) {
      out.push({ tipo: "repetido", texto: `${ejercicioPorId(ej)?.n ?? ej} está ${n} veces en ${d.nombre || "un día"}. ¿Querías otro ejercicio?` });
    }
  }
  const altos = GRUPOS_CLAVE.map((g) => ({ t: g.t, n: g.m.reduce((a, m) => a + (directas[m] ?? 0), 0) }))
    .filter((x) => x.n > TOPE_SEMANA).sort((a, b) => b.n - a.n);
  if (altos.length) out.push({ tipo: "exceso", texto: `Volumen alto (series directas a la semana): ${altos.map((x) => `${x.t.toLowerCase()} ${x.n}`).join(", ")}. Arriba de ~20–25 suma poco y alarga tu entreno; si te sientes muy cansado, quita un ejercicio de esos músculos.` });
  return out;
}
