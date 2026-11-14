export type Sexo = "h" | "m";
export type DiaADia = "sentado" | "de-pie" | "fisico";
export type Ritmo = 0.5 | 0.75 | 1;

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

export function calcularMetas(p: Omit<Perfil, "creado" | "nombre" | "motivo">, pesoActual: number): Metas {
  const w = pesoActual;
  const bmr = 10 * w + 6.25 * p.estatura - 5 * p.edad + (p.sexo === "h" ? 5 : -161);
  const factor = BASE[p.diaADia] + 0.035 * p.diasEntreno;
  const tdee = bmr * factor;

  const perder = w > p.pesoMeta + 0.3;
  const ganar = w < p.pesoMeta - 0.3;
  const minimo = p.sexo === "h" ? 1500 : 1200;

  let objetivo = tdee;
  if (perder) {
    const deficitRitmo = (w * (p.ritmo / 100) * KCAL_POR_KG) / 7;
    objetivo = tdee - Math.min(deficitRitmo, tdee * 0.3);
  } else if (ganar) {
    objetivo = tdee + 250;
  }
  const limitadoPorMinimo = objetivo < minimo;
  const kcal = redondear(Math.max(minimo, objetivo));

  // Proteína: ~2 g por kg de tu peso meta (protege músculo en déficit), mínimo 1.4 g/kg actual
  const proteina = redondear(Math.max(2 * p.pesoMeta, 1.4 * w), 5);
  const grasa = redondear((kcal * 0.27) / 9, 5);
  const carbos = Math.max(0, redondear((kcal - proteina * 4 - grasa * 9) / 4, 5));
  const aguaMl = Math.min(4000, Math.max(2000, redondear(w * 35, 250)));

  const kgSemana = ((tdee - kcal) * 7) / KCAL_POR_KG;
  let fechaEstimada: string | null = null;
  if (perder && kgSemana > 0.05) {
    fechaEstimada = sumarDias(hoyISO(), Math.ceil(((w - p.pesoMeta) / kgSemana) * 7));
  } else if (ganar && kgSemana < -0.05) {
    fechaEstimada = sumarDias(hoyISO(), Math.ceil(((p.pesoMeta - w) / -kgSemana) * 7));
  }

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, proteina, carbos, grasa, aguaMl, kgSemana, fechaEstimada, limitadoPorMinimo };
}

/** Peso proyectado en una fecha, sin pasar la meta. */
export function pesoEnFecha(pesoActual: number, metas: Metas, pesoMeta: number, fecha: string) {
  const semanas = Math.max(0, diasEntre(hoyISO(), fecha)) / 7;
  const proyectado = pesoActual - metas.kgSemana * semanas;
  return metas.kgSemana >= 0 ? Math.max(pesoMeta, proyectado) : Math.min(pesoMeta, proyectado);
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fechaCorta(iso: string, conAnio = true) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}${conAnio ? ` ${y}` : ""}`;
}
