import { supabase } from "./supabase";

/** La IA solo se muestra si está activada (requiere API key de Claude en Supabase). */
export const iaActiva = import.meta.env.VITE_IA_ACTIVA === "1";

export interface AlimentoIA { nombre: string; cantidad: string; kcal: number; proteina: number; carbos: number; grasa: number }
export interface AnalisisIA { alimentos: AlimentoIA[]; nombre_comida: string; confianza: "alta" | "media" | "baja"; nota: string }

export interface PlatilloIA {
  tipo: "desayuno" | "comida" | "cena" | "snack";
  nombre: string; ingredientes: string[]; preparacion: string; kcal: number; proteina: number; usa_despensa: string[];
}
export interface MenuIA {
  dias: { dia: string; platillos: PlatilloIA[] }[];
  lista_super: { producto: string; cantidad: string; precio_estimado: number; donde: string }[];
  total_estimado: number;
  consejos: string[];
}

export class ErrorIA extends Error {}

async function llamar<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ia", { body });
  if (error) {
    // El cuerpo del error trae nuestro mensaje en español
    let msg = "No se pudo conectar con la IA. Revisa tu internet.";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try { const j = await ctx.json(); if (j?.error) msg = j.error; } catch { /* sin cuerpo */ }
    }
    throw new ErrorIA(msg);
  }
  if (data?.error) throw new ErrorIA(data.error);
  return data as T;
}

export const analizarComida = (texto: string) => llamar<AnalisisIA>({ accion: "analizar", texto });

export const generarMenu = (contexto: Record<string, unknown>) => llamar<MenuIA>({ accion: "menu", contexto });
