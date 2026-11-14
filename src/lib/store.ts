import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hoyISO, sumarDias, type Perfil } from "./calc";

export type TipoComida = "desayuno" | "comida" | "cena" | "snack";

export interface Comida {
  id: string;
  nombre: string;
  kcal: number;
  proteina: number;
  tipo: TipoComida;
}

export interface Dia {
  comidas: Comida[];
  aguaMl: number;
  habitos: Record<string, boolean>;
}

export interface Peso {
  fecha: string;
  kg: number;
}

export interface ItemDespensa {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

export const HABITOS = [
  { id: "entreno", e: "🏋️", t: "Entrené o me moví" },
  { id: "lectura", e: "📖", t: "Leí 15+ min" },
  { id: "pasos", e: "🚶", t: "10,000 pasos" },
  { id: "sueno", e: "😴", t: "Dormí 7–8 h" },
] as const;

/** Un "día con brío": al menos 3 de 5 (los 4 hábitos + meta de agua). */
export const MIN_BRIO = 3;

const diaVacio = (): Dia => ({ comidas: [], aguaMl: 0, habitos: {} });
const uid = () => Math.random().toString(36).slice(2, 10);

interface Estado {
  perfil: Perfil | null;
  dias: Record<string, Dia>;
  pesos: Peso[];
  despensa: ItemDespensa[];
  setPerfil: (p: Perfil) => void;
  dia: (fecha: string) => Dia;
  addComida: (fecha: string, c: Omit<Comida, "id">) => void;
  removeComida: (fecha: string, id: string) => void;
  copiarDia: (desde: string, hacia: string) => number;
  addAgua: (fecha: string, ml: number) => void;
  toggleHabito: (fecha: string, id: string) => void;
  addPeso: (kg: number, fecha?: string) => void;
  removePeso: (fecha: string) => void;
  addItem: (i: Omit<ItemDespensa, "id">) => void;
  cambiarCantidad: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export const useBrio = create<Estado>()(
  persist(
    (set, get) => {
      const editarDia = (fecha: string, fn: (d: Dia) => Dia) =>
        set((s) => ({ dias: { ...s.dias, [fecha]: fn(s.dias[fecha] ?? diaVacio()) } }));

      return {
        perfil: null,
        dias: {},
        pesos: [],
        despensa: [],
        setPerfil: (p) =>
          set((s) => ({
            perfil: p,
            pesos: s.pesos.length ? s.pesos : [{ fecha: hoyISO(), kg: p.pesoInicial }],
          })),
        dia: (fecha) => get().dias[fecha] ?? diaVacio(),
        addComida: (fecha, c) => editarDia(fecha, (d) => ({ ...d, comidas: [...d.comidas, { ...c, id: uid() }] })),
        removeComida: (fecha, id) => editarDia(fecha, (d) => ({ ...d, comidas: d.comidas.filter((c) => c.id !== id) })),
        copiarDia: (desde, hacia) => {
          const origen = get().dias[desde]?.comidas ?? [];
          if (!origen.length) return 0;
          editarDia(hacia, (d) => ({ ...d, comidas: [...d.comidas, ...origen.map((c) => ({ ...c, id: uid() }))] }));
          return origen.length;
        },
        addAgua: (fecha, ml) => editarDia(fecha, (d) => ({ ...d, aguaMl: Math.max(0, d.aguaMl + ml) })),
        toggleHabito: (fecha, id) => editarDia(fecha, (d) => ({ ...d, habitos: { ...d.habitos, [id]: !d.habitos[id] } })),
        addPeso: (kg, fecha = hoyISO()) =>
          set((s) => ({
            pesos: [...s.pesos.filter((p) => p.fecha !== fecha), { fecha, kg }].sort((a, b) => a.fecha.localeCompare(b.fecha)),
          })),
        removePeso: (fecha) => set((s) => ({ pesos: s.pesos.filter((p) => p.fecha !== fecha) })),
        addItem: (i) =>
          set((s) => {
            const existe = s.despensa.find((x) => x.nombre.toLowerCase() === i.nombre.toLowerCase());
            if (existe) return { despensa: s.despensa.map((x) => (x === existe ? { ...x, cantidad: x.cantidad + i.cantidad } : x)) };
            return { despensa: [...s.despensa, { ...i, id: uid() }] };
          }),
        cambiarCantidad: (id, delta) =>
          set((s) => ({ despensa: s.despensa.map((x) => (x.id === id ? { ...x, cantidad: Math.max(0, x.cantidad + delta) } : x)) })),
        removeItem: (id) => set((s) => ({ despensa: s.despensa.filter((x) => x.id !== id) })),
        reset: () => set({ perfil: null, dias: {}, pesos: [], despensa: [] }),
      };
    },
    { name: "brio:datos-v2", version: 1 },
  ),
);

export function pesoActual(pesos: Peso[], fallback: number) {
  return pesos.length ? pesos[pesos.length - 1].kg : fallback;
}

export function puntosDia(d: Dia | undefined, aguaMeta: number) {
  if (!d) return 0;
  return HABITOS.filter((h) => d.habitos[h.id]).length + (d.aguaMl >= aguaMeta ? 1 : 0);
}

/** Días seguidos con brío. Si hoy aún no se completa, cuenta desde ayer. */
export function racha(dias: Record<string, Dia>, aguaMeta: number) {
  let fecha = hoyISO();
  if (puntosDia(dias[fecha], aguaMeta) < MIN_BRIO) fecha = sumarDias(fecha, -1);
  let n = 0;
  while (puntosDia(dias[fecha], aguaMeta) >= MIN_BRIO) {
    n++;
    fecha = sumarDias(fecha, -1);
  }
  return n;
}

/** Comidas recientes únicas para re-agregar con un toque. */
export function frecuentes(dias: Record<string, Dia>, max = 8): Omit<Comida, "id">[] {
  const vistas = new Map<string, Omit<Comida, "id">>();
  for (const f of Object.keys(dias).sort().reverse()) {
    for (const c of [...dias[f].comidas].reverse()) {
      const k = c.nombre.trim().toLowerCase();
      if (!vistas.has(k)) vistas.set(k, { nombre: c.nombre, kcal: c.kcal, proteina: c.proteina, tipo: c.tipo });
      if (vistas.size >= max) return [...vistas.values()];
    }
  }
  return [...vistas.values()];
}
