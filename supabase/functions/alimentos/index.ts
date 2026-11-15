// Brío · Búsqueda de productos de marca en Open Food Facts (ODbL).
// Hace de intermediario porque el buscador de OFF no permite llamadas directas desde el navegador.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};
const CAMPOS = "code,product_name,product_name_es,brands,serving_quantity,serving_size,nutriments,image_front_small_url";

async function buscar(q: string) {
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=24&fields=${CAMPOS}`;
  const r = await fetch(url, { headers: { "User-Agent": "Brio/1.0 (app de salud sin fines de lucro)" } });
  if (!r.ok) throw new Error(`OFF ${r.status}`);
  const j = await r.json() as { hits?: Record<string, unknown>[] };
  return (j.hits ?? []).filter((h) => (h.nutriments as Record<string, unknown> | undefined)?.["energy-kcal_100g"] != null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ productos: [] }, { headers: cors });
  try {
    // Primero productos de México; si hay pocos, búsqueda general
    let productos = await buscar(`${q} countries_tags:"en:mexico"`);
    if (productos.length < 5) productos = [...productos, ...(await buscar(q))].slice(0, 24);
    const vistos = new Set<string>();
    productos = productos.filter((p) => { const k = String(p.code ?? p.product_name); if (vistos.has(k)) return false; vistos.add(k); return true; });
    return Response.json({ productos }, { headers: { ...cors, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ error: "No se pudo buscar ahora" }, { status: 502, headers: cors });
  }
});
