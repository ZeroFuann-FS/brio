/**
 * IA desde el navegador con la key del propio usuario ("trae tu propia IA").
 * Mismos esquemas e instrucciones que la función del servidor (supabase/functions/ia).
 * Se carga solo cuando se usa (import dinámico) para no pesar en la app.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { ModeloId } from "./miIA";

const Alimento = z.object({
  nombre: z.string().describe("Nombre corto en español, ej. 'Huevo entero'"),
  cantidad: z.string().describe("Cantidad legible, ej. '3 piezas', '150 g', '1 taza'"),
  kcal: z.number(), proteina: z.number(), carbos: z.number(), grasa: z.number(),
});
export const Analisis = z.object({
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
  kcal: z.number(), proteina: z.number(),
  usa_despensa: z.array(z.string()).describe("Ingredientes que salen de la despensa del usuario"),
});
export const Menu = z.object({
  dias: z.array(z.object({ dia: z.string().describe("lunes, martes, ..."), platillos: z.array(Platillo) })),
  lista_super: z.array(z.object({
    producto: z.string(), cantidad: z.string(),
    precio_estimado: z.number().describe("MXN"), donde: z.string().describe("Tienda o tipo de lugar sugerido"),
  })),
  total_estimado: z.number().describe("MXN"),
  consejos: z.array(z.string()).describe("2-4 consejos prácticos"),
});

export const SYSTEM_ANALIZAR = `Eres un nutriólogo mexicano que estima calorías y macronutrientes.
Recibes lo que una persona comió, escrito de forma natural (puede incluir comida mexicana, marcas o porciones vagas).
- Divide en alimentos individuales con porciones realistas para México (tortilla de maíz ~30 g, tostada horneada ~12 g, pieza de pan integral de caja ~30 g).
- Si no dicen cantidad, asume una porción típica y dilo en "nota".
- "A la mexicana" lleva jitomate, cebolla y chile; considera ~1 cucharadita de aceite salvo que digan "sin aceite" o "air fryer".
- Valores en kcal y gramos, redondeados a enteros. Sé preciso, no exageres ni minimices.`;

export const SYSTEM_MENU = `Eres un nutriólogo mexicano práctico. Armas menús semanales realistas, baratos y ricos.
Reglas:
- Respeta la meta diaria de kcal (±7 %) y llega lo más cerca posible a la proteína meta.
- Usa PRIMERO lo que la persona ya tiene en su despensa y dilo en "usa_despensa".
- Respeta el presupuesto semanal en pesos mexicanos para la lista del súper (solo lo que falta comprar).
- Respeta el equipo de cocina disponible. Si NO tiene refrigerador: nada de cocinar carne o pollo para varios días; proteínas que aguantan (huevo, atún en lata, frijoles, leche en polvo) y pollo/carne solo comprado y cocinado el mismo día.
- Comida casera mexicana común, ingredientes de tiendas como 3B, Aurrera, Soriana o mercado. Repite platillos para ahorrar, pero con algo de variedad.
- Precios estimados realistas para México. Respuestas en español de México.`;

export class ErrorIACliente extends Error {}

export async function pedirCliente<T extends z.ZodType>(
  key: string, modelo: ModeloId, schema: T, system: string, user: string, effort: "low" | "medium", maxTokens: number,
): Promise<z.infer<T>> {
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  // Haiku 5.5 no tiene respaldo del lado del servidor; Opus y Sonnet sí
  const conRespaldo = modelo !== "claude-haiku-5-5";
  try {
    const msg = await client.beta.messages.parse({
      model: modelo,
      max_tokens: maxTokens,
      ...(conRespaldo ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      output_config: { effort, format: betaZodOutputFormat(schema) },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (msg.stop_reason === "refusal") throw new ErrorIACliente("La IA no pudo procesar esta solicitud.");
    if (msg.stop_reason === "max_tokens") throw new ErrorIACliente("La respuesta quedó incompleta. Intenta de nuevo.");
    if (!msg.parsed_output) throw new ErrorIACliente("La IA respondió en un formato inesperado. Intenta de nuevo.");
    return msg.parsed_output as z.infer<T>;
  } catch (e) {
    if (e instanceof ErrorIACliente) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new ErrorIACliente("Tu key de Claude ya no es válida. Revísala en Perfil.");
    if (e instanceof Anthropic.RateLimitError) throw new ErrorIACliente("Claude está muy ocupado o llegaste a tu límite. Intenta en un minuto.");
    if (e instanceof Anthropic.BadRequestError && /credit|balance|billing/i.test(e.message)) throw new ErrorIACliente("Tu cuenta de Claude no tiene saldo. Recarga en platform.claude.com.");
    if (e instanceof Anthropic.APIError) throw new ErrorIACliente(`Claude respondió con un error (${e.status}). Intenta de nuevo.`);
    throw new ErrorIACliente("No se pudo conectar con Claude. Revisa tu internet.");
  }
}
