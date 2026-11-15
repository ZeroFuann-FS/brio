/**
 * Menú semanal sin IA: arma el menú con reglas a partir del recetario,
 * la meta de calorías y proteína, los gustos, la despensa, el presupuesto y el equipo de cocina.
 */
import { ALIMENTOS } from "../data/alimentos";
import { COMPRAS } from "../data/compras";
import { RECETAS, costo, necesitaRefri, nutricion, recetaPorId, type Equipo, type Receta, type TipoReceta } from "../data/recetas";
import type { ComidaMenu, ItemDespensa, MenuGuardado } from "./store";
import { hoyISO } from "./calc";

export interface OpcionesMenu {
  dias: string[];
  comidas: TipoReceta[];   // desayuno / comida / cena
  colaciones: number;      // 0-2 al día
  kcal: number;
  proteina: number;
  presupuesto: number;
  equipo: string[];        // "Estufa", "Air fryer", "Refrigerador"…
  gustos: string[];
  evitar: string[];
  favoritas: string[];
  despensa: ItemDespensa[];
}

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Equipo de la receta disponible (cualquiera de las alternativas). */
function puedeHacerse(r: Receta, equipo: string[]) {
  const tengo = new Set<Equipo>(["ninguno", ...equipo.map((e) => norm(e) as Equipo)]);
  if (r.equipo.length === 2 && r.equipo.includes("licuadora")) return r.equipo.every((e) => tengo.has(e)); // ej. estufa + licuadora
  return r.equipo.some((e) => tengo.has(e));
}

/** Producto de la despensa que corresponde a un alimento (por la primera palabra). */
export function enDespensa(d: ItemDespensa[], alimentoId: string): ItemDespensa | undefined {
  const a = POR_ID.get(alimentoId);
  if (!a) return undefined;
  const palabras = norm(a.n).split(/[\s,()]+/);
  return d.find((i) => {
    if (i.cantidad <= 0) return false;
    const w = norm(i.nombre).split(/\s+/)[0];
    return palabras.some((p) => p === w || p === `${w}s` || `${p}s` === w);   // palabra completa ("pan" no es "panela")
  });
}

const limpiarNombre = (n: string) => n.replace(/ \(.*\)| cocid[oa]s?| entero|, cocid[oa]/g, "");

const REPARTO: Record<TipoReceta, number> = { desayuno: 0.27, comida: 0.36, cena: 0.25, colacion: 0.12 };

/** Ingrediente principal de una receta (el de más proteína). */
export function principal(r: Receta): string {
  let mejor = r.ing[0]?.[0] ?? "", max = -1;
  for (const [id, g] of r.ing) {
    const a = POR_ID.get(id);
    if (a && g && (a.p * g) / 100 > max) { max = (a.p * g) / 100; mejor = id; }
  }
  return mejor;
}

interface Contexto { usos: Map<string, number>; hoy: Set<string>; principalesHoy: Map<string, number>; ingSemana: Map<string, number> }

function puntaje(r: Receta, o: OpcionesMenu, ctx: Contexto, pesoCosto: number) {
  const { usos, hoy } = ctx;
  const ids = r.ing.map(([id]) => id).filter(Boolean);
  let p = Math.random() * 1.5;
  p -= (ctx.principalesHoy.get(principal(r)) ?? 0) * 7;                      // no repetir proteína el mismo día
  p -= Math.max(0, (ctx.ingSemana.get(principal(r)) ?? 0) - 5) * 1.5;         // ni abusar en la semana
  p += ids.filter((id) => (ctx.ingSemana.get(id) ?? 0) > 0).length * 0.6 * pesoCosto; // reusar ingredientes = comprar menos
  p += ids.filter((id) => o.gustos.includes(id)).length * 3;
  p += ids.filter((id) => enDespensa(o.despensa, id)).length * 2;
  if (o.favoritas.includes(r.id)) p += 4;
  const n = nutricion(r);
  p += n.kcal ? ((n.proteina * 4) / n.kcal) * 8 : 0;          // premia la proteína
  p -= (costo(r) / 10) * pesoCosto;
  if (!o.equipo.includes("Refrigerador") && necesitaRefri(r)) p -= 4;
  if (hoy.has(r.id)) p -= 20;
  p -= (usos.get(r.id) ?? 0) * 4;
  return p;
}

function candidatos(tipo: TipoReceta, o: OpcionesMenu) {
  return RECETAS.filter((r) => r.tipos.includes(tipo) && puedeHacerse(r, o.equipo) && !r.ing.some(([id]) => o.evitar.includes(id)));
}

function elegir(tipo: TipoReceta, o: OpcionesMenu, ctx: Contexto, pesoCosto: number, excluir?: string): Receta | undefined {
  const max = tipo === "colacion" ? 3 : 2;
  const lista = candidatos(tipo, o).filter((r) => r.id !== excluir && (ctx.usos.get(r.id) ?? 0) < max);
  const pool = lista.length ? lista : candidatos(tipo, o).filter((r) => r.id !== excluir);
  return pool.map((r) => ({ r, s: puntaje(r, o, ctx, pesoCosto) })).sort((a, b) => b.s - a.s)[0]?.r;
}

function anotar(ctx: Contexto, r: Receta) {
  ctx.hoy.add(r.id);
  ctx.usos.set(r.id, (ctx.usos.get(r.id) ?? 0) + 1);
  const pr = principal(r);
  ctx.principalesHoy.set(pr, (ctx.principalesHoy.get(pr) ?? 0) + 1);
  for (const [id] of r.ing) if (id) ctx.ingSemana.set(id, (ctx.ingSemana.get(id) ?? 0) + 1);
}

/** Ajusta las porciones del día para acercarse a la meta de calorías. */
function ajustar(comidas: { tipo: TipoReceta; r: Receta }[], o: OpcionesMenu): ComidaMenu[] {
  const tipos = comidas.map((c) => c.tipo);
  const total = tipos.reduce((a, t) => a + REPARTO[t], 0);
  return comidas.map(({ tipo, r }) => {
    const meta = (o.kcal * REPARTO[tipo]) / total / (tipo === "colacion" ? 1 : 1);
    const k = nutricion(r).kcal || 1;
    const factor = Math.min(1.6, Math.max(0.6, Math.round((meta / k) * 10) / 10));
    return { tipo, receta: r.id, factor };
  });
}

function construir(o: OpcionesMenu, pesoCosto: number): MenuGuardado {
  const usos = new Map<string, number>();
  const ingSemana = new Map<string, number>();
  const dias = o.dias.map((dia) => {
    const ctx: Contexto = { usos, hoy: new Set<string>(), principalesHoy: new Map(), ingSemana };
    const orden: TipoReceta[] = [];
    for (const t of ["desayuno", "comida", "cena"] as TipoReceta[]) {
      if (!o.comidas.includes(t)) continue;
      orden.push(t);
      if (t === "desayuno" && o.colaciones >= 1) orden.push("colacion");
      if (t === "comida" && o.colaciones >= 2) orden.push("colacion");
    }
    if (o.colaciones >= 1 && !orden.includes("colacion")) orden.push("colacion");
    const elegidas = orden.map((tipo) => {
      const r = elegir(tipo, o, ctx, pesoCosto);
      if (r) anotar(ctx, r);
      return { tipo, r };
    }).filter((x): x is { tipo: TipoReceta; r: Receta } => !!x.r);
    return { dia, comidas: ajustar(elegidas, o) };
  });
  return { creado: hoyISO(), dias, comprado: [] };
}

/** Genera el menú; si se pasa del presupuesto, reintenta dando más peso al costo. */
export function generarMenuReglas(o: OpcionesMenu): MenuGuardado {
  let mejor: MenuGuardado | null = null;
  let mejorCosto = Infinity;
  for (const peso of [1, 1, 2.5, 4, 6]) {
    const m = construir(o, peso);
    const c = listaSuper(m, o.despensa).total;
    if (c < mejorCosto) { mejor = m; mejorCosto = c; }
    if (c <= o.presupuesto) break;
  }
  return mejor!;
}

/** Cambia una comida por otra receta del mismo tipo. */
export function cambiarComida(m: MenuGuardado, di: number, ci: number, o: OpcionesMenu): MenuGuardado {
  const ctx: Contexto = { usos: new Map(), hoy: new Set(), principalesHoy: new Map(), ingSemana: new Map() };
  m.dias.forEach((d, i) => d.comidas.forEach((c, j) => {
    const rr = recetaPorId(c.receta);
    if (!rr || (i === di && j === ci)) return;
    ctx.usos.set(rr.id, (ctx.usos.get(rr.id) ?? 0) + 1);
    for (const [id] of rr.ing) if (id) ctx.ingSemana.set(id, (ctx.ingSemana.get(id) ?? 0) + 1);
    if (i === di) { ctx.hoy.add(rr.id); const pr = principal(rr); ctx.principalesHoy.set(pr, (ctx.principalesHoy.get(pr) ?? 0) + 1); }
  }));
  const actual = m.dias[di].comidas[ci];
  const r = elegir(actual.tipo, o, ctx, 1, actual.receta);
  if (!r) return m;
  const k = nutricion(r).kcal || 1;
  const kActual = nutricion(recetaPorId(actual.receta)!, actual.factor).kcal;
  const factor = Math.min(1.6, Math.max(0.6, Math.round((kActual / k) * 10) / 10));
  const dias = m.dias.map((d, i) => i !== di ? d : { ...d, comidas: d.comidas.map((c, j) => j !== ci ? c : { tipo: c.tipo, receta: r.id, factor }) });
  return { ...m, dias };
}

export function totalesDia(comidas: ComidaMenu[]) {
  return comidas.reduce((t, c) => {
    const r = recetaPorId(c.receta);
    if (!r) return t;
    const n = nutricion(r, c.factor);
    return { kcal: t.kcal + n.kcal, proteina: t.proteina + n.proteina };
  }, { kcal: 0, proteina: 0 });
}

/* ---------- Lista del súper ---------- */
export interface ItemSuper { id: string; nombre: string; unidades: number; unidad: string; costo: number; necesita: number; enCasa: number }

function gramosEnCasa(i: ItemDespensa, alimentoId: string) {
  const a = POR_ID.get(alimentoId);
  if (["pzas", "latas", "rebanadas"].includes(i.unidad)) return i.cantidad * (a?.por[0].g ?? 50);
  if (i.unidad === "g") return i.cantidad;
  if (i.unidad === "kg") return i.cantidad * 1000;
  if (i.unidad === "L") return i.cantidad * 1030;
  return 0;
}

export function listaSuper(m: MenuGuardado, despensa: ItemDespensa[]): { items: ItemSuper[]; total: number; usado: number } {
  const gramos = new Map<string, number>();
  for (const d of m.dias) for (const c of d.comidas) {
    const r = recetaPorId(c.receta);
    if (!r) continue;
    for (const [id, g] of r.ing) if (id && g) gramos.set(id, (gramos.get(id) ?? 0) + g * c.factor);
  }
  // Agrupa ingredientes que se compran igual (pechuga cocida y cruda, arroz blanco y rojo…)
  const porCompra = new Map<string, { id: string; g: number }>();
  for (const [id, g] of gramos) {
    const k = COMPRAS[id];
    if (!k) continue;
    const clave = `${k.nombre ?? POR_ID.get(id)?.n}|${k.unidad}`;
    const prev = porCompra.get(clave);
    porCompra.set(clave, { id: prev?.id ?? id, g: (prev?.g ?? 0) + g });
  }
  const items: ItemSuper[] = [];
  for (const { id, g } of porCompra.values()) {
    const k = COMPRAS[id];
    const casa = enDespensa(despensa, id);
    const enCasa = casa ? gramosEnCasa(casa, id) : 0;
    const falta = Math.max(0, g - enCasa);
    // Lo que se vende por peso (kg) se compra por cuartos de kilo; lo demás por pieza o paquete completo
    const porPeso = k.unidad.startsWith("kg");
    const unidades = falta <= 0 ? 0 : porPeso
      ? Math.max(0.25, Math.ceil((falta / k.g) * 4) / 4)
      : Math.max(1, Math.ceil(falta / k.g - 0.15));
    items.push({
      id, nombre: k.nombre ?? limpiarNombre(POR_ID.get(id)?.n ?? id), unidades,
      unidad: porPeso ? k.unidad.replace(/^kg/, "kg") : k.unidad, costo: Math.round(unidades * k.precio),
      necesita: Math.round(g), enCasa: Math.round(Math.min(g, enCasa)),
    });
  }
  items.sort((a, b) => (b.unidades > 0 ? 1 : 0) - (a.unidades > 0 ? 1 : 0) || a.nombre.localeCompare(b.nombre));
  // Valor de lo que realmente se consume esta semana (lo demás queda en la despensa)
  let usado = 0;
  for (const { id, g } of porCompra.values()) usado += (g / COMPRAS[id].g) * COMPRAS[id].precio;
  return { items, total: items.reduce((t, i) => t + i.costo, 0), usado: Math.round(usado) };
}

/** Unidad de despensa equivalente a una unidad de compra. */
export function unidadDespensa(i: ItemSuper): { cantidad: number; unidad: string } {
  const u = i.unidad;
  if (u.startsWith("pzas")) return { cantidad: i.unidades, unidad: "pzas" };
  if (u === "latas") return { cantidad: i.unidades, unidad: "latas" };
  if (u.startsWith("kg")) return { cantidad: i.unidades, unidad: "kg" };
  if (u === "L") return { cantidad: i.unidades, unidad: "L" };
  const g = u.match(/(\d+)\s*g/);
  if (g) return { cantidad: i.unidades * Number(g[1]), unidad: "g" };
  return { cantidad: i.unidades, unidad: "paquete" };
}
