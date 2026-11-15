/** Alimentos para elegir gustos, por grupo y como se compran. */
export const GRUPOS_GUSTOS: { t: string; ids: string[] }[] = [
  { t: "Pollo, carnes y pescado", ids: ["pechuga-cocida", "muslo", "milanesa-pollo", "bistec", "molida-90", "carne-asar", "milanesa-res", "chuleta", "tilapia", "camaron", "jamon-pavo", "salchicha-pavo"] },
  { t: "Huevo y latas", ids: ["huevo", "atun-agua", "sardina"] },
  { t: "Lácteos", ids: ["leche-light", "yogur", "yogur-griego", "queso-panela", "queso-fresco", "queso-oaxaca", "queso-chihuahua", "requeson", "crema"] },
  { t: "Frijoles y leguminosas", ids: ["frijol-negro", "frijol-bayo", "refritos", "frijol-lata", "lentejas", "garbanzos"] },
  { t: "Tortillas, pan y cereales", ids: ["tortilla-maiz", "tortilla-harina", "tostada-horneada", "pan-integral", "bolillo", "arroz-blanco", "pasta", "avena", "granola", "amaranto", "papa", "camote", "elote"] },
  { t: "Verduras", ids: ["jitomate", "tomate-verde", "cebolla", "nopales", "calabacita", "chayote", "zanahoria", "brocoli", "coliflor", "ejotes", "espinaca", "champinones", "lechuga", "pepino", "pimiento", "poblano", "col", "betabel", "jicama", "aguacate"] },
  { t: "Frutas", ids: ["platano", "manzana", "naranja", "mandarina", "toronja", "papaya", "mango", "sandia", "melon", "pina", "fresas", "uvas", "guayaba", "pera", "durazno", "kiwi", "tuna", "ciruela", "zarzamora", "mamey"] },
  { t: "Semillas y otros", ids: ["crema-cacahuate", "cacahuates", "nueces", "almendras", "chia", "miel", "palomitas"] },
];

/** Alimentos que cuentan como el mismo gusto (atún en agua o en aceite son "atún en lata"). */
export const MISMO_GUSTO: Record<string, string[]> = {
  "atun-agua": ["atun-aceite"],
  "pechuga-cocida": ["pechuga-cruda"],
  "molida-90": ["molida-80"],
  "leche-light": ["leche-entera", "leche-polvo"],
  "arroz-blanco": ["arroz-rojo"],
  "papa": ["papa-airfryer"],
  "huevo": ["clara"],
};
/** Expande una lista de gustos con sus equivalentes. */
export const expandirGustos = (ids: string[]) => ids.flatMap((id) => [id, ...(MISMO_GUSTO[id] ?? [])]);

