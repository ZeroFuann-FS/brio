/** Tipos y cálculos del módulo de entrenamiento. */
import { ejercicioPorId, type Musculo } from "../data/ejercicios";
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
export interface PrefsEntreno { rutinas: Rutina[]; activa?: string; lugar?: Lugar }

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

/** ¿Le toca subir peso? Si la última vez llegó al tope de reps en todas las series. */
export function tocaSubir(sesiones: Sesion[], ej: string, reps: string): number | null {
  if (/s|min/i.test(reps)) return null;
  const tope = repsTope(reps);
  const prev = ultimaVez(sesiones, ej);
  if (!tope || !prev?.length || prev.length < 2 || !prev.every((x) => x.reps >= tope && x.kg > 0)) return null;
  const kg = Math.max(...prev.map((x) => x.kg));
  return Math.round((kg + (kg >= 40 ? 2.5 : 1)) * 2) / 2;
}

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
