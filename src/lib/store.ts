import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hoyISO, sumarDias, type Habito, type Perfil, type PrefsComida } from "./calc";
import type { MenuIA } from "./ia";

export interface MenuGuardado { creado: string; menu: MenuIA; comprado: string[] }

export type TipoComida = "desayuno" | "comida" | "cena" | "snack";

export interface Comida {
  id: string;
  nombre: string;
  kcal: number;
  proteina: number;
  carbos?: number;
  grasa?: number;
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

export const MEDIDAS = [
  { id: "cintura", t: "Cintura", como: "A la altura del ombligo, sin apretar, al final de exhalar." },
  { id: "cuello", t: "Cuello", como: "Justo debajo de la manzana de Adán, cinta horizontal." },
  { id: "cadera", t: "Cadera", como: "En la parte más ancha de los glúteos, pies juntos." },
  { id: "pecho", t: "Pecho", como: "A la altura de los pezones, brazos relajados." },
  { id: "brazo", t: "Brazo", como: "En la parte más ancha del bíceps, brazo relajado." },
  { id: "muslo", t: "Muslo", como: "En la parte más ancha, de pie y con peso en ambas piernas." },
] as const;
export type IdMedida = (typeof MEDIDAS)[number]["id"];
export type RegistroMedidas = { fecha: string } & Partial<Record<IdMedida, number>>;
export const DIAS_ENTRE_MEDIDAS = 14;

export interface ItemDespensa {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

/** Catálogo de hábitos para elegir en el onboarding. */
export const CATALOGO_HABITOS: Habito[] = [
  { id: "entreno", e: "🏋️", t: "Entrenar o moverme" },
  { id: "pasos", e: "🚶", t: "Caminar 10,000 pasos" },
  { id: "lectura", e: "📖", t: "Leer 15 minutos" },
  { id: "sueno", e: "😴", t: "Dormir 7–8 horas" },
  { id: "aprender", e: "🧠", t: "Estudiar o aprender algo" },
  { id: "sinazucar", e: "🥤", t: "Sin refresco ni dulces" },
  { id: "verdura", e: "🥦", t: "Comer verdura" },
  { id: "ahorro", e: "💰", t: "Ahorrar o anotar mis gastos" },
  { id: "meditar", e: "🧘", t: "Meditar 5 minutos" },
  { id: "pantallas", e: "📵", t: "Sin celular antes de dormir" },
];
export const HABITOS_DEFAULT = ["entreno", "pasos", "lectura", "sueno"];
export const MAX_HABITOS = 8;

export const habitosDe = (p: Perfil | null): Habito[] =>
  p?.habitos?.length ? p.habitos : CATALOGO_HABITOS.filter((h) => HABITOS_DEFAULT.includes(h.id));

/** Un "día con brío": cumplir al menos el 60 % (hábitos + meta de agua). */
export const minBrio = (nHabitos: number) => Math.max(1, Math.ceil((nHabitos + 1) * 0.6));

const diaVacio = (): Dia => ({ comidas: [], aguaMl: 0, habitos: {} });
const uid = () => Math.random().toString(36).slice(2, 10);

interface Estado {
  perfil: Perfil | null;
  dias: Record<string, Dia>;
  pesos: Peso[];
  despensa: ItemDespensa[];
  medidas: RegistroMedidas[];
  menu: MenuGuardado | null;
  setMenu: (m: MenuGuardado | null) => void;
  marcarComprado: (producto: string) => void;
  setPrefsComida: (p: PrefsComida) => void;
  setPerfil: (p: Perfil) => void;
  dia: (fecha: string) => Dia;
  addComida: (fecha: string, c: Omit<Comida, "id">) => void;
  removeComida: (fecha: string, id: string) => void;
  copiarDia: (desde: string, hacia: string) => number;
  addAgua: (fecha: string, ml: number) => void;
  toggleHabito: (fecha: string, id: string) => void;
  addPeso: (kg: number, fecha?: string) => void;
  removePeso: (fecha: string) => void;
  addMedidas: (m: RegistroMedidas) => void;
  removeMedidas: (fecha: string) => void;
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
        medidas: [],
        menu: null,
        setMenu: (m) => set({ menu: m }),
        marcarComprado: (producto) =>
          set((s) => s.menu ? { menu: { ...s.menu, comprado: s.menu.comprado.includes(producto) ? s.menu.comprado.filter((x) => x !== producto) : [...s.menu.comprado, producto] } } : {}),
        setPrefsComida: (p) => set((s) => (s.perfil ? { perfil: { ...s.perfil, prefsComida: p } } : {})),
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
        addMedidas: (m) =>
          set((s) => {
            const previo = s.medidas.find((x) => x.fecha === m.fecha);
            const nuevo = { ...previo, ...m };
            return { medidas: [...s.medidas.filter((x) => x.fecha !== m.fecha), nuevo].sort((a, b) => a.fecha.localeCompare(b.fecha)) };
          }),
        removeMedidas: (fecha) => set((s) => ({ medidas: s.medidas.filter((x) => x.fecha !== fecha) })),
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
        reset: () => set({ perfil: null, dias: {}, pesos: [], despensa: [], medidas: [], menu: null }),
      };
    },
    { name: "brio:datos-v3", version: 3, migrate: (e) => ({ medidas: [], menu: null, ...(e as object) }) as unknown as Estado },
  ),
);

export function pesoActual(pesos: Peso[], fallback: number) {
  return pesos.length ? pesos[pesos.length - 1].kg : fallback;
}

export function puntosDia(d: Dia | undefined, aguaMeta: number, habitos: Habito[]) {
  if (!d) return 0;
  return habitos.filter((h) => d.habitos[h.id]).length + (d.aguaMl >= aguaMeta ? 1 : 0);
}

/** Días seguidos con brío. Si hoy aún no se completa, cuenta desde ayer. */
export function racha(dias: Record<string, Dia>, aguaMeta: number, habitos: Habito[]) {
  const min = minBrio(habitos.length);
  let fecha = hoyISO();
  if (puntosDia(dias[fecha], aguaMeta, habitos) < min) fecha = sumarDias(fecha, -1);
  let n = 0;
  while (puntosDia(dias[fecha], aguaMeta, habitos) >= min) {
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
      if (!vistas.has(k)) vistas.set(k, { nombre: c.nombre, kcal: c.kcal, proteina: c.proteina, carbos: c.carbos, grasa: c.grasa, tipo: c.tipo });
      if (vistas.size >= max) return [...vistas.values()];
    }
  }
  return [...vistas.values()];
}
