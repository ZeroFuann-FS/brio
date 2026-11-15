import { supabase } from "./supabase";
import { useMiIA, type ModeloId } from "./miIA";

/** IA del servidor: solo si Brío tiene su propia API key configurada en Supabase. */
export const iaServidor = import.meta.env.VITE_IA_ACTIVA === "1";

/** ¿Hay IA disponible? Con la key propia del usuario, o la del servidor (esta requiere cuenta). */
export function useIA() {
  const key = useMiIA((s) => s.key);
  return { disponible: !!key || iaServidor, propia: !!key, requiereCuenta: !key && iaServidor };
}

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

type ModCliente = typeof import("./iaCliente");

async function conKeyPropia<T>(fn: (m: ModCliente, key: string, modelo: ModeloId) => Promise<T>): Promise<T> {
  const { key, modelo } = useMiIA.getState();
  const m = await import("./iaCliente");
  try { return await fn(m, key as string, modelo); }
  catch (e) { throw new ErrorIA(e instanceof m.ErrorIACliente ? e.message : "Algo salió mal con la IA."); }
}

export const analizarComida = (texto: string): Promise<AnalisisIA> =>
  useMiIA.getState().key
    ? conKeyPropia((m, key, modelo) => m.pedirCliente(key, modelo, m.Analisis, m.SYSTEM_ANALIZAR, texto.slice(0, 500), "low", 4000))
    : llamar<AnalisisIA>({ accion: "analizar", texto });

function promptMenu(c: Record<string, unknown>) {
  return [
    `Arma mi menú de ${Number(c.dias) || 7} días (empezando el ${String(c.inicio ?? "lunes")}).`,
    `Meta diaria: ${Number(c.kcal)} kcal, ${Number(c.proteina)} g de proteína.`,
    `Comidas al día: ${String(c.comidas ?? "desayuno, comida y cena")}.`,
    `Presupuesto semanal para el súper: ${Number(c.presupuesto) || 500} pesos MXN.`,
    `Equipo de cocina: ${String(c.equipo ?? "estufa")}.`,
    `Preferencias o alimentos que no como: ${String(c.preferencias ?? "ninguna").slice(0, 300)}.`,
    `Mi despensa (lo que ya tengo): ${String(c.despensa ?? "nada").slice(0, 800)}.`,
  ].join("\n");
}

export const generarMenu = (contexto: Record<string, unknown>): Promise<MenuIA> =>
  useMiIA.getState().key
    ? conKeyPropia((m, key, modelo) => m.pedirCliente(key, modelo, m.Menu, m.SYSTEM_MENU, promptMenu(contexto), "medium", 16000))
    : llamar<MenuIA>({ accion: "menu", contexto });
