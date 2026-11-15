/**
 * Open Food Facts: base de datos libre de productos empacados (licencia ODbL).
 * https://world.openfoodfacts.org · Usamos su búsqueda de productos de México.
 */
import type { Alimento } from "../data/alimentos";

interface ProductoOFF {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string | string[];
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
}

const marcaDe = (b?: string | string[]) => (Array.isArray(b) ? b[0] : b?.split(",")[0])?.trim() ?? "";
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);

function aAlimento(p: ProductoOFF): Alimento | null {
  const n = p.nutriments ?? {};
  const kcal = num(n["energy-kcal_100g"]);
  const nombre = (p.product_name_es || p.product_name || "").trim();
  if (!nombre || !Number.isFinite(kcal)) return null;
  const porcionG = num(p.serving_quantity);
  const por = Number.isFinite(porcionG) && porcionG > 0
    ? [{ t: p.serving_size ? `porción (${p.serving_size})` : "porción", g: porcionG }, { t: "100 g", g: 100 }]
    : [{ t: "100 g", g: 100 }];
  return {
    id: `off-${p.code ?? nombre}`,
    n: marcaDe(p.brands) ? `${nombre} · ${marcaDe(p.brands)}` : nombre,
    cat: "Producto de marca",
    kcal: Math.round(kcal),
    p: Math.round((num(n.proteins_100g) || 0) * 10) / 10,
    c: Math.round((num(n.carbohydrates_100g) || 0) * 10) / 10,
    g: Math.round((num(n.fat_100g) || 0) * 10) / 10,
    por,
  };
}

const CAMPOS = "code,product_name,product_name_es,brands,serving_quantity,serving_size,nutriments";

export async function buscarOFF(q: string, signal?: AbortSignal): Promise<Alimento[]> {
  // Pasa por nuestra función de Supabase (el buscador de OFF no permite llamadas directas del navegador)
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  const r = await fetch(`${base}/functions/v1/alimentos?q=${encodeURIComponent(q)}`, { signal });
  if (!r.ok) throw new Error("No se pudo buscar");
  const j = (await r.json()) as { productos?: ProductoOFF[] };
  return (j.productos ?? []).map(aAlimento).filter((a): a is Alimento => !!a);
}

export async function porCodigoOFF(codigo: string): Promise<Alimento | null> {
  const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`);
  if (!r.ok) return null;
  const j = (await r.json()) as { status?: number; product?: ProductoOFF };
  return j.status === 1 && j.product ? aAlimento({ ...j.product, code: codigo }) : null;
}
