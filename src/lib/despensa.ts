/**
 * Reglas de la despensa: cantidades como se compran de verdad y productos iguales en una sola fila.
 * - Latas, piezas y rebanadas van enteras (una lata abierta, sin refri, es una lata usada).
 * - Gramos sin decimales.
 * - Kilos, litros y paquetes en cuartos (¼ kg, ½ paquete).
 */
import type { ItemDespensa } from "./store";

const CONTABLES = new Set(["pzas", "latas", "rebanadas"]);
export const esContable = (unidad: string) => CONTABLES.has(unidad);

/** Cantidad que tiene sentido guardar para esa unidad. */
export function normalizarCantidad(cantidad: number, unidad: string) {
  const c = Math.max(0, cantidad);
  if (esContable(unidad)) return Math.round(c);
  if (unidad === "g") return Math.round(c);
  return Math.round(c * 4) / 4;
}

/** Cuánto se gasta al usar `usado` de un producto: lo contable se redondea hacia arriba (con 15% de tolerancia). */
export function consumo(usado: number, unidad: string) {
  if (!(usado > 0)) return 0;
  if (esContable(unidad)) return Math.max(1, Math.ceil(usado - 0.15));
  return usado;
}

const SINGULAR: Record<string, string> = { pzas: "pza", latas: "lata", rebanadas: "rebanada" };
const CUARTOS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };
/** "2 latas", "350 g", "1½ kg", "¼ paquete". */
export function fmtCantidad(cantidad: number, unidad: string) {
  const c = normalizarCantidad(cantidad, unidad);
  if (esContable(unidad) || unidad === "g") return `${c.toLocaleString("es-MX")} ${c === 1 ? SINGULAR[unidad] ?? unidad : unidad}`;
  const entero = Math.floor(c), resto = Math.round((c - entero) * 100) / 100;
  if (c === 0 && cantidad > 0) return `un poco (${unidad})`;
  const txt = resto ? `${entero || ""}${CUARTOS[resto] ?? ""}` : String(entero);
  return `${txt} ${unidad}`;
}

const VACIAS = new Set(["de", "en", "la", "el", "los", "las", "con", "y"]);
const palabras = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[\s,()·.-]+/).filter((w) => w && !VACIAS.has(w)).map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));

/**
 * ¿Son el mismo producto? Misma unidad y además:
 * - uno es el otro con marca o detalle al final ("Atún en lata" = "Atún en lata Mar Alta";
 *   "Pan blanco" ≠ "Pan integral Molino Blanco"), o
 * - son latas y empiezan igual ("Atún Mar" = "Atún en lata"): la marca no importa.
 */
export function mismoProducto(a: Pick<ItemDespensa, "nombre" | "unidad">, b: Pick<ItemDespensa, "nombre" | "unidad">) {
  if (a.unidad !== b.unidad) return false;
  const pa = palabras(a.nombre), pb = palabras(b.nombre);
  if (!pa.length || !pb.length) return false;
  const [corta, larga] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  if (corta.every((w, i) => larga[i] === w)) return true; // el corto es el inicio del largo (lo demás es marca o detalle)
  return a.unidad === "latas" && pa[0] === pb[0];
}

/** Junta productos repetidos (se queda el nombre más corto, que es el genérico) y redondea cantidades. */
export function unificarDespensa(d: ItemDespensa[]): ItemDespensa[] {
  const out: ItemDespensa[] = [];
  for (const i of d) {
    const igual = out.find((x) => mismoProducto(x, i));
    if (!igual) { out.push({ ...i }); continue; }
    igual.cantidad += i.cantidad;
    if (i.nombre.length < igual.nombre.length) { igual.nombre = i.nombre; }
    if (igual.minimo == null && i.minimo != null) igual.minimo = i.minimo;
  }
  for (const x of out) {
    x.cantidad = normalizarCantidad(x.cantidad, x.unidad);
    if (x.minimo != null) x.minimo = normalizarCantidad(x.minimo, x.unidad);
  }
  return out;
}
