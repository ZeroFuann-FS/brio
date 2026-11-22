/**
 * Planificador del día: arma la agenda a partir del horario fijo del usuario, su rutina de gym,
 * las comidas del menú (y el tiempo de cocina) y los hábitos con hora. Detecta choques.
 * Este archivo no depende de React: también lo usa la función de recordatorios del servidor (copiado allá).
 */
export type TipoBloque = "dormir" | "trabajo" | "escuela" | "traslado" | "gym" | "cocinar" | "comer" | "bano" | "habito" | "otro";
export type TipoComidaAgenda = "desayuno" | "comida" | "cena" | "colacion";

export interface BloqueFijo { id: string; tipo: "trabajo" | "escuela" | "traslado" | "otro"; titulo: string; inicio: string; fin: string; dias: number[] }
export interface Agenda {
  despertar: string;            // "06:30"
  dormir: string;               // "23:00"
  bloques: BloqueFijo[];
  gym: { hora: string; traslado: number; extra?: number };   // días: los de la rutina; extra = cardio (caminadora) en minutos
  comidas: { desayuno: string; comida: string; cena: string; colacion1?: string; colacion2?: string };
  habitos?: Record<string, { hora: string; min: number }>;
  /** Comidas que se preparan juntas en la mañana (las que no son el desayuno se llevan hechas). */
  cocinaManana?: TipoComidaAgenda[];
  /** Baño: cuánto tarda y cuándo; Brío lo acomoda en un hueco libre. */
  bano?: { min: number; cuando: "despertar" | "gym" | "noche" };
  /** Lo que haces antes de irte al gym (tenis, café…): termina justo al salir. */
  preGym?: Pasos;
  /** Descanso al llegar del gym (min). */
  llegada?: number;
  /** Lo que haces antes de salir (lonchera, mochila, trastes…): termina justo cuando sales. */
  salida?: Pasos;
  /** Compra del súper una vez a la semana: después del gym ese día (o en la tarde si no hay gym). */
  superSemanal?: { dia: number; min: number };
  /** Tiempo para ti: Brío lo acomoda solo en un hueco de la mañana, tarde o noche. */
  actividades?: Actividad[];
}
export interface Pasos { min: number; pasos: string[] }
export type Momento = "manana" | "tarde" | "noche";
export interface Actividad { id: string; titulo: string; min: number; cuando: Momento; dias: number[] }

export interface PagoGym { activo: boolean; dia: number; monto: number; hora: string; pagadoHasta?: string /* yyyy-mm del último mes pagado */ }
export interface Recordatorios {
  pago?: PagoGym;
  despensa?: { activo: boolean; hora: string };
  comidas?: { activo: boolean; antes: number };     // minutos antes (para cocinar o comer)
  entreno?: { activo: boolean; antes: number };
  habitos?: { activo: boolean; hora: string };
  agua?: { activo: boolean };
  resumen?: { activo: boolean; hora: string };
}

export interface Evento { inicio: number; fin: number; tipo: TipoBloque; titulo: string; detalle?: string; id: string; llevar?: boolean }

export const AGENDA_BASE: Agenda = {
  despertar: "06:30", dormir: "23:00", bloques: [],
  gym: { hora: "18:00", traslado: 15 },
  comidas: { desayuno: "07:30", comida: "14:30", cena: "20:30" },
};

export const aMin = (h: string) => { const [a, b] = h.split(":").map(Number); return (a || 0) * 60 + (b || 0); };
export const aHora = (m: number) => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
export const hora12 = (m: number) => {
  const x = ((Math.round(m) % 1440) + 1440) % 1440, h = Math.floor(x / 60), mm = String(x % 60).padStart(2, "0");
  return `${h % 12 || 12}:${mm} ${h < 12 ? "am" : "pm"}`;
};

export interface DatosDia {
  agenda: Agenda;
  wd: number;                                      // día de la semana 0-6
  gym?: { nombre: string; min: number } | null;    // sesión de la rutina ese día
  comidas: { tipo: "desayuno" | "comida" | "cena" | "colacion"; titulo: string; cocinar: number; casa?: boolean }[];
  habitos: { id: string; titulo: string }[];
}

/** Agenda del día ordenada. Los bloques que cruzan la medianoche (dormir) se parten. */
export function armarDia(d: DatosDia): Evento[] {
  const a = d.agenda, ev: Evento[] = [];
  const desp = aMin(a.despertar), dorm = aMin(a.dormir);
  // Dormir: de medianoche a despertar y de dormir a medianoche
  ev.push({ id: "dormir-m", inicio: 0, fin: desp, tipo: "dormir", titulo: "Dormir" });
  if (dorm > desp) ev.push({ id: "dormir-n", inicio: dorm, fin: 1440, tipo: "dormir", titulo: "Dormir" });
  for (const b of a.bloques) if (b.dias.includes(d.wd)) {
    const i = aMin(b.inicio), f = aMin(b.fin);
    ev.push({ id: b.id, inicio: i, fin: f > i ? f : f + 1440, tipo: b.tipo, titulo: b.titulo || nombreTipo(b.tipo) });
  }
  const minGym = d.gym ? d.gym.min + (a.gym.extra ?? 0) : 0;
  if (d.gym) {
    const i = aMin(a.gym.hora), t = a.gym.traslado ?? 0;
    if (t) ev.push({ id: "gym-ida", inicio: i - t, fin: i, tipo: "traslado", titulo: "Ir al gym" });
    ev.push({ id: "gym", inicio: i, fin: i + minGym, tipo: "gym", titulo: `Gym: ${d.gym.nombre}`, ...(a.gym.extra ? { detalle: `rutina ${d.gym.min} min + cardio ${a.gym.extra} min` } : {}) });
    if (t) ev.push({ id: "gym-vuelta", inicio: i + minGym, fin: i + minGym + t, tipo: "traslado", titulo: "Regreso del gym" });
    if (a.preGym?.min) {
      const fin = i - t;
      ev.push({ id: "pre-gym", inicio: Math.max(desp, fin - a.preGym.min), fin, tipo: "otro", titulo: "Alistarte para el gym", detalle: a.preGym.pasos.join(" · ") || undefined });
    }
  }
  const horaDe: Record<string, string | undefined> = { desayuno: a.comidas.desayuno, comida: a.comidas.comida, cena: a.comidas.cena };
  const fijos = new Set(a.bloques.filter((b) => b.dias.includes(d.wd)).map((b) => b.id));
  const lote = new Set(a.cocinaManana ?? []);
  const enLote: { titulo: string; cocinar: number; tipo: TipoComidaAgenda }[] = [];
  let col = 0, horaDesayuno: number | null = null;
  for (const c of d.comidas) {
    const h = c.tipo === "colacion" ? (col++ === 0 ? a.comidas.colacion1 ?? "11:00" : a.comidas.colacion2 ?? "17:30") : horaDe[c.tipo];
    if (!h) continue;
    const i = aMin(h), dur = c.tipo === "colacion" ? 10 : c.tipo === "desayuno" ? 20 : 30;
    if (c.tipo === "desayuno") horaDesayuno = i;
    const preparada = lote.has(c.tipo) && !c.casa;
    if (preparada && c.cocinar > 0) enLote.push({ titulo: c.titulo, cocinar: c.cocinar, tipo: c.tipo });
    else if (c.cocinar > 0 && !c.casa) ev.push({ id: `cocinar-${c.tipo}-${i}`, inicio: i - c.cocinar, fin: i, tipo: "cocinar", titulo: `Preparar ${nombreComida(c.tipo)}`, detalle: c.titulo });
    const llevar = preparada && c.tipo !== "desayuno";
    ev.push({ id: `comer-${c.tipo}-${i}`, inicio: i, fin: i + dur, tipo: "comer", titulo: `${cap(nombreComida(c.tipo))}${llevar ? " (la llevas hecha)" : ""}`, detalle: c.titulo, ...(llevar ? { llevar: true } : {}) });
  }
  let finGym = d.gym ? aMin(a.gym.hora) + minGym + (a.gym.traslado ?? 0) : null;
  const finDia = dorm > desp ? dorm : 1440;
  // Súper semanal: saliendo del gym (o en la tarde si ese día no hay gym)
  if (a.superSemanal?.min && a.superSemanal.dia === d.wd) {
    const m = a.superSemanal.min;
    const i = finGym != null ? acomodar(ev, m, finGym, finGym, finDia) : acomodar(ev, m, 17 * 60, 12 * 60, finDia);
    ev.push({ id: "super", inicio: i, fin: i + m, tipo: "otro", titulo: "Súper de la semana", detalle: "Compra lo de toda la semana (revisa tu lista en Comida)" });
    if (finGym != null && i === finGym) finGym = i + m;
  }
  // Descanso al llegar del gym
  if (finGym != null && a.llegada) {
    const i = acomodar(ev, a.llegada, finGym, finGym, finDia);
    ev.push({ id: "llegada", inicio: i, fin: i + a.llegada, tipo: "otro", titulo: "Descansar tantito" });
    if (i === finGym) finGym = i + a.llegada;
  }
  // Cocina de la mañana: un solo bloque (se cocina en paralelo: el platillo más largo + la mitad de los demás)
  if (enLote.length) {
    const tiempos = enLote.map((x) => x.cocinar).sort((x, y) => y - x);
    const dur = Math.ceil((tiempos[0] + tiempos.slice(1).reduce((s, t) => s + t / 2, 0)) / 5) * 5;
    const tope = horaDesayuno ?? primerFijo(ev, desp, fijos) ?? desp + 120;
    const desde = Math.max(desp, finGym != null && finGym <= tope - dur ? finGym : desp);
    const i = acomodar(ev, dur, tope - dur, desde, tope);
    ev.push({ id: "cocinar-manana", inicio: i, fin: i + dur, tipo: "cocinar", titulo: `Cocinar: ${lista(enLote.map((x) => nombreComida(x.tipo)))}`, detalle: enLote.map((x) => x.titulo).filter(Boolean).join(" · ") });
  }
  // Baño: después del gym (si hay), al despertar o antes de dormir
  if (a.bano?.min) {
    const m = a.bano.min;
    const pref = a.bano.cuando === "noche" ? finDia - m - 30 : a.bano.cuando === "gym" && finGym != null ? finGym : desp;
    const i = acomodar(ev, m, pref, desp, finDia);
    ev.push({ id: "bano", inicio: i, fin: i + m, tipo: "bano", titulo: "Bañarte", detalle: "Antes busca tu ropa" });
  }
  // Antes de salir: termina justo cuando empieza tu primer traslado o bloque fijo después de desayunar
  if (a.salida?.min) {
    const sale = primerFijo(ev, horaDesayuno ?? desp, fijos);
    if (sale != null) {
      const m = a.salida.min;
      const i = acomodar(ev, m, sale - m, horaDesayuno ?? desp, sale);
      ev.push({ id: "salida", inicio: i, fin: i + m, tipo: "otro", titulo: "Alistarte para salir", detalle: a.salida.pasos.join(" · ") || undefined });
    }
  }
  for (const h of d.habitos) {
    const cfg = a.habitos?.[h.id];
    if (!cfg?.hora) continue;
    if (h.id === "entreno" && d.gym) continue; // el gym ya es tu hábito de entrenar
    const i = aMin(cfg.hora);
    ev.push({ id: `hab-${h.id}`, inicio: i, fin: i + (cfg.min || 15), tipo: "habito", titulo: h.titulo });
  }
  // Tiempo para ti (al final: se acomoda en lo que quede libre)
  const ventana: Record<Momento, [number, number]> = { manana: [desp, 12 * 60], tarde: [12 * 60, 19 * 60], noche: [19 * 60, finDia] };
  // Las más largas primero (son las que menos caben); si no cabe en su momento, el hueco libre más cercano del día
  for (const x of [...(a.actividades ?? [])].sort((p1, p2) => p2.min - p1.min)) {
    if (!x.min || !x.dias.includes(d.wd)) continue;
    const [de, a2] = ventana[x.cuando];
    let i = acomodar(ev, x.min, de, de, a2);
    if (seEncima(ev, i, i + x.min)) i = acomodar(ev, x.min, de, desp, finDia);
    ev.push({ id: `act-${x.id}`, inicio: i, fin: i + x.min, tipo: "habito", titulo: x.titulo });
  }
  return ev.sort((x, y) => x.inicio - y.inicio || x.fin - y.fin);
}

const nombreComida = (t: TipoComidaAgenda) => (t === "colacion" ? "colación" : t);
const lista = (l: string[]) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}`);
const seEncima = (ev: Evento[], i: number, f: number) => ev.some((e) => Math.min(e.fin, f) - Math.max(e.inicio, i) > 0);
/** Inicio del primer bloque fijo (trabajo, escuela…) después de despertar. */
function primerFijo(ev: Evento[], desde: number, fijos: Set<string>) {
  const f = ev.filter((e) => fijos.has(e.id) && e.inicio >= desde);
  return f.length ? Math.min(...f.map((e) => e.inicio)) : null;
}
/**
 * Hueco libre de `dur` minutos lo más cerca posible de `pref`, dentro de [desde, hasta].
 * Si no hay ninguno, se queda en `pref` (y el choque se muestra).
 */
export function acomodar(ev: Evento[], dur: number, pref: number, desde: number, hasta: number) {
  const cands = new Set([pref, desde, hasta - dur]);
  for (const e of ev) { cands.add(e.fin); cands.add(e.inicio - dur); }
  let mejor: number | null = null;
  for (const c of cands) {
    if (c < desde || c + dur > hasta || seEncima(ev, c, c + dur)) continue;
    if (mejor === null || Math.abs(c - pref) < Math.abs(mejor - pref) || (Math.abs(c - pref) === Math.abs(mejor - pref) && c > mejor)) mejor = c;
  }
  return mejor ?? pref;
}

export interface Choque { a: Evento; b: Evento; min: number }
/** Bloques que se enciman (más de 5 minutos). Dormir solo cuenta si algo invade la noche. */
export function choques(ev: Evento[]): Choque[] {
  const out: Choque[] = [];
  for (let i = 0; i < ev.length; i++) for (let j = i + 1; j < ev.length; j++) {
    const a = ev[i], b = ev[j];
    if (a.tipo === "dormir" && b.tipo === "dormir") continue;
    if ((a.tipo === "traslado" && b.tipo === "gym") || (a.tipo === "gym" && b.tipo === "traslado")) continue;
    // Comer en el trabajo o la escuela es normal (hora de comida); cocinar ahí no.
    const t = [a.tipo, b.tipo];
    if (t.includes("comer") && (t.includes("trabajo") || t.includes("escuela"))) continue;
    // Moverte o caminar de ida y vuelta (al gym, a la residencia) cuenta para el hábito
    if (t.includes("habito") && t.includes("traslado")) continue;
    const min = Math.min(a.fin, b.fin) - Math.max(a.inicio, b.inicio);
    if (min > 5) out.push({ a, b, min });
  }
  return out;
}

export const horasSueno = (a: Agenda) => { const d = aMin(a.despertar), n = aMin(a.dormir); return ((d - n + 1440) % 1440) / 60; };

export function nombreTipo(t: TipoBloque) {
  return ({ dormir: "Dormir", trabajo: "Trabajo", escuela: "Escuela", traslado: "Traslado", gym: "Gym", cocinar: "Cocinar", comer: "Comer", bano: "Baño", habito: "Hábito", otro: "Otro" } as Record<TipoBloque, string>)[t];
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Explica un choque en lenguaje simple. */
export function explicar(c: Choque): string {
  const dorm = c.a.tipo === "dormir" ? c.a : c.b.tipo === "dormir" ? c.b : null;
  if (dorm) { const otro = dorm === c.a ? c.b : c.a; return `${otro.titulo} invade tu hora de dormir (${c.min} min).`; }
  const flexibles = ["bano", "salida", "llegada", "super", "cocinar-manana", "pre-gym"];
  if (flexibles.includes(c.a.id) && flexibles.includes(c.b.id))
    return `Ese día no te alcanza el tiempo: ${c.a.titulo.toLowerCase()} y ${c.b.titulo.toLowerCase()} se enciman ${c.min} min. Acorta algo o cambia el súper de día.`;
  return `${c.a.titulo} (${hora12(c.a.inicio)}–${hora12(c.a.fin)}) choca con ${c.b.titulo.toLowerCase()} (${hora12(c.b.inicio)}–${hora12(c.b.fin)}).`;
}

/** Próximo pago del gym (fecha ISO) según el día del mes y lo ya pagado. */
export function proximoPago(p: PagoGym, hoy: string): string {
  const [y, m] = hoy.split("-").map(Number);
  const mes = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, "0")}`;
  const fecha = (yy: number, mm: number) => {
    const ultimo = new Date(yy, mm, 0).getDate();
    return `${mes(yy, mm)}-${String(Math.min(p.dia, ultimo)).padStart(2, "0")}`;
  };
  let yy = y, mm = m;
  // si ya pagó este mes (o uno posterior), el próximo es el siguiente mes no pagado
  while (p.pagadoHasta && mes(yy, mm) <= p.pagadoHasta) { mm++; if (mm > 12) { mm = 1; yy++; } }
  // si el día de este mes ya pasó y no lo ha pagado, sigue pendiente (vencido) → se muestra ese
  return fecha(yy, mm);
}
