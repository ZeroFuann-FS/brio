/** Metas de crecimiento: aprender, carrera, dinero, salud y personales. */
import { hoyISO, sumarDias } from "./calc";

export type AreaMeta = "aprender" | "carrera" | "dinero" | "salud" | "personal";
export type TipoMeta = "pasos" | "monto" | "tiempo";
export interface PasoMeta { id: string; t: string; hecho?: string }
export interface RegistroMeta { fecha: string; v: number; nota?: string }
export interface Meta {
  id: string; area: AreaMeta; titulo: string; tipo: TipoMeta;
  fecha?: string;                 // fecha objetivo (opcional)
  pasos?: PasoMeta[];             // tipo pasos
  objetivo?: number;              // monto total (dinero) o minutos por semana (tiempo)
  registros?: RegistroMeta[];     // aportaciones o sesiones
  creada: string; lograda?: string;
}

export const AREAS: { id: AreaMeta; t: string; habito?: string }[] = [
  { id: "aprender", t: "Aprender", habito: "aprender" },
  { id: "carrera", t: "Carrera" },
  { id: "dinero", t: "Dinero", habito: "ahorro" },
  { id: "salud", t: "Salud" },
  { id: "personal", t: "Personal" },
];
export const NOMBRE_AREA = Object.fromEntries(AREAS.map((a) => [a.id, a.t])) as Record<AreaMeta, string>;

const uid = () => Math.random().toString(36).slice(2, 10);
const pasos = (l: string[]): PasoMeta[] => l.map((t) => ({ id: uid(), t }));

/** Ideas para empezar rápido (textos generales, editables). */
export const IDEAS: { area: AreaMeta; titulo: string; tipo: TipoMeta; objetivo?: number; pasos?: string[]; desc: string }[] = [
  { area: "aprender", titulo: "Estudiar para mi carrera", tipo: "tiempo", objetivo: 180, desc: "3 horas a la semana, registrando cada sesión." },
  { area: "aprender", titulo: "Aprender inglés", tipo: "tiempo", objetivo: 150, desc: "Media hora, 5 días a la semana." },
  { area: "aprender", titulo: "Leer 4 libros", tipo: "pasos", pasos: ["Libro 1", "Libro 2", "Libro 3", "Libro 4"], desc: "Marca cada libro que termines." },
  { area: "carrera", titulo: "Conseguir trabajo en lo que me gusta", tipo: "pasos", pasos: ["Actualizar mi CV", "Armar un portafolio con 3 proyectos", "Actualizar LinkedIn", "Aplicar a 10 vacantes", "Practicar entrevistas", "Tener mi primera entrevista"], desc: "Los pasos para llegar a tu primer o siguiente empleo." },
  { area: "carrera", titulo: "Titularme", tipo: "pasos", pasos: ["Definir mi proyecto o tema", "Terminar el documento", "Revisión con mi asesor", "Hacer los trámites", "Presentar"], desc: "Del proyecto a la presentación." },
  { area: "dinero", titulo: "Fondo de emergencia", tipo: "monto", objetivo: 10000, desc: "Un colchón para imprevistos. Registra cada vez que ahorres." },
  { area: "dinero", titulo: "Ahorrar para algo que quiero", tipo: "monto", objetivo: 5000, desc: "Ponle nombre y monto." },
  { area: "salud", titulo: "Correr 5 km sin parar", tipo: "pasos", pasos: ["Caminar 30 min 3 veces por semana", "Trotar 1 km", "Trotar 3 km", "Correr 5 km"], desc: "Poco a poco, sin lesionarte." },
];

export function metaDeIdea(i: (typeof IDEAS)[number]): Meta {
  return { id: uid(), area: i.area, titulo: i.titulo, tipo: i.tipo, objetivo: i.objetivo, pasos: i.pasos ? pasos(i.pasos) : undefined, registros: [], creada: hoyISO() };
}
export const metaNueva = (area: AreaMeta, tipo: TipoMeta): Meta => ({ id: uid(), area, titulo: "", tipo, objetivo: tipo === "monto" ? 5000 : tipo === "tiempo" ? 150 : undefined, pasos: tipo === "pasos" ? [] : undefined, registros: [], creada: hoyISO() });
export const nuevoPaso = (t: string): PasoMeta => ({ id: uid(), t });

/** Lunes de la semana de una fecha. */
export function lunes(f: string) { const d = new Date(`${f}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); }

export const sumaEntre = (m: Meta, desde: string, hasta: string) => (m.registros ?? []).filter((r) => r.fecha >= desde && r.fecha <= hasta).reduce((a, r) => a + r.v, 0);
export const total = (m: Meta) => (m.registros ?? []).reduce((a, r) => a + r.v, 0);

/** Avance de 0 a 1 (en tiempo: la semana actual). */
export function avance(m: Meta, hoy = hoyISO()): number {
  if (m.tipo === "pasos") return m.pasos?.length ? m.pasos.filter((p) => p.hecho).length / m.pasos.length : 0;
  if (m.tipo === "monto") return m.objetivo ? Math.min(1, total(m) / m.objetivo) : 0;
  const l = lunes(hoy);
  return m.objetivo ? Math.min(1, sumaEntre(m, l, sumarDias(l, 6)) / m.objetivo) : 0;
}

/** Semanas seguidas cumpliendo la meta de tiempo (sin contar la actual si aún no se cumple). */
export function rachaSemanas(m: Meta, hoy = hoyISO()) {
  if (m.tipo !== "tiempo" || !m.objetivo) return 0;
  let l = lunes(hoy), n = 0;
  if (sumaEntre(m, l, sumarDias(l, 6)) < m.objetivo) l = sumarDias(l, -7);
  while (sumaEntre(m, l, sumarDias(l, 6)) >= m.objetivo) { n++; l = sumarDias(l, -7); }
  return n;
}

/** Al ritmo actual, ¿cuándo llega a su monto? */
export function fechaEstimadaMonto(m: Meta, hoy = hoyISO()): string | null {
  if (m.tipo !== "monto" || !m.objetivo) return null;
  const regs = m.registros ?? [];
  const falta = m.objetivo - total(m);
  if (falta <= 0 || !regs.length) return null;
  const dias = Math.max(14, (new Date(`${hoy}T12:00:00`).getTime() - new Date(`${m.creada}T12:00:00`).getTime()) / 86400000);
  const porDia = total(m) / dias;
  if (porDia <= 0) return null;
  return sumarDias(hoy, Math.ceil(falta / porDia));
}
