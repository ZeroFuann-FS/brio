/**
 * Menú semanal sin IA: arma el menú con reglas a partir del recetario,
 * la meta de calorías y proteína, los gustos, la despensa, el presupuesto y el equipo de cocina.
 */
import { ALIMENTOS } from "../data/alimentos";
import { COMPRAS } from "../data/compras";
import { RECETAS, costo, gramosIng, llevaCarneFresca, necesitaRefri, nutricion, recetaPorId, type Equipo, type Receta, type TipoReceta, aplicarAjustes } from "../data/recetas";
import type { ComidaMenu, ItemDespensa, MenuGuardado } from "./store";
import { hoyISO, type QuienCocina } from "./calc";
import { expandirGustos } from "../data/gustos";


/** La receta de una comida del menú con sus ajustes (sin lechuga, doble pollo…). */
export const recetaDeComida = (c: ComidaMenu) => { const r = recetaPorId(c.receta); return r ? aplicarAjustes(r, c.ajustes) : undefined; };
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
  horario?: Record<string, Partial<Record<string, QuienCocina>>>;
}

export const quienCocina = (o: { horario?: OpcionesMenu["horario"] }, dia: string, tipo: TipoReceta): QuienCocina => o.horario?.[dia]?.[tipo] ?? "yo";

const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Equipo de la receta disponible (cualquiera de las alternativas). */
export function puedeHacerse(r: Receta, equipo: string[]) {
  const tengo = new Set<Equipo>(["ninguno", ...equipo.map((e) => norm(e) as Equipo)]);
  if (r.equipo.length === 2 && r.equipo.includes("licuadora")) return r.equipo.every((e) => tengo.has(e)); // ej. estufa + licuadora
  return r.equipo.some((e) => tengo.has(e));
}

const igual = (p: string, w: string) => p === w || p === `${w}s` || `${p}s` === w;   // palabra completa ("pan" no es "panela")
/** Producto de la despensa que corresponde a un alimento: primero por la primera palabra, luego por cualquier palabra o marca. */
export function enDespensa(d: ItemDespensa[], alimentoId: string): ItemDespensa | undefined {
  const a = POR_ID.get(alimentoId);
  if (!a) return undefined;
  const palabras = norm(`${a.n} ${a.alias ?? ""} ${COMPRAS[alimentoId]?.nombre ?? ""}`).split(/[\s,()]+/).filter((p) => p.length >= 3);
  const conAlgo = d.filter((i) => i.cantidad > 0);
  return conAlgo.find((i) => palabras.some((p) => igual(p, norm(i.nombre).split(/\s+/)[0])))
    ?? conAlgo.find((i) => norm(i.nombre).split(/\s+/).some((w) => w.length >= 4 && palabras.some((p) => igual(p, w))));
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

interface Contexto { usos: Map<string, number>; hoy: Set<string>; principalesHoy: Map<string, number>; ingSemana: Map<string, number>; polloHoy?: number }

/* ---------- Pollo de pollería ---------- */
/** En la pollería se compra por ½ pechuga (~190 g ya cocida); no venden 1/8. */
export const MEDIA_PECHUGA = 190;
const POLLO = new Set(["pechuga-cocida", "pechuga-cruda"]);
const gramosPollo = (r: Receta, factor = 1) => r.ing.reduce((t, [id, g]) => t + (POLLO.has(id) ? (id === "pechuga-cruda" ? g * 0.7 : g) * factor : 0), 0);
/** Lo que sobra de la última ½ pechuga comprada. */
const sobraPollo = (g: number) => (g > 0 ? Math.ceil(g / MEDIA_PECHUGA - 0.1) * MEDIA_PECHUGA - g : 0);

export function polloDelDia(comidas: ComidaMenu[]): { gramos: number; medias: number; sobra: number } | null {
  const gramos = Math.round(comidas.reduce((t, c) => { const r = recetaDeComida(c); return r ? t + gramosPollo(r, c.factor) : t; }, 0));
  if (!gramos) return null;
  const medias = Math.max(1, Math.ceil(gramos / MEDIA_PECHUGA - 0.1));
  return { gramos, medias, sobra: Math.max(0, medias * MEDIA_PECHUGA - gramos) };
}
export const textoPechugas = (medias: number) => medias === 1 ? "½ pechuga" : medias % 2 === 0 ? `${medias / 2} pechuga${medias > 2 ? "s" : ""} entera${medias > 2 ? "s" : ""}` : `${Math.floor(medias / 2)}½ pechugas`;

function puntaje(r: Receta, o: OpcionesMenu, ctx: Contexto, pesoCosto: number) {
  const { usos, hoy } = ctx;
  const ids = r.ing.map(([id]) => id).filter(Boolean);
  let p = Math.random() * 1.5;
  const gPollo = gramosPollo(r);
  if (gPollo && (ctx.polloHoy ?? 0) > 0 && sobraPollo(ctx.polloHoy!) >= 50) p += 9;  // usar el pollo que sobró de la ½ pechuga
  else p -= (ctx.principalesHoy.get(principal(r)) ?? 0) * 7;                 // no repetir proteína el mismo día
  p -= Math.max(0, (ctx.ingSemana.get(principal(r)) ?? 0) - 5) * 1.5;         // ni abusar en la semana
  p += ids.filter((id) => (ctx.ingSemana.get(id) ?? 0) > 0).length * 0.6 * pesoCosto; // reusar ingredientes = comprar menos
  const gustos = expandirGustos(o.gustos);
  p += ids.filter((id) => gustos.includes(id)).length * 3;
  p += ids.filter((id) => enDespensa(o.despensa, id)).length * 2;
  if (o.favoritas.includes(r.id)) p += 4;
  const n = nutricion(r);
  p += n.kcal ? ((n.proteina * 4) / n.kcal) * 8 : 0;          // premia la proteína
  p -= (costo(r) / 10) * pesoCosto;
  if (!o.equipo.includes("Refrigerador") && llevaCarneFresca(r)) p -= 1.5;  // sin refri se compra el mismo día
  if (hoy.has(r.id)) p -= 20;
  p -= (usos.get(r.id) ?? 0) * 4;
  return p;
}

function candidatos(tipo: TipoReceta, o: OpcionesMenu) {
  const evitar = expandirGustos(o.evitar);
  const base = RECETAS.filter((r) => r.tipos.includes(tipo) && puedeHacerse(r, o.equipo) && !r.ing.some(([id]) => evitar.includes(id)));
  if (o.equipo.includes("Refrigerador")) return base;
  // Sin refri: nada de lácteos ni embutidos que se echan a perder (si no queda nada, se permiten)
  const sinRefri = base.filter((r) => !necesitaRefri(r));
  return sinRefri.length >= 3 ? sinRefri : base;
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
  ctx.polloHoy = (ctx.polloHoy ?? 0) + gramosPollo(r);
}

/** Ajusta las porciones del día para acercarse a la meta de calorías. */
function ajustar(comidas: { tipo: TipoReceta; r: Receta | null }[], o: OpcionesMenu): ComidaMenu[] {
  const tipos = comidas.map((c) => c.tipo);
  const total = tipos.reduce((a, t) => a + REPARTO[t], 0);
  return comidas.map(({ tipo, r }) => {
    const meta = (o.kcal * REPARTO[tipo]) / total;
    if (!r) return { tipo, receta: "", factor: Math.round(meta), casa: true };   // factor = kcal sugeridas
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
    const activas = orden.filter((t) => quienCocina(o, dia, t) !== "no");
    const elegidas = activas.map((tipo) => {
      if (quienCocina(o, dia, tipo) === "casa") return { tipo, r: null };
      const r = elegir(tipo, o, ctx, pesoCosto);
      if (r) anotar(ctx, r);
      return { tipo, r };
    }).filter((x): x is { tipo: TipoReceta; r: Receta | null } => x.r !== undefined);
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

/** kcal sugeridas para una comida en casa. */
export const kcalCasa = (c: ComidaMenu) => (c.casa ? c.factor : 0);

function contextoSin(m: MenuGuardado, di: number, ci: number): Contexto {
  const ctx: Contexto = { usos: new Map(), hoy: new Set(), principalesHoy: new Map(), ingSemana: new Map(), polloHoy: 0 };
  m.dias.forEach((d, i) => d.comidas.forEach((c, j) => {
    const rr = recetaPorId(c.receta);
    if (!rr || (i === di && j === ci)) return;
    ctx.usos.set(rr.id, (ctx.usos.get(rr.id) ?? 0) + 1);
    for (const [id] of rr.ing) if (id) ctx.ingSemana.set(id, (ctx.ingSemana.get(id) ?? 0) + 1);
    if (i === di) { ctx.hoy.add(rr.id); const pr = principal(rr); ctx.principalesHoy.set(pr, (ctx.principalesHoy.get(pr) ?? 0) + 1); ctx.polloHoy! += gramosPollo(rr, c.factor); }
  }));
  return ctx;
}

/** Opciones para cambiar una comida: todas las recetas posibles de ese tipo, las que mejor encajan primero. */
export function alternativas(m: MenuGuardado, di: number, ci: number, o: OpcionesMenu): Receta[] {
  const actual = m.dias[di].comidas[ci];
  const ctx = contextoSin(m, di, ci);
  return candidatos(actual.tipo, o)
    .filter((r) => r.id !== actual.receta)
    .map((r) => ({ r, s: puntaje(r, o, ctx, 1) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
}

export interface OpcionesCambio {
  recomendadas: Receta[];
  /** Recetas de otro tiempo de comida que también sirven (una cena como comida, etc.). */
  otrosTiempos: Receta[];
  /** Llevan 1 o 2 cosas que marcó como "no lo como" (por si ese día sí se le antoja). */
  conEvitados: { r: Receta; lleva: string[] }[];
  nEvitar: number;
}

/** Opciones amplias para "Cambiar por…": las recomendadas, de otros tiempos y las que llevan algo evitado. */
export function opcionesCambio(m: MenuGuardado, di: number, ci: number, o: OpcionesMenu): OpcionesCambio {
  const actual = m.dias[di].comidas[ci];
  const ctx = contextoSin(m, di, ci);
  const evitar = expandirGustos(o.evitar);
  const ordenar = (l: Receta[]) => l.map((r) => ({ r, s: puntaje(r, o, ctx, 1) })).sort((a, b) => b.s - a.s).map((x) => x.r);
  const recomendadas = alternativas(m, di, ci, o);
  const ya = new Set([actual.receta, ...recomendadas.map((r) => r.id)]);
  // Colaciones solo entre colaciones; las comidas fuertes se pueden intercambiar entre sí
  const fuertes: TipoReceta[] = ["desayuno", "comida", "cena"];
  const otrosTiempos = actual.tipo === "colacion" ? [] : ordenar(RECETAS.filter((r) =>
    !ya.has(r.id) && !r.tipos.includes(actual.tipo) && r.tipos.some((t) => fuertes.includes(t)) && puedeHacerse(r, o.equipo) && !r.ing.some(([id]) => evitar.includes(id))));
  for (const r of otrosTiempos) ya.add(r.id);
  const nombre = (id: string) => (POR_ID.get(id)?.n ?? id).replace(/ \(.*\)| \/ .*/g, "").toLowerCase();
  const conEvitados = ordenar(RECETAS.filter((r) => !ya.has(r.id) && puedeHacerse(r, o.equipo)
    && (r.tipos.includes(actual.tipo) || (actual.tipo !== "colacion" && r.tipos.some((t) => fuertes.includes(t))))))
    .map((r) => ({ r, lleva: [...new Set(r.ing.filter(([id]) => id && evitar.includes(id)).map(([id]) => nombre(id)))] }))
    .filter((x) => x.lleva.length >= 1 && x.lleva.length <= 2)
    .sort((a, b) => a.lleva.length - b.lleva.length);
  return { recomendadas, otrosTiempos, conEvitados, nEvitar: o.evitar.length };
}

/** Pone una receta elegida en lugar de otra, con una porción de calorías parecidas. */
export function reemplazarComida(m: MenuGuardado, di: number, ci: number, recetaId: string, kcalMeta?: number): MenuGuardado {
  const actual = m.dias[di].comidas[ci];
  const r = recetaPorId(recetaId);
  if (!r) return m;
  const k = nutricion(r).kcal || 1;
  const prev = recetaDeComida(actual);
  const kActual = actual.casa ? actual.factor : prev ? nutricion(prev, actual.factor).kcal : (kcalMeta ?? k);
  const factor = Math.min(1.6, Math.max(0.6, Math.round((kActual / k) * 10) / 10));
  const dias = m.dias.map((d, i) => i !== di ? d : { ...d, comidas: d.comidas.map((c, j) => j !== ci ? c : { tipo: c.tipo, receta: r.id, factor }) });
  return { ...m, dias };
}

export function totalesDia(comidas: ComidaMenu[]) {
  return comidas.reduce((t, c) => {
    if (c.casa) return t;
    const r = recetaDeComida(c);
    if (!r) return t;
    const n = nutricion(r, c.factor);
    return { kcal: t.kcal + n.kcal, proteina: t.proteina + n.proteina };
  }, { kcal: 0, proteina: 0 });
}

/* ---------- Lista del súper ---------- */
export interface ItemSuper { id: string; nombre: string; unidades: number; unidad: string; costo: number; necesita: number; enCasa: number; necesitaU: number; enCasaU: number }

function gramosEnCasa(i: ItemDespensa, alimentoId: string) {
  const a = POR_ID.get(alimentoId);
  if (["pzas", "latas", "rebanadas"].includes(i.unidad)) return i.cantidad * (a?.por[0].g ?? 50);
  if (i.unidad === "g") return i.cantidad;
  if (i.unidad === "kg") return i.cantidad * 1000;
  if (i.unidad === "L") return i.cantidad * 1030;
  // paquete, frasco, bolsa…: una unidad de compra completa (ej. paquete de 30 tostadas)
  return i.cantidad * (COMPRAS[alimentoId]?.g ?? 0);
}

export function listaSuper(m: MenuGuardado, despensa: ItemDespensa[]): { items: ItemSuper[]; total: number; usado: number } {
  const gramos = new Map<string, number>();
  for (const d of m.dias) for (const c of d.comidas) {
    const r = recetaDeComida(c);
    if (!r) continue;
    for (const ing of r.ing) if (ing[0] && ing[1]) gramos.set(ing[0], (gramos.get(ing[0]) ?? 0) + gramosIng(ing, c.factor));
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
    const contable = /^(pzas|latas|medias)/.test(k.unidad);
    // Si lo que falta es muy poquito (menos del 15% de un paquete o pieza), alcanza con lo que tienes
    const unidades = falta <= 0 || (!porPeso && enCasa > 0 && falta < k.g * 0.15) ? 0 : porPeso
      ? Math.max(0.25, Math.ceil((falta / k.g) * 4) / 4)
      : Math.max(1, Math.ceil(falta / k.g - 0.15));
    items.push({
      id, nombre: k.nombre ?? limpiarNombre(POR_ID.get(id)?.n ?? id), unidades,
      unidad: porPeso ? k.unidad.replace(/^kg/, "kg") : k.unidad, costo: Math.round(unidades * k.precio),
      necesita: Math.round(g), enCasa: Math.round(Math.min(g, enCasa)),
      // en unidades de compra (latas, kg, paquetes) para mostrar "tienes 3 de 10"
      // Lo que se cuenta (latas, piezas, medias pechugas) va entero: necesitas hacia arriba, tienes hacia abajo
      necesitaU: porPeso ? Math.round((g / k.g) * 4) / 4 : contable ? Math.ceil(g / k.g - 0.15) : Math.round((g / k.g) * 4) / 4,
      enCasaU: porPeso ? Math.round((Math.min(g, enCasa) / k.g) * 4) / 4 : contable ? Math.floor(Math.min(g, enCasa) / k.g + 0.15) : Math.round((Math.min(g, enCasa) / k.g) * 4) / 4,
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
  if (u === "medias pechugas") return { cantidad: i.unidades * 280, unidad: "g" };
  if (u.startsWith("pzas")) return { cantidad: i.unidades, unidad: "pzas" };
  if (u === "latas") return { cantidad: i.unidades, unidad: "latas" };
  if (u.startsWith("kg")) return { cantidad: i.unidades, unidad: "kg" };
  if (u === "L") return { cantidad: i.unidades, unidad: "L" };
  const g = u.match(/(\d+)\s*g/);
  if (g) return { cantidad: i.unidades * Number(g[1]), unidad: "g" };
  return { cantidad: i.unidades, unidad: "paquete" };
}
