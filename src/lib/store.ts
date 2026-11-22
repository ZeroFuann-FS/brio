import { create } from "zustand";
import { consumo, mismoProducto, normalizarCantidad, unificarDespensa } from "./despensa";
import { persist } from "zustand/middleware";
import { hoyISO, sumarDias, type Habito, type Perfil, type PlanNutriologo, type PrefsComida } from "./calc";
import type { Equivalentes, GrupoEq } from "../data/equivalentes";
import { corregirHistorial, recordsDe, type PrefsEntreno, type Sesion } from "./entreno";
import type { TipoReceta } from "../data/recetas";

/** receta vacía + casa = comida que se hace en casa o fuera (sin receta ni compras). */
export interface ComidaMenu { tipo: TipoReceta; receta: string; factor: number; casa?: boolean }
export interface MenuGuardado { creado: string; dias: { dia: string; comidas: ComidaMenu[] }[]; comprado: string[] }

export type TipoComida = "desayuno" | "comida" | "cena" | "snack";

export interface Comida {
  id: string;
  nombre: string;
  kcal: number;
  proteina: number;
  carbos?: number;
  grasa?: number;
  tipo: TipoComida;
  eq?: Equivalentes;      // equivalentes SMAE (si se pudo calcular)
  plan?: string;          // tiempo del plan del nutriólogo que cubre
}

export interface Dia {
  comidas: Comida[];
  aguaMl: number;
  habitos: Record<string, boolean>;
  extra?: {
    eq?: Equivalentes;      // ajustes manuales de equivalentes
    conBrio?: boolean;      // si el día cumplió, con las reglas que había ESE día (cambiar hábitos o meta de agua después no lo borra)
    salvado?: string;       // racha restaurada a mano (motivo)
  };
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
  minimo?: number; // avisar cuando quede esta cantidad o menos
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
  setPlan: (p: PlanNutriologo) => void;
  setAgenda: (a: import("./agenda").Agenda) => void;
  setRecordatorios: (r: import("./agenda").Recordatorios) => void;
  setMetas: (m: import("./metas").Meta[]) => void;
  marcarHabito: (fecha: string, id: string) => void;
  sesiones: Sesion[];
  sesionActiva: Sesion | null;
  setEntreno: (e: PrefsEntreno) => void;
  iniciarSesion: (s: Sesion) => void;
  editarSesion: (fn: (s: Sesion) => Sesion) => void;
  terminarSesion: () => Sesion | null;
  descartarSesion: () => void;
  borrarSesion: (id: string) => void;
  /** Cambia un ejercicio por otro en todos los entrenos guardados (y recalcula récords). */
  corregirEjercicio: (de: string, a: string) => void;
  ajustarEq: (fecha: string, g: GrupoEq, delta: number) => void;
  dia: (fecha: string) => Dia;
  addComida: (fecha: string, c: Omit<Comida, "id">) => void;
  removeComida: (fecha: string, id: string) => void;
  copiarDia: (desde: string, hacia: string) => number;
  addAgua: (fecha: string, ml: number) => void;
  toggleHabito: (fecha: string, id: string) => void;
  marcarConBrio: (fecha: string, conBrio: boolean) => void;
  addPeso: (kg: number, fecha?: string) => void;
  removePeso: (fecha: string) => void;
  addMedidas: (m: RegistroMedidas) => void;
  removeMedidas: (fecha: string) => void;
  addItem: (i: Omit<ItemDespensa, "id">) => void;
  cambiarCantidad: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  setMinimo: (id: string, minimo: number) => void;
  descontar: (id: string, cantidad: number) => void;
  unificarDespensa: () => void;
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
        sesiones: [],
        sesionActiva: null,
        setEntreno: (entreno) => set((s) => (s.perfil ? { perfil: { ...s.perfil, entreno } } : {})),
        iniciarSesion: (sesionActiva) => set({ sesionActiva }),
        editarSesion: (fn) => set((s) => (s.sesionActiva ? { sesionActiva: fn(s.sesionActiva) } : {})),
        terminarSesion: () => {
          const s = get().sesionActiva;
          if (!s) return null;
          const limpia: Sesion = { ...s, fin: Date.now(), ejercicios: s.ejercicios.filter((e) => e.series.some((x) => x.hecha)).map((e) => ({ ...e, series: e.series.filter((x) => x.hecha) })) };
          if (!limpia.ejercicios.length) { set({ sesionActiva: null }); return null; }
          limpia.records = recordsDe(limpia, get().sesiones);
          set((st) => ({ sesionActiva: null, sesiones: [...st.sesiones, limpia].sort((a, b) => a.inicio - b.inicio) }));
          // Marca el hábito de entrenar si lo tiene
          const habitos = get().perfil?.habitos;
          if (!habitos?.length || habitos.some((h) => h.id === "entreno")) editarDia(limpia.fecha, (d) => ({ ...d, habitos: { ...d.habitos, entreno: true } }));
          return limpia;
        },
        descartarSesion: () => set({ sesionActiva: null }),
        borrarSesion: (id) => set((s) => ({ sesiones: s.sesiones.filter((x) => x.id !== id) })),
        corregirEjercicio: (de, a) => set((s) => {
          const corregidas = corregirHistorial(s.sesiones, de, a);
          // Los récords dependen de lo anterior: se recalculan en orden
          const sesiones = corregidas.map((x, i) => (x === s.sesiones[i] && !x.ejercicios.some((e) => e.ej === a) ? x : { ...x, records: recordsDe(x, corregidas.slice(0, i)) }));
          return { sesiones };
        }),
        setAgenda: (agenda) => set((s) => (s.perfil ? { perfil: { ...s.perfil, agenda } } : {})),
        setMetas: (metas) => set((s) => (s.perfil ? { perfil: { ...s.perfil, metas } } : {})),
        marcarHabito: (fecha, id) => editarDia(fecha, (d) => ({ ...d, habitos: { ...d.habitos, [id]: true } })),
        setRecordatorios: (recordatorios) => set((s) => (s.perfil ? { perfil: { ...s.perfil, recordatorios } } : {})),
        setPlan: (plan) => set((s) => (s.perfil ? { perfil: { ...s.perfil, plan } } : {})),
        ajustarEq: (fecha, g, delta) => editarDia(fecha, (d) => {
          const eq = { ...(d.extra?.eq ?? {}) };
          eq[g] = Math.round(((eq[g] ?? 0) + delta) * 2) / 2;
          if (!eq[g]) delete eq[g];
          return { ...d, extra: { ...d.extra, eq } };
        }),
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
        marcarConBrio: (fecha, conBrio) => editarDia(fecha, (d) => ({ ...d, extra: { ...d.extra, conBrio } })),
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
            const existe = s.despensa.find((x) => x.nombre.toLowerCase() === i.nombre.toLowerCase() && x.unidad === i.unidad) ?? s.despensa.find((x) => mismoProducto(x, i));
            if (existe) return { despensa: s.despensa.map((x) => (x === existe ? { ...x, cantidad: normalizarCantidad(x.cantidad + i.cantidad, x.unidad) } : x)) };
            return { despensa: [...s.despensa, { ...i, cantidad: normalizarCantidad(i.cantidad, i.unidad), id: uid() }] };
          }),
        cambiarCantidad: (id, delta) =>
          set((s) => ({ despensa: s.despensa.map((x) => (x.id === id ? { ...x, cantidad: normalizarCantidad(x.cantidad + delta, x.unidad) } : x)) })),
        removeItem: (id) => set((s) => ({ despensa: s.despensa.filter((x) => x.id !== id) })),
        setMinimo: (id, minimo) => set((s) => ({ despensa: s.despensa.map((x) => (x.id === id ? { ...x, minimo } : x)) })),
        descontar: (id, cantidad) =>
          set((s) => ({ despensa: s.despensa.map((x) => (x.id === id ? { ...x, cantidad: normalizarCantidad(x.cantidad - consumo(cantidad, x.unidad), x.unidad) } : x)) })),
        unificarDespensa: () =>
          set((s) => {
            const u = unificarDespensa(s.despensa);
            const igual = u.length === s.despensa.length && u.every((x, i) => JSON.stringify(x) === JSON.stringify(s.despensa[i]));
            return igual ? {} : { despensa: u };
          }),
        reset: () => set({ perfil: null, dias: {}, pesos: [], despensa: [], medidas: [], menu: null, sesiones: [], sesionActiva: null }),
      };
    },
    { name: "brio:datos-v3", version: 4, migrate: (e) => ({ medidas: [], menu: null, sesiones: [], sesionActiva: null, ...(e as object) }) as unknown as Estado },
  ),
);

export function pesoActual(pesos: Peso[], fallback: number) {
  return pesos.length ? pesos[pesos.length - 1].kg : fallback;
}

export function puntosDia(d: Dia | undefined, aguaMeta: number, habitos: Habito[]) {
  if (!d) return 0;
  return habitos.filter((h) => d.habitos[h.id]).length + (d.aguaMl >= aguaMeta ? 1 : 0);
}

/**
 * ¿El día cuenta para la racha? Hoy se calcula en vivo; los días pasados usan la marca que
 * quedó guardada ese día (o se calculan, si son de antes de que existiera la marca).
 */
export function diaConBrio(fecha: string, d: Dia | undefined, aguaMeta: number, habitos: Habito[]) {
  if (!d) return false;
  if (d.extra?.salvado) return true;
  if (fecha !== hoyISO() && d.extra?.conBrio !== undefined) return d.extra.conBrio;
  return puntosDia(d, aguaMeta, habitos) >= minBrio(habitos.length);
}

/** Días seguidos con brío. Si hoy aún no se completa, cuenta desde ayer. */
export function racha(dias: Record<string, Dia>, aguaMeta: number, habitos: Habito[]) {
  let fecha = hoyISO();
  if (!diaConBrio(fecha, dias[fecha], aguaMeta, habitos)) fecha = sumarDias(fecha, -1);
  let n = 0;
  while (diaConBrio(fecha, dias[fecha], aguaMeta, habitos)) {
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

/* ---------- Despensa: avisos y descuentos ---------- */
const MIN_POR_UNIDAD: Record<string, number> = { pzas: 3, latas: 1, rebanadas: 4, g: 200, kg: 0.25, L: 0.5, paquete: 1 };
export const minimoDe = (i: ItemDespensa) => i.minimo ?? MIN_POR_UNIDAD[i.unidad] ?? 1;

/** Productos que se están acabando (aún hay, pero poco). */
export const seAcaban = (d: ItemDespensa[]) => d.filter((i) => i.cantidad > 0 && i.cantidad <= minimoDe(i));

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Busca en la despensa el producto que corresponde a un alimento registrado y cuánto descontar. */
export function coincidenciaDespensa(d: ItemDespensa[], alimento: string, porcion: string, cantidad: number, gramos: number) {
  const palabras = norm(alimento).split(/[\s,()·]+/);
  const item = d.find((i) => {
    if (i.cantidad <= 0) return false;
    const w = norm(i.nombre).split(/\s+/)[0];
    return palabras.some((p) => p === w || p === `${w}s` || `${p}s` === w);
  });
  if (!item) return null;
  const pzs = ["pzas", "latas", "rebanadas", "paquete"].includes(item.unidad);
  const porcionContable = /pieza|lata|rebanada|clara|taco|filete|barra/.test(norm(porcion));
  let cuanto = 0;
  if (pzs && porcionContable) cuanto = cantidad;
  else if (item.unidad === "g") cuanto = gramos;
  else if (item.unidad === "kg") cuanto = gramos / 1000;
  if (!(cuanto > 0)) return null;
  return { item, cuanto: Math.round(cuanto * 100) / 100 };
}
