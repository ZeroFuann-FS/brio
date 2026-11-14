export type Sexo = "h" | "m";
export type DiaADia = "sentado" | "de-pie" | "fisico";
export type Ritmo = 0.5 | 0.75 | 1;
export interface Habito { id: string; e: string; t: string }

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

export type DatosCalculo = Omit<Perfil, "creado" | "nombre" | "motivo" | "habitos">;
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
