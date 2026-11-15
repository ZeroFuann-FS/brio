// Brío · IA de comida (Supabase Edge Function)
// Acciones:
//   - "analizar": texto libre ("3 huevos a la mexicana con 3 tostadas") -> alimentos con kcal y macros
//   - "menu": menú semanal que usa primero la despensa y respeta presupuesto y equipo de cocina
import Anthropic from "npm:@anthropic-ai/sdk@1.8.0";
import { betaZodOutputFormat } from "npm:@anthropic-ai/sdk@1.8.0/helpers/beta/zod";
import { z } from "npm:zod@4.1.12";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const MODELO = "claude-opus-5-5";
const LIMITES = { analizar: 60, menu: 4 } as const; // por usuario, por día

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const anthropic = new Anthropic(); // lee ANTHROPIC_API_KEY de los secretos de Supabase

/* ---------------- Esquemas de salida ---------------- */
const Alimento = z.object({
  nombre: z.string().describe("Nombre corto en español, ej. 'Huevo entero'"),
  cantidad: z.string().describe("Cantidad legible, ej. '3 piezas', '150 g', '1 taza'"),
  kcal: z.number(),
  proteina: z.number(),
  carbos: z.number(),
  grasa: z.number(),
});
const Analisis = z.object({
  alimentos: z.array(Alimento),
  nombre_comida: z.string().describe("Nombre corto para el registro, ej. 'Huevos a la mexicana con tostadas'"),
  confianza: z.enum(["alta", "media", "baja"]),
  nota: z.string().describe("Una frase: supuestos hechos (porción, aceite) o vacío si no aplica"),
});

const Platillo = z.object({
  tipo: z.enum(["desayuno", "comida", "cena", "snack"]),
  nombre: z.string(),
  ingredientes: z.array(z.string()).describe("Con cantidades, ej. '3 huevos', '125 g de pechuga'"),
  preparacion: z.string().describe("2-3 frases, con el equipo disponible"),
  kcal: z.number(),
  proteina: z.number(),
  usa_despensa: z.array(z.string()).describe("Ingredientes que salen de la despensa del usuario"),
});
const Menu = z.object({
  dias: z.array(z.object({ dia: z.string().describe("lunes, martes, ..."), platillos: z.array(Platillo) })),
  lista_super: z.array(z.object({
    producto: z.string(),
    cantidad: z.string(),
    precio_estimado: z.number().describe("MXN"),
    donde: z.string().describe("Tienda o tipo de lugar sugerido"),
  })),
  total_estimado: z.number().describe("MXN"),
  consejos: z.array(z.string()).describe("2-4 consejos prácticos (conservación sin refri, preparación por adelantado, etc.)"),
});

/* ---------------- Utilidades ---------------- */
async function pedir<T extends z.ZodType>(schema: T, system: string, user: string, effort: "low" | "medium", maxTokens: number): Promise<z.infer<T>> {
  // Respuesta con esquema garantizado + respaldo automático si el modelo declina (refusal)
  const msg = await anthropic.beta.messages.parse({
    model: MODELO,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (msg.stop_reason === "refusal") throw new Error("La IA no pudo procesar esta solicitud.");
  if (msg.stop_reason === "max_tokens") throw new Error("La respuesta quedó incompleta. Intenta con menos detalle.");
  if (!msg.parsed_output) throw new Error("La IA respondió en un formato inesperado. Intenta de nuevo.");
  return msg.parsed_output as z.infer<T>;
}

const SYSTEM_ANALIZAR = `Eres un nutriólogo mexicano que estima calorías y macronutrientes.
Recibes lo que una persona comió, escrito de forma natural (puede incluir comida mexicana, marcas o porciones vagas).
- Divide en alimentos individuales con porciones realistas para México (tortilla de maíz ~30 g, tostada horneada ~12 g, pieza de pan integral de caja ~30 g).
- Si no dicen cantidad, asume una porción típica y dilo en "nota".
- "A la mexicana" lleva jitomate, cebolla y chile; considera ~1 cucharadita de aceite salvo que digan "sin aceite" o "air fryer".
- Valores en kcal y gramos, redondeados a enteros. Sé preciso, no exageres ni minimices.`;

const SYSTEM_MENU = `Eres un nutriólogo mexicano práctico. Armas menús semanales realistas, baratos y ricos.
Reglas:
- Respeta la meta diaria de kcal (±7 %) y llega lo más cerca posible a la proteína meta.
- Usa PRIMERO lo que la persona ya tiene en su despensa y dilo en "usa_despensa".
- Respeta el presupuesto semanal en pesos mexicanos para la lista del súper (solo lo que falta comprar).
- Respeta el equipo de cocina disponible. Si NO tiene refrigerador: nada de cocinar carne o pollo para varios días; proteínas que aguantan (huevo, atún en lata, frijoles, leche en polvo) y pollo/carne solo comprado y cocinado el mismo día.
- Comida casera mexicana común, ingredientes de tiendas como 3B, Aurrera, Soriana o mercado. Repite platillos para ahorrar, pero con algo de variedad.
- Precios estimados realistas para México. Respuestas en español de México.`;

/* ---------------- Servidor ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await supabase.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
  if (!u?.user) return json({ error: "Inicia sesión para usar la IA." }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Solicitud inválida" }, 400); }
  const accion = body.accion as keyof typeof LIMITES;
  if (!(accion in LIMITES)) return json({ error: "Acción desconocida" }, 400);

  const { data: permitido, error: errUso } = await supabase.rpc("usar_ia", { p_tipo: accion, p_limite: LIMITES[accion] });
  if (errUso) return json({ error: "No se pudo verificar tu uso." }, 500);
  if (!permitido) {
    return json({ error: accion === "menu" ? "Ya generaste varios menús hoy. Intenta mañana." : "Llegaste al límite de hoy. Registra a mano o intenta mañana." }, 429);
  }

  try {
    if (accion === "analizar") {
      const texto = String(body.texto ?? "").trim().slice(0, 500);
      if (!texto) return json({ error: "Escribe qué comiste." }, 400);
      const r = await pedir(Analisis, SYSTEM_ANALIZAR, texto, "low", 4000);
      return json(r);
    }

    // accion === "menu"
    const c = body.contexto as Record<string, unknown> | undefined;
    if (!c) return json({ error: "Faltan datos para el menú." }, 400);
    const prompt = `Arma mi menú de ${Number(c.dias) || 7} días (empezando el ${String(c.inicio ?? "lunes")}).
Meta diaria: ${Number(c.kcal)} kcal, ${Number(c.proteina)} g de proteína.
Comidas al día: ${String(c.comidas ?? "desayuno, comida y cena")}.
Presupuesto semanal para el súper: $${Number(c.presupuesto) || 500} MXN.
Equipo de cocina: ${String(c.equipo ?? "estufa")}.
Preferencias o alimentos que no como: ${String(c.preferencias ?? "ninguna").slice(0, 300)}.
Mi despensa (lo que ya tengo): ${String(c.despensa ?? "nada").slice(0, 800)}.`;
    const r = await pedir(Menu, SYSTEM_MENU, prompt, "medium", 16000);
    return json(r);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "La IA está muy ocupada. Intenta en un minuto." }, 503);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: "La IA no está configurada todavía." }, 503);
    if (e instanceof Anthropic.APIError) return json({ error: "La IA no respondió. Intenta de nuevo." }, 502);
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
