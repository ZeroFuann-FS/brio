export type Sexo = "h" | "m";
export type DiaADia = "sentado" | "de-pie" | "fisico";
export type Ritmo = 0.5 | 0.75 | 1;
export interface Habito { id: string; e: string; t: string }
export interface PrefsComida {
  presupuesto: number; comidas: string[]; equipo: string[]; preferencias: string;
  colaciones?: number;      // 0, 1 o 2 al día
  dias?: string[];          // días del menú
  gustos?: string[];        // ids de alimentos que le gustan
  evitar?: string[];        // ids de alimentos que no come
  favoritas?: string[];     // ids de recetas favoritas
  /** Quién cocina cada comida: por día y tipo ("yo" por defecto, "casa" = se come lo que hay en casa o fuera, "no" = no se hace). */
  horario?: Record<string, Partial<Record<string, QuienCocina>>>;
}
export type QuienCocina = "yo" | "casa" | "no";

/** Tiempos de comida de un plan de nutriólogo. */
export type TiempoPlan = "desayuno" | "colacion1" | "comida" | "colacion2" | "cena";
export const TIEMPOS_PLAN: { id: TiempoPlan; t: string; hora: number }[] = [
  { id: "desayuno", t: "Desayuno", hora: 7 }, { id: "colacion1", t: "Colación de la mañana", hora: 11 },
  { id: "comida", t: "Comida", hora: 14 }, { id: "colacion2", t: "Colación de la tarde", hora: 17.5 }, { id: "cena", t: "Cena", hora: 20 },
];
/** Plan que le dio su nutriólogo: metas propias, equivalentes por día y/o menú fijo. */
export interface PlanNutriologo {
  activo: boolean;
  usarMetas: boolean;
  metas?: { kcal: number; proteina: number; carbos: number; grasa: number };
  equivalentes?: Partial<Record<string, number>>;            // por día (grupo SMAE → número)
  mismoMenu?: boolean;                                        // el mismo menú todos los días
  menu?: Record<string, Partial<Record<TiempoPlan, string>>>; // "Lunes"… o "todos" → tiempo → texto
}

export interface Perfil {
  nombre: string;
  sexo: Sexo;
  edad: number;
  estatura: number; // cm
  pesoInicial: number; // kg
  pesoMeta: number; // kg
  diaADia: DiaADia;
  diasEntreno: number; // 0-7
  ritmo: Ritmo; // % del peso por semana
  motivo?: { titulo: string; fecha: string }; // yyyy-mm-dd
  habitos?: Habito[];
  prefsComida?: PrefsComida;
  plan?: PlanNutriologo;
  entreno?: import("./entreno").PrefsEntreno;
  agenda?: import("./agenda").Agenda;
  recordatorios?: import("./agenda").Recordatorios;
  metas?: import("./metas").Meta[];
  creado: string;
}

export interface Metas {
  bmr: number;
  tdee: number;
  kcal: number;
  proteina: number;
  carbos: number;
  grasa: number;
  aguaMl: number;
  kgSemana: number; // positivo = bajar
  fechaEstimada: string | null;
  limitadoPorMinimo: boolean;
}

const BASE: Record<DiaADia, number> = { sentado: 1.2, "de-pie": 1.3, fisico: 1.45 };
export const KCAL_POR_KG = 7700;

export const redondear = (n: number, a = 10) => Math.round(n / a) * a;

export function hoyISO(d = new Date()) {
  return d.toLocaleDateString("en-CA"); // yyyy-mm-dd local
}

export function sumarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return hoyISO(d);
}

export function diasEntre(a: string, b: string) {
  return Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000);
}

export function calcularMetas(p: DatosCalculo, pesoActual: number): Metas {
  const w = pesoActual;
  const e = energia(p, w);
  // Proteína: ~2 g por kg de tu peso meta (protege músculo en déficit), mínimo 1.4 g/kg actual
  const proteina = redondear(Math.max(2 * p.pesoMeta, 1.4 * w), 5);
  const grasa = redondear((e.kcal * 0.27) / 9, 5);
  const carbos = Math.max(0, redondear((e.kcal - proteina * 4 - grasa * 9) / 4, 5));
  const aguaMl = Math.min(4000, Math.max(2000, redondear(w * 35, 250)));
  const cambia = Math.abs(w - p.pesoMeta) > 0.3;
  return {
    bmr: Math.round(e.bmr), tdee: Math.round(e.tdee), kcal: e.kcal, proteina, carbos, grasa, aguaMl,
    kgSemana: e.kgSemana, limitadoPorMinimo: e.limitadoPorMinimo,
    fechaEstimada: cambia ? proyeccion(p, w).fechaMeta : null,
  };
}

export type DatosCalculo = Omit<Perfil, "creado" | "nombre" | "motivo" | "habitos" | "prefsComida">;
export interface PuntoProyeccion { fecha: string; kg: number }

/**
 * Simula semana a semana: al bajar de peso, tu gasto baja y Brío recalcula
 * tus calorías, así que el ritmo se va haciendo más lento (curva realista).
 */
export function proyeccion(p: DatosCalculo, pesoInicio: number, maxSemanas = 156): { puntos: PuntoProyeccion[]; fechaMeta: string | null } {
  const hoy = hoyISO();
  const puntos: PuntoProyeccion[] = [{ fecha: hoy, kg: pesoInicio }];
  const bajando = pesoInicio > p.pesoMeta;
  let w = pesoInicio;
  for (let s = 1; s <= maxSemanas; s++) {
    const m = energia(p, w);
    if (Math.abs(m.kgSemana) < 0.02) break;
    const siguiente = w - m.kgSemana;
    const llego = bajando ? siguiente <= p.pesoMeta : siguiente >= p.pesoMeta;
    if (llego) {
      const fraccion = (w - p.pesoMeta) / (w - siguiente);
      const fecha = sumarDias(hoy, Math.ceil((s - 1 + fraccion) * 7));
      puntos.push({ fecha, kg: p.pesoMeta });
      return { puntos, fechaMeta: fecha };
    }
    w = siguiente;
    puntos.push({ fecha: sumarDias(hoy, s * 7), kg: Math.round(w * 10) / 10 });
  }
  return { puntos, fechaMeta: null };
}

/** Gasto (Mifflin-St Jeor × actividad) y calorías objetivo para un peso dado. */
function energia(p: DatosCalculo, w: number) {
  const bmr = 10 * w + 6.25 * p.estatura - 5 * p.edad + (p.sexo === "h" ? 5 : -161);
  const tdee = bmr * (BASE[p.diaADia] + 0.035 * p.diasEntreno);
  const minimo = p.sexo === "h" ? 1500 : 1200;
  let objetivo = tdee;
  if (w > p.pesoMeta + 0.3) objetivo = tdee - Math.min((w * (p.ritmo / 100) * KCAL_POR_KG) / 7, tdee * 0.3);
  else if (w < p.pesoMeta - 0.3) objetivo = tdee + 250;
  const kcal = redondear(Math.max(minimo, objetivo));
  return { bmr, tdee, kcal, limitadoPorMinimo: objetivo < minimo, kgSemana: ((tdee - kcal) * 7) / KCAL_POR_KG };
}

/** Peso proyectado en una fecha, según la curva simulada. */
export function pesoEnFecha(p: DatosCalculo, pesoActual: number, fecha: string) {
  const { puntos } = proyeccion(p, pesoActual);
  if (fecha <= puntos[0].fecha) return pesoActual;
  for (let i = 1; i < puntos.length; i++) {
    if (fecha <= puntos[i].fecha) {
      const a = puntos[i - 1], b = puntos[i];
      const t = diasEntre(a.fecha, fecha) / Math.max(1, diasEntre(a.fecha, b.fecha));
      return a.kg + (b.kg - a.kg) * t;
    }
  }
  return puntos[puntos.length - 1].kg;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fechaCorta(iso: string, conAnio = true) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${conAnio ? ` ${y}` : ""}`;
}

/* ---------- IMC y peso recomendado ---------- */
export const imc = (kg: number, cm: number) => kg / (cm / 100) ** 2;

export function categoriaImc(v: number, edad: number) {
  const [min, max] = edad >= 65 ? [22, 27] : [18.5, 25];
  if (v < min) return { t: "Bajo peso", tono: "ember" as const };
  if (v < max) return { t: "Saludable", tono: "lime" as const };
  if (v < 30) return { t: "Sobrepeso", tono: "ember" as const };
  if (v < 35) return { t: "Obesidad grado I", tono: "ember" as const };
  if (v < 40) return { t: "Obesidad grado II", tono: "ember" as const };
  return { t: "Obesidad grado III", tono: "ember" as const };
}

/** Rango de peso saludable por IMC (en mayores de 65 se usa 22–27). */
export function rangoSaludable(cm: number, edad: number) {
  const m2 = (cm / 100) ** 2;
  const [a, b] = edad >= 65 ? [22, 27] : [18.5, 24.9];
  return { min: Math.round(a * m2 * 10) / 10, max: Math.round(b * m2 * 10) / 10 };
}

/** Peso de referencia según sexo y estatura (fórmula de Robinson), dentro del rango saludable. */
export function pesoReferencia(sexo: Sexo, cm: number, edad: number) {
  const pulgadas = cm / 2.54 - 60;
  const robinson = sexo === "h" ? 52 + 1.9 * pulgadas : 49 + 1.7 * pulgadas;
  const r = rangoSaludable(cm, edad);
  return Math.round(Math.min(r.max, Math.max(r.min, robinson)));
}

/* ---------- Medidas corporales ---------- */
/** Cintura ÷ estatura: < 0.5 es saludable para casi cualquier adulto. */
export function ratioCintura(cintura: number, cm: number) {
  const r = cintura / cm;
  const t = r < 0.4 ? "Muy bajo" : r < 0.5 ? "Saludable" : r < 0.6 ? "Riesgo aumentado" : "Riesgo alto";
  return { r, t, ok: r >= 0.4 && r < 0.5, limite: Math.round(cm * 0.5 * 10) / 10 };
}

/** % de grasa estimado (fórmula de la Marina de EE. UU.). Medidas en cm. */
export function grasaNavy(sexo: Sexo, cm: number, cintura?: number, cuello?: number, cadera?: number) {
  if (!cintura || !cuello) return null;
  let v: number;
  if (sexo === "h") {
    if (cintura - cuello <= 0) return null;
    v = 495 / (1.0324 - 0.19077 * Math.log10(cintura - cuello) + 0.15456 * Math.log10(cm)) - 450;
  } else {
    if (!cadera || cintura + cadera - cuello <= 0) return null;
    v = 495 / (1.29579 - 0.35004 * Math.log10(cintura + cadera - cuello) + 0.221 * Math.log10(cm)) - 450;
  }
  if (!isFinite(v) || v < 2 || v > 70) return null;
  const cortes = sexo === "h" ? [6, 14, 18, 25] : [14, 21, 25, 32];
  const nombres = ["Esencial", "Atlético", "Fitness", "Promedio", "Alto"];
  const i = cortes.findIndex((c) => v < c);
  return { v: Math.round(v * 10) / 10, t: nombres[i === -1 ? 4 : i] };
}

/** Si el usuario sigue un plan de nutriólogo con metas propias, esas mandan. */
export function aplicarPlan(m: Metas, p: Perfil): Metas {
  const pl = p.plan;
  if (!pl?.activo || !pl.usarMetas || !pl.metas?.kcal) return m;
  return { ...m, kcal: pl.metas.kcal, proteina: pl.metas.proteina || m.proteina, carbos: pl.metas.carbos || m.carbos, grasa: pl.metas.grasa || m.grasa };
}

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Lo que dice el menú del nutriólogo para una fecha y tiempo. */
export function menuPlan(pl: PlanNutriologo | undefined, fecha: Date, t: TiempoPlan): string | undefined {
  if (!pl?.activo || !pl.menu) return undefined;
  const clave = pl.mismoMenu ? "todos" : DIAS_SEMANA[fecha.getDay()];
  return pl.menu[clave]?.[t]?.trim() || undefined;
}
export const tienePlanMenu = (pl?: PlanNutriologo) => !!pl?.activo && !!pl.menu && Object.values(pl.menu).some((d) => Object.values(d ?? {}).some((x) => x?.trim()));
export const tieneEquivalentes = (pl?: PlanNutriologo) => !!pl?.activo && !!pl.equivalentes && Object.values(pl.equivalentes).some((n) => (n ?? 0) > 0);
