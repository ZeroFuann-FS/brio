/**
 * Sistema Mexicano de Alimentos Equivalentes (SMAE), simplificado.
 * Valores promedio por equivalente y gramos de cada alimento que equivalen a 1.
 */
export type GrupoEq =
  | "verduras" | "frutas" | "cereal-sg" | "cereal-cg" | "leguminosas"
  | "aoa-mb" | "aoa-b" | "aoa-m" | "aoa-a"
  | "leche-d" | "leche-s" | "leche-e"
  | "grasa-sp" | "grasa-cp" | "azucar";

export interface InfoGrupo { id: GrupoEq; t: string; corto: string; kcal: number; p: number; c: number; g: number; ejemplo: string }

export const GRUPOS_EQ: InfoGrupo[] = [
  { id: "verduras", t: "Verduras", corto: "Verdura", kcal: 25, p: 2, c: 4, g: 0, ejemplo: "1 taza de nopales, ½ taza de brócoli, 1 jitomate" },
  { id: "frutas", t: "Frutas", corto: "Fruta", kcal: 60, p: 0, c: 15, g: 0, ejemplo: "½ plátano, 1 manzana chica, 1 taza de papaya" },
  { id: "cereal-sg", t: "Cereales sin grasa", corto: "Cereal", kcal: 70, p: 2, c: 15, g: 0, ejemplo: "1 tortilla, 1 rebanada de pan, ⅓ taza de avena" },
  { id: "cereal-cg", t: "Cereales con grasa", corto: "Cereal c/g", kcal: 115, p: 2, c: 15, g: 5, ejemplo: "1 tortilla de harina, ¼ taza de granola" },
  { id: "leguminosas", t: "Leguminosas", corto: "Leguminosa", kcal: 120, p: 8, c: 20, g: 1, ejemplo: "½ taza de frijoles, lentejas o garbanzos" },
  { id: "aoa-mb", t: "Origen animal muy bajo en grasa", corto: "AOA muy bajo", kcal: 40, p: 7, c: 0, g: 1, ejemplo: "30 g de pechuga, ⅓ lata de atún en agua, 2 claras" },
  { id: "aoa-b", t: "Origen animal bajo en grasa", corto: "AOA bajo", kcal: 55, p: 7, c: 0, g: 3, ejemplo: "30 g de bistec, 40 g de panela, 2 rebanadas de jamón de pavo" },
  { id: "aoa-m", t: "Origen animal moderado en grasa", corto: "AOA moderado", kcal: 75, p: 7, c: 0, g: 5, ejemplo: "1 huevo, 30 g de carne molida, 40 g de queso fresco" },
  { id: "aoa-a", t: "Origen animal alto en grasa", corto: "AOA alto", kcal: 100, p: 7, c: 0, g: 8, ejemplo: "30 g de queso manchego, 1 salchicha, carnitas" },
  { id: "leche-d", t: "Leche descremada", corto: "Leche desc.", kcal: 95, p: 9, c: 12, g: 2, ejemplo: "1 taza de leche descremada, ¾ taza de yogur griego" },
  { id: "leche-s", t: "Leche semidescremada", corto: "Leche semi", kcal: 110, p: 9, c: 12, g: 4, ejemplo: "1 taza de leche semidescremada" },
  { id: "leche-e", t: "Leche entera", corto: "Leche entera", kcal: 150, p: 9, c: 12, g: 8, ejemplo: "1 taza de leche entera, ¾ taza de yogur natural" },
  { id: "grasa-sp", t: "Grasas sin proteína", corto: "Grasa", kcal: 45, p: 0, c: 0, g: 5, ejemplo: "1 cucharadita de aceite, ⅓ de aguacate, 1 cucharada de crema" },
  { id: "grasa-cp", t: "Grasas con proteína", corto: "Grasa c/p", kcal: 70, p: 3, c: 3, g: 5, ejemplo: "14 cacahuates, 10 almendras, 2 cucharaditas de crema de cacahuate" },
  { id: "azucar", t: "Azúcares", corto: "Azúcar", kcal: 40, p: 0, c: 10, g: 0, ejemplo: "2 cucharaditas de azúcar o miel" },
];
export const GRUPO_POR_ID = new Map(GRUPOS_EQ.map((g) => [g.id, g]));

/** id de alimento → [grupo, gramos que equivalen a 1]. */
export const EQUIV: Record<string, [GrupoEq, number]> = {
  huevo: ["aoa-m", 50], clara: ["aoa-mb", 66],
  "leche-entera": ["leche-e", 240], "leche-light": ["leche-d", 240], "leche-polvo": ["leche-d", 24],
  "leche-lala": ["leche-e", 240], "leche-nutrileche": ["leche-e", 240], "leche-vaca-blanca": ["leche-e", 240], "leche-lactilac": ["leche-e", 240],
  "leche-lala-light": ["leche-s", 240], "leche-nutrileche-light": ["leche-s", 240], "leche-vaca-blanca-light": ["leche-s", 240], "leche-lactilac-light": ["leche-s", 240],
  "leche-lala-proteina": ["leche-s", 240], "queso-amarillo": ["aoa-a", 30], "jamon-cerdo": ["aoa-m", 40],
  yogur: ["leche-e", 180], "yogur-griego": ["leche-d", 150],
  "queso-panela": ["aoa-b", 40], "queso-fresco": ["aoa-m", 40], "queso-oaxaca": ["aoa-m", 30], "queso-chihuahua": ["aoa-a", 30],
  requeson: ["aoa-b", 60], crema: ["grasa-sp", 15],
  "pechuga-cocida": ["aoa-mb", 30], "pechuga-cruda": ["aoa-mb", 40], "milanesa-pollo": ["aoa-mb", 30], muslo: ["aoa-b", 30],
  bistec: ["aoa-b", 30], "carne-asar": ["aoa-b", 30], "milanesa-res": ["aoa-b", 30], "lomo-cerdo": ["aoa-b", 30],
  "molida-90": ["aoa-m", 30], "molida-80": ["aoa-a", 30], chuleta: ["aoa-m", 30],
  "jamon-pavo": ["aoa-b", 40], "salchicha-pavo": ["aoa-a", 40], chorizo: ["aoa-a", 20],
  "atun-agua": ["aoa-mb", 30], "atun-aceite": ["aoa-b", 30], sardina: ["aoa-m", 40], tilapia: ["aoa-mb", 35], camaron: ["aoa-mb", 35],
  carnitas: ["aoa-a", 30], pastor: ["aoa-a", 35],
  "frijol-negro": ["leguminosas", 86], "frijol-bayo": ["leguminosas", 86], "frijol-lata": ["leguminosas", 100], refritos: ["leguminosas", 90],
  lentejas: ["leguminosas", 90], garbanzos: ["leguminosas", 80],
  "tortilla-maiz": ["cereal-sg", 30], "tortilla-harina": ["cereal-cg", 35], "tostada-horneada": ["cereal-sg", 18], "tostada-frita": ["cereal-cg", 20],
  "pan-integral": ["cereal-sg", 28], "pan-blanco": ["cereal-sg", 25], bolillo: ["cereal-sg", 25], "pan-dulce": ["cereal-cg", 25],
  "arroz-blanco": ["cereal-sg", 55], "arroz-rojo": ["cereal-cg", 75], avena: ["cereal-sg", 18], pasta: ["cereal-sg", 45],
  papa: ["cereal-sg", 80], "papa-airfryer": ["cereal-sg", 65], camote: ["cereal-sg", 75], granola: ["cereal-cg", 25],
  cereal: ["cereal-sg", 20], marias: ["cereal-sg", 18], elote: ["cereal-sg", 70], palomitas: ["cereal-sg", 18], amaranto: ["cereal-sg", 18],
  platano: ["frutas", 60], manzana: ["frutas", 115], naranja: ["frutas", 128], mandarina: ["frutas", 115], toronja: ["frutas", 140],
  papaya: ["frutas", 140], mango: ["frutas", 100], sandia: ["frutas", 200], melon: ["frutas", 175], pina: ["frutas", 120],
  fresas: ["frutas", 190], uvas: ["frutas", 85], guayaba: ["frutas", 90], pera: ["frutas", 105], durazno: ["frutas", 150],
  kiwi: ["frutas", 100], tuna: ["frutas", 145], ciruela: ["frutas", 130], zarzamora: ["frutas", 140], mamey: ["frutas", 50],
  "jugo-naranja": ["frutas", 130],
  jitomate: ["verduras", 140], cebolla: ["verduras", 60], lechuga: ["verduras", 150], pepino: ["verduras", 160], zanahoria: ["verduras", 60],
  calabacita: ["verduras", 160], brocoli: ["verduras", 70], nopales: ["verduras", 160], espinaca: ["verduras", 100], champinones: ["verduras", 110],
  ejotes: ["verduras", 70], chayote: ["verduras", 130], coliflor: ["verduras", 100], pimiento: ["verduras", 95], poblano: ["verduras", 120],
  "tomate-verde": ["verduras", 80], jicama: ["verduras", 65], col: ["verduras", 100], betabel: ["verduras", 58], "pico-gallo": ["verduras", 125],
  "salsa-verde": ["verduras", 75], "salsa-roja": ["verduras", 75],
  aceite: ["grasa-sp", 5], mantequilla: ["grasa-sp", 6], mayonesa: ["grasa-sp", 7], aguacate: ["grasa-sp", 30], nueces: ["grasa-sp", 8],
  "crema-cacahuate": ["grasa-cp", 10], cacahuates: ["grasa-cp", 14], almendras: ["grasa-cp", 10], chia: ["grasa-cp", 12],
  azucar: ["azucar", 10], miel: ["azucar", 12], refresco: ["azucar", 100], "agua-jamaica": ["azucar", 100],
};

export type Equivalentes = Partial<Record<GrupoEq, number>>;

/** Equivalentes de una lista de [alimentoId, gramos]; redondeados a medio equivalente. */
export function equivalentesDe(items: [string, number][]): Equivalentes {
  const t: Equivalentes = {};
  for (const [id, g] of items) {
    const e = EQUIV[id];
    if (!e || !g) continue;
    t[e[0]] = (t[e[0]] ?? 0) + g / e[1];
  }
  for (const k of Object.keys(t) as GrupoEq[]) {
    const v = Math.round((t[k] ?? 0) * 2) / 2;
    if (v > 0) t[k] = v; else delete t[k];
  }
  return t;
}

export function sumarEq(a: Equivalentes, b: Equivalentes | undefined): Equivalentes {
  const t = { ...a };
  if (b) for (const [k, v] of Object.entries(b) as [GrupoEq, number][]) t[k] = Math.round(((t[k] ?? 0) + v) * 2) / 2;
  return t;
}

/** kcal y macros que da una distribución de equivalentes. */
export function totalesEq(e: Equivalentes) {
  let kcal = 0, p = 0, c = 0, g = 0;
  for (const [k, n] of Object.entries(e) as [GrupoEq, number][]) {
    const gr = GRUPO_POR_ID.get(k);
    if (!gr) continue;
    kcal += gr.kcal * n; p += gr.p * n; c += gr.c * n; g += gr.g * n;
  }
  return { kcal: Math.round(kcal), proteina: Math.round(p), carbos: Math.round(c), grasa: Math.round(g) };
}
