/**
 * Números generales de Brío (sin datos personales), para el README o una página pública.
 *  - /functions/v1/estadisticas            → JSON con todos los números
 *  - /functions/v1/estadisticas?badge=usuarios → formato de insignia de shields.io (endpoint)
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const ETIQUETAS: Record<string, string> = {
  usuarios: "usuarios", activos_semana: "activos esta semana", comidas_registradas: "comidas registradas",
  entrenos: "entrenos", recetas: "recetas", ejercicios: "ejercicios",
};
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("estadisticas_publicas");
  if (error) return new Response(JSON.stringify({ error: "no disponible" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  const badge = new URL(req.url).searchParams.get("badge");
  const cuerpo = badge && badge in ETIQUETAS
    ? { schemaVersion: 1, label: ETIQUETAS[badge], message: Number(data[badge] ?? 0).toLocaleString("es-MX"), color: "c6f432", labelColor: "0e0f11" }
    : data;
  return new Response(JSON.stringify(cuerpo), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" } });
});
