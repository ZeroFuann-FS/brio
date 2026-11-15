/** Alimentos capturados por usuarios de Brío (marcas que no están en otras bases). */
import { supabase } from "./supabase";
import type { Alimento } from "../data/alimentos";

interface Fila {
  id: string; codigo: string | null; nombre: string; marca: string | null;
  porcion_t: string; porcion_g: number; kcal: number; proteina: number; carbos: number; grasa: number;
}

const aAlimento = (f: Fila): Alimento => ({
  id: `com-${f.id}`,
  n: f.marca ? `${f.nombre} · ${f.marca}` : f.nombre,
  cat: "Capturado en Brío",
  kcal: Number(f.kcal), p: Number(f.proteina), c: Number(f.carbos), g: Number(f.grasa),
  por: [{ t: f.porcion_t, g: Number(f.porcion_g) }, { t: "100 g", g: 100 }],
  codigo: f.codigo ?? undefined,
  fuente: "comunidad",
});

const COLS = "id, codigo, nombre, marca, porcion_t, porcion_g, kcal, proteina, carbos, grasa";
const limpiar = (s: string) => s.replace(/[^\p{L}\p{N} ]/gu, " ").trim();

export async function buscarComunidad(q: string): Promise<Alimento[]> {
  const palabras = limpiar(q).split(/\s+/).filter((w) => w.length >= 2).map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
  if (!palabras.length) return [];
  const w = palabras[0];
  const { data, error } = await supabase.from("alimentos_comunidad").select(COLS).or(`nombre.ilike.%${w}%,marca.ilike.%${w}%`).limit(30);
  if (error || !data) return [];
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return (data as Fila[])
    .filter((f) => palabras.every((p) => norm(`${f.nombre} ${f.marca ?? ""}`).includes(norm(p))))
    .map(aAlimento);
}

export async function porCodigoComunidad(codigo: string): Promise<Alimento | null> {
  const { data } = await supabase.from("alimentos_comunidad").select(COLS).eq("codigo", codigo).maybeSingle();
  return data ? aAlimento(data as Fila) : null;
}

export interface NuevoAlimento {
  nombre: string; marca?: string; codigo?: string;
  porcion_t: string; porcion_g: number;
  // valores tal como vienen en la etiqueta, por porción
  kcal: number; proteina: number; carbos: number; grasa: number;
}

/** Guarda el alimento (convierte los valores por porción a por 100 g). */
export async function crearAlimento(n: NuevoAlimento): Promise<Alimento> {
  const f = 100 / n.porcion_g;
  const r1 = (x: number) => Math.round(x * f * 10) / 10;
  const { data, error } = await supabase.from("alimentos_comunidad").insert({
    nombre: n.nombre.trim(), marca: n.marca?.trim() || null, codigo: n.codigo || null,
    porcion_t: n.porcion_t.trim() || "porción", porcion_g: n.porcion_g,
    kcal: r1(n.kcal), proteina: r1(n.proteina), carbos: r1(n.carbos), grasa: r1(n.grasa),
  }).select(COLS).single();
  if (error) throw new Error(error.code === "23505" ? "Ese código de barras ya está registrado." : "No se pudo guardar. Revisa los datos.");
  return aAlimento(data as Fila);
}
