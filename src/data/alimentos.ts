/**
 * Base de alimentos genéricos (valores por 100 g).
 * Fuente de referencia: USDA FoodData Central (dominio público), adaptado a porciones mexicanas.
 * Los platillos preparados son estimaciones promedio de recetas caseras.
 */
export interface Porcion { t: string; g: number }
export interface Alimento {
  id: string;
  n: string;          // nombre
  cat: string;        // categoría
  kcal: number; p: number; c: number; g: number; // por 100 g
  por: Porcion[];     // porciones comunes
  alias?: string;     // palabras extra para la búsqueda
  img?: string;       // foto del producto (marcas)
  codigo?: string;    // código de barras
  fuente?: "base" | "marca" | "comunidad";
}

const A = (id: string, n: string, cat: string, kcal: number, p: number, c: number, g: number, por: Porcion[], alias?: string): Alimento =>
  ({ id, n, cat, kcal, p, c, g, por, alias });

export const ALIMENTOS: Alimento[] = [
  // Huevo y lácteos
  A("huevo", "Huevo entero", "Huevo y lácteos", 143, 12.6, 0.7, 9.5, [{ t: "pieza", g: 50 }], "blanquillo"),
  A("clara", "Clara de huevo", "Huevo y lácteos", 52, 10.9, 0.7, 0.2, [{ t: "clara", g: 33 }]),
  A("leche-entera", "Leche entera", "Huevo y lácteos", 61, 3.2, 4.8, 3.3, [{ t: "taza", g: 244 }, { t: "vaso", g: 250 }]),
  A("leche-light", "Leche descremada o light", "Huevo y lácteos", 34, 3.4, 5, 0.1, [{ t: "taza", g: 245 }], "light deslactosada"),
  A("leche-polvo", "Leche descremada en polvo", "Huevo y lácteos", 362, 36, 52, 0.8, [{ t: "cucharada", g: 7 }]),
  A("yogur", "Yogur natural", "Huevo y lácteos", 61, 3.5, 4.7, 3.3, [{ t: "taza", g: 245 }, { t: "vasito", g: 125 }]),
  A("yogur-griego", "Yogur griego natural", "Huevo y lácteos", 59, 10.2, 3.6, 0.4, [{ t: "taza", g: 200 }, { t: "vasito", g: 150 }]),
  A("queso-panela", "Queso panela", "Huevo y lácteos", 240, 18, 3, 18, [{ t: "rebanada", g: 30 }]),
  A("queso-fresco", "Queso fresco", "Huevo y lácteos", 299, 18, 3, 24, [{ t: "rebanada", g: 30 }]),
  A("queso-oaxaca", "Queso Oaxaca", "Huevo y lácteos", 300, 22, 2, 23, [{ t: "porción", g: 30 }], "quesillo"),
  A("queso-chihuahua", "Queso manchego / Chihuahua", "Huevo y lácteos", 374, 21.6, 5.6, 29.7, [{ t: "rebanada", g: 30 }]),
  A("crema", "Crema", "Huevo y lácteos", 250, 2.4, 3.5, 25, [{ t: "cucharada", g: 15 }]),
  A("requeson", "Requesón", "Huevo y lácteos", 98, 11, 3.4, 4.3, [{ t: "2 cucharadas", g: 40 }]),

  // Carnes, pollo y pescado
  A("pechuga-cocida", "Pechuga de pollo", "Carnes y pescado", 165, 31, 0, 3.6, [{ t: "porción", g: 125 }, { t: "½ pechuga", g: 190 }, { t: "pechuga entera", g: 380 }], "pollo asado air fryer polleria"),
  A("pollo-rostizado", "Pollo rostizado o asado (con piel)", "Carnes y pescado", 239, 27.3, 0, 13.6, [{ t: "¼ de pollo", g: 200 }, { t: "½ pollo", g: 400 }, { t: "pierna con muslo", g: 150 }], "polleria rosticeria pollo asado al carbon"),
  A("pechuga-cruda", "Pechuga de pollo cruda", "Carnes y pescado", 120, 22.5, 0, 2.6, [{ t: "porción", g: 150 }], "pollo"),
  A("muslo", "Pierna y muslo de pollo", "Carnes y pescado", 179, 24.8, 0, 8.2, [{ t: "pieza", g: 90 }], "pierna pollo"),
  A("bistec", "Bistec de res", "Carnes y pescado", 190, 29, 0, 8, [{ t: "porción", g: 100 }], "carne asada res"),
  A("molida-80", "Carne molida de res (con más grasa)", "Carnes y pescado", 254, 26, 0, 17, [{ t: "porción", g: 100 }]),
  A("molida-90", "Carne molida de res", "Carnes y pescado", 230, 26, 0, 14, [{ t: "porción", g: 100 }]),
  A("lomo-cerdo", "Lomo de cerdo cocido", "Carnes y pescado", 200, 27, 0, 9, [{ t: "porción", g: 100 }]),
  A("chuleta", "Chuleta de cerdo", "Carnes y pescado", 231, 26, 0, 13, [{ t: "pieza", g: 120 }]),
  A("carne-asar", "Carne para asar (diezmillo o aguayón)", "Carnes y pescado", 220, 28, 0, 12, [{ t: "porción", g: 120 }], "arrachera asada"),
  A("milanesa-res", "Milanesa de res (sin empanizar)", "Carnes y pescado", 200, 30, 0, 8, [{ t: "pieza", g: 110 }]),
  A("milanesa-pollo", "Milanesa de pollo (sin empanizar)", "Carnes y pescado", 165, 31, 0, 3.6, [{ t: "pieza", g: 120 }], "pechuga aplanada"),
  A("jamon-pavo", "Jamón de pavo", "Carnes y pescado", 110, 17, 2, 3.5, [{ t: "rebanada", g: 20 }]),
  A("salchicha-pavo", "Salchicha de pavo", "Carnes y pescado", 220, 12, 4, 17, [{ t: "pieza", g: 45 }]),
  A("chorizo", "Chorizo", "Carnes y pescado", 455, 24, 2, 38, [{ t: "porción", g: 40 }]),
  A("atun-agua", "Atún en lata (en agua)", "Carnes y pescado", 116, 25.5, 0, 0.8, [{ t: "lata", g: 100 }], "lata mar alta dolores"),
  A("atun-aceite", "Atún en lata (en aceite)", "Carnes y pescado", 198, 29, 0, 8.2, [{ t: "lata", g: 100 }]),
  A("sardina", "Sardinas en lata (en tomate)", "Carnes y pescado", 186, 16.4, 0.7, 12.5, [{ t: "porción", g: 100 }]),
  A("tilapia", "Filete de pescado (tilapia o basa)", "Carnes y pescado", 128, 26, 0, 2.7, [{ t: "filete", g: 120 }], "mojarra"),
  A("camaron", "Camarón cocido", "Carnes y pescado", 99, 24, 0.2, 0.3, [{ t: "porción", g: 100 }]),
  A("carnitas", "Carnitas", "Carnes y pescado", 320, 27, 0, 23, [{ t: "porción", g: 100 }]),
  A("pastor", "Carne al pastor", "Carnes y pescado", 250, 22, 4, 16, [{ t: "porción", g: 100 }]),

  // Leguminosas
  A("frijol-negro", "Frijol negro de olla (lo cueces tú)", "Leguminosas", 132, 8.9, 23.7, 0.5, [{ t: "½ taza", g: 86 }, { t: "taza", g: 172 }], "frijoles de la olla"),
  A("frijol-bayo", "Frijol bayo o pinto de olla", "Leguminosas", 143, 9, 26, 0.7, [{ t: "½ taza", g: 86 }]),
  A("refritos", "Frijoles refritos de bolsa", "Leguminosas", 120, 5.5, 15, 4, [{ t: "½ taza", g: 120 }, { t: "cucharada", g: 30 }]),
  A("frijol-lata", "Frijoles enteros en lata", "Leguminosas", 91, 6, 16, 0.4, [{ t: "½ taza", g: 120 }, { t: "lata", g: 400 }], "negros bayos"),
  A("lentejas", "Lentejas", "Leguminosas", 116, 9, 20, 0.4, [{ t: "½ taza", g: 99 }]),
  A("garbanzos", "Garbanzos", "Leguminosas", 164, 8.9, 27.4, 2.6, [{ t: "½ taza", g: 82 }]),

  // Tortillas, panes y cereales
  A("tortilla-maiz", "Tortilla de maíz (tortillería)", "Tortillas y cereales", 218, 5.7, 44.6, 2.9, [{ t: "pieza", g: 30 }]),
  A("tortilla-harina", "Tortilla de harina", "Tortillas y cereales", 304, 8.2, 49.4, 8, [{ t: "pieza", g: 45 }]),
  A("tostada-horneada", "Tostadas horneadas (paquete)", "Tortillas y cereales", 400, 9, 74, 7, [{ t: "pieza", g: 12 }], "trita sanissimo"),
  A("tostada-frita", "Tostada frita", "Tortillas y cereales", 480, 7, 62, 23, [{ t: "pieza", g: 14 }]),
  A("pan-integral", "Pan integral de caja", "Tortillas y cereales", 247, 13, 41, 3.4, [{ t: "rebanada", g: 28 }], "bimbo"),
  A("pan-blanco", "Pan blanco de caja", "Tortillas y cereales", 266, 8.9, 49, 3.3, [{ t: "rebanada", g: 25 }]),
  A("bolillo", "Bolillo / telera", "Tortillas y cereales", 270, 9, 53, 2.5, [{ t: "pieza", g: 70 }]),
  A("pan-dulce", "Pan dulce (concha)", "Tortillas y cereales", 380, 7, 55, 14, [{ t: "pieza", g: 80 }]),
  A("arroz-blanco", "Arroz blanco cocido", "Tortillas y cereales", 130, 2.7, 28, 0.3, [{ t: "taza", g: 158 }, { t: "½ taza", g: 79 }]),
  A("arroz-rojo", "Arroz rojo (a la mexicana)", "Tortillas y cereales", 150, 2.8, 27, 3.5, [{ t: "taza", g: 160 }, { t: "½ taza", g: 80 }]),
  A("avena", "Avena en hojuelas (cruda)", "Tortillas y cereales", 389, 16.9, 66, 6.9, [{ t: "½ taza", g: 40 }]),
  A("pasta", "Pasta cocida", "Tortillas y cereales", 158, 5.8, 31, 0.9, [{ t: "taza", g: 140 }], "espagueti"),
  A("sopa-fideo", "Sopa de fideo", "Tortillas y cereales", 60, 1.5, 9, 2, [{ t: "plato", g: 250 }]),
  A("papa", "Papa cocida", "Tortillas y cereales", 87, 1.9, 20, 0.1, [{ t: "pieza mediana", g: 150 }]),
  A("papa-airfryer", "Papa en air fryer", "Tortillas y cereales", 110, 2.5, 21, 2, [{ t: "pieza mediana", g: 150 }]),
  A("papas-fritas", "Papas fritas", "Tortillas y cereales", 312, 3.4, 41, 15, [{ t: "porción", g: 100 }]),
  A("camote", "Camote cocido", "Tortillas y cereales", 90, 2, 21, 0.2, [{ t: "pieza", g: 130 }]),
  A("granola", "Granola", "Tortillas y cereales", 471, 10, 64, 20, [{ t: "¼ taza", g: 30 }]),
  A("cereal", "Cereal de hojuelas de maíz", "Tortillas y cereales", 357, 7.5, 84, 0.4, [{ t: "taza", g: 30 }], "corn flakes"),
  A("marias", "Galletas Marías", "Tortillas y cereales", 435, 7, 74, 12, [{ t: "pieza", g: 6 }]),
  A("elote", "Elote cocido", "Tortillas y cereales", 96, 3.4, 21, 1.5, [{ t: "pieza", g: 100 }, { t: "vaso de esquite", g: 150 }], "maíz esquite"),
  A("palomitas", "Palomitas naturales", "Tortillas y cereales", 387, 13, 78, 4.5, [{ t: "taza", g: 8 }]),

  // Frutas
  A("platano", "Plátano", "Frutas", 89, 1.1, 22.8, 0.3, [{ t: "pieza", g: 118 }], "banana"),
  A("manzana", "Manzana", "Frutas", 52, 0.3, 13.8, 0.2, [{ t: "pieza", g: 180 }]),
  A("naranja", "Naranja", "Frutas", 47, 0.9, 11.8, 0.1, [{ t: "pieza", g: 130 }]),
  A("papaya", "Papaya", "Frutas", 43, 0.5, 10.8, 0.3, [{ t: "taza", g: 145 }]),
  A("mango", "Mango", "Frutas", 60, 0.8, 15, 0.4, [{ t: "pieza", g: 200 }]),
  A("sandia", "Sandía", "Frutas", 30, 0.6, 7.6, 0.2, [{ t: "taza", g: 152 }]),
  A("pina", "Piña", "Frutas", 50, 0.5, 13, 0.1, [{ t: "taza", g: 165 }]),
  A("fresas", "Fresas", "Frutas", 32, 0.7, 7.7, 0.3, [{ t: "taza", g: 150 }]),
  A("uvas", "Uvas", "Frutas", 69, 0.7, 18, 0.2, [{ t: "taza", g: 150 }]),
  A("guayaba", "Guayaba", "Frutas", 68, 2.6, 14.3, 1, [{ t: "pieza", g: 55 }]),
  A("melon", "Melón", "Frutas", 34, 0.8, 8.2, 0.2, [{ t: "taza", g: 160 }]),
  A("mandarina", "Mandarina", "Frutas", 53, 0.8, 13.3, 0.3, [{ t: "pieza", g: 88 }]),
  A("toronja", "Toronja", "Frutas", 42, 0.8, 10.7, 0.1, [{ t: "½ pieza", g: 120 }]),
  A("pera", "Pera", "Frutas", 57, 0.4, 15.2, 0.1, [{ t: "pieza", g: 180 }]),
  A("durazno", "Durazno", "Frutas", 39, 0.9, 9.5, 0.3, [{ t: "pieza", g: 150 }]),
  A("kiwi", "Kiwi", "Frutas", 61, 1.1, 14.7, 0.5, [{ t: "pieza", g: 75 }]),
  A("tuna", "Tuna", "Frutas", 41, 0.7, 9.6, 0.5, [{ t: "pieza", g: 100 }], "nopal fruta"),
  A("ciruela", "Ciruela", "Frutas", 46, 0.7, 11.4, 0.3, [{ t: "pieza", g: 66 }]),
  A("zarzamora", "Zarzamora", "Frutas", 43, 1.4, 9.6, 0.5, [{ t: "taza", g: 144 }], "moras"),
  A("mamey", "Mamey", "Frutas", 124, 1.5, 32, 0.5, [{ t: "½ pieza", g: 170 }]),
  A("aguacate", "Aguacate", "Frutas", 160, 2, 8.5, 14.7, [{ t: "¼ pieza", g: 50 }, { t: "pieza", g: 200 }]),
  A("limon", "Limón", "Frutas", 29, 1.1, 9.3, 0.3, [{ t: "pieza", g: 60 }]),

  // Verduras
  A("jitomate", "Jitomate", "Verduras", 18, 0.9, 3.9, 0.2, [{ t: "pieza", g: 120 }], "tomate rojo"),
  A("cebolla", "Cebolla", "Verduras", 40, 1.1, 9.3, 0.1, [{ t: "¼ pieza", g: 30 }]),
  A("serrano", "Chile serrano", "Verduras", 32, 1.7, 6.7, 0.4, [{ t: "pieza", g: 6 }]),
  A("jalapeno", "Chile jalapeño", "Verduras", 29, 0.9, 6.5, 0.4, [{ t: "pieza", g: 14 }]),
  A("lechuga", "Lechuga", "Verduras", 15, 1.4, 2.9, 0.2, [{ t: "taza", g: 47 }]),
  A("pepino", "Pepino", "Verduras", 15, 0.7, 3.6, 0.1, [{ t: "taza", g: 104 }]),
  A("zanahoria", "Zanahoria", "Verduras", 41, 0.9, 9.6, 0.2, [{ t: "pieza", g: 60 }]),
  A("calabacita", "Calabacita", "Verduras", 15, 1.1, 2.7, 0.4, [{ t: "taza", g: 180 }]),
  A("brocoli", "Brócoli", "Verduras", 35, 2.4, 7.2, 0.4, [{ t: "taza", g: 156 }]),
  A("nopales", "Nopales", "Verduras", 15, 1.3, 3.3, 0.1, [{ t: "taza", g: 149 }]),
  A("espinaca", "Espinaca", "Verduras", 23, 2.9, 3.6, 0.4, [{ t: "taza", g: 30 }]),
  A("champinones", "Champiñones", "Verduras", 22, 3.1, 3.3, 0.3, [{ t: "taza", g: 70 }]),
  A("ejotes", "Ejotes", "Verduras", 35, 1.9, 7.9, 0.3, [{ t: "taza", g: 125 }]),
  A("chayote", "Chayote", "Verduras", 19, 0.8, 4.5, 0.1, [{ t: "taza", g: 130 }]),
  A("coliflor", "Coliflor", "Verduras", 25, 1.9, 5, 0.3, [{ t: "taza", g: 110 }]),
  A("pimiento", "Pimiento morrón", "Verduras", 26, 1, 6, 0.3, [{ t: "pieza", g: 120 }]),
  A("poblano", "Chile poblano", "Verduras", 20, 0.9, 4.6, 0.2, [{ t: "pieza", g: 100 }], "rajas"),
  A("tomate-verde", "Tomate verde", "Verduras", 32, 1, 5.8, 1, [{ t: "pieza", g: 35 }], "tomatillo"),
  A("jicama", "Jícama", "Verduras", 38, 0.7, 8.8, 0.1, [{ t: "taza", g: 130 }]),
  A("col", "Col / repollo", "Verduras", 25, 1.3, 5.8, 0.1, [{ t: "taza", g: 70 }]),
  A("betabel", "Betabel", "Verduras", 43, 1.6, 9.6, 0.2, [{ t: "pieza", g: 80 }]),
  A("pico-gallo", "Pico de gallo", "Verduras", 20, 0.8, 4.4, 0.2, [{ t: "½ taza", g: 80 }]),
  A("salsa-verde", "Salsa verde", "Verduras", 33, 1, 6, 0.6, [{ t: "2 cucharadas", g: 30 }]),
  A("salsa-roja", "Salsa roja", "Verduras", 30, 1.3, 6, 0.3, [{ t: "2 cucharadas", g: 30 }]),

  // Grasas, semillas y otros
  A("aceite", "Aceite vegetal", "Grasas y otros", 884, 0, 0, 100, [{ t: "cucharadita", g: 4.5 }, { t: "cucharada", g: 13.5 }]),
  A("mantequilla", "Mantequilla", "Grasas y otros", 717, 0.9, 0.1, 81, [{ t: "cucharadita", g: 5 }]),
  A("mayonesa", "Mayonesa", "Grasas y otros", 680, 1, 0.6, 75, [{ t: "cucharada", g: 14 }]),
  A("crema-cacahuate", "Crema de cacahuate", "Grasas y otros", 588, 25, 20, 50, [{ t: "cucharada", g: 16 }]),
  A("cacahuates", "Cacahuates", "Grasas y otros", 567, 25.8, 16, 49, [{ t: "puño", g: 30 }]),
  A("almendras", "Almendras", "Grasas y otros", 579, 21, 22, 50, [{ t: "puño", g: 28 }]),
  A("nueces", "Nueces", "Grasas y otros", 654, 15, 14, 65, [{ t: "puño", g: 28 }]),
  A("amaranto", "Amaranto natural", "Grasas y otros", 374, 14, 65, 7, [{ t: "¼ taza", g: 15 }], "alegría"),
  A("chia", "Chía", "Grasas y otros", 486, 17, 42, 31, [{ t: "cucharada", g: 12 }]),
  A("azucar", "Azúcar", "Grasas y otros", 387, 0, 100, 0, [{ t: "cucharadita", g: 4 }]),
  A("miel", "Miel", "Grasas y otros", 304, 0.3, 82, 0, [{ t: "cucharada", g: 21 }]),
  A("chocolate", "Chocolate con leche", "Grasas y otros", 535, 7.6, 59, 30, [{ t: "barra", g: 43 }], "hershey"),

  // Bebidas
  A("cafe", "Café negro", "Bebidas", 1, 0.1, 0, 0, [{ t: "taza", g: 240 }]),
  A("refresco", "Refresco de cola", "Bebidas", 42, 0, 10.6, 0, [{ t: "lata", g: 355 }, { t: "botella 600 ml", g: 600 }], "coca"),
  A("jugo-naranja", "Jugo de naranja", "Bebidas", 45, 0.7, 10.4, 0.2, [{ t: "vaso", g: 250 }]),
  A("cerveza", "Cerveza", "Bebidas", 43, 0.5, 3.6, 0, [{ t: "lata o botella", g: 355 }, { t: "media (vidrio)", g: 325 }, { t: "caguama", g: 940 }], "corona modelo victoria tecate indio alcohol chela"),
  A("cerveza-light", "Cerveza light", "Bebidas", 29, 0.2, 1.6, 0, [{ t: "lata o botella", g: 355 }], "ultra light alcohol chela"),
  A("michelada", "Michelada (cerveza con clamato)", "Bebidas", 45, 0.6, 5, 0.1, [{ t: "vaso", g: 500 }, { t: "litro", g: 1000 }], "chelada alcohol"),
  A("tequila", "Tequila, mezcal, ron, whisky o vodka", "Bebidas", 231, 0, 0, 0, [{ t: "caballito o shot", g: 42 }, { t: "trago doble", g: 84 }], "alcohol destilado mezcal ron whisky vodka brandy"),
  A("cuba", "Bebida preparada (cuba, paloma, tequila con refresco)", "Bebidas", 75, 0, 9, 0, [{ t: "vaso", g: 300 }], "cuba libre paloma charro negro alcohol"),
  A("vino", "Vino tinto o blanco", "Bebidas", 85, 0.1, 2.6, 0, [{ t: "copa", g: 150 }], "alcohol"),
  A("agua-jamaica", "Agua de jamaica con azúcar", "Bebidas", 40, 0, 10, 0, [{ t: "vaso", g: 250 }], "agua fresca"),
  A("chocomilk", "Leche con chocolate en polvo", "Bebidas", 85, 3.2, 12, 3, [{ t: "vaso", g: 250 }], "chocomilk"),

  // Platillos mexicanos (estimados)
  A("taco-bistec", "Taco de bistec", "Platillos", 200, 13, 17, 9, [{ t: "taco", g: 90 }], "tacos"),
  A("taco-pastor", "Taco al pastor", "Platillos", 200, 11, 18, 9, [{ t: "taco", g: 85 }], "tacos"),
  A("taco-carnitas", "Taco de carnitas", "Platillos", 233, 12, 17, 13, [{ t: "taco", g: 90 }], "tacos"),
  A("quesadilla", "Quesadilla de queso", "Platillos", 280, 12, 22, 16, [{ t: "pieza", g: 75 }]),
  A("enchilada-verde", "Enchilada verde de pollo", "Platillos", 170, 10, 14, 8, [{ t: "pieza", g: 110 }], "enchiladas"),
  A("enfrijolada", "Enfrijolada", "Platillos", 165, 7, 20, 6, [{ t: "pieza", g: 110 }]),
  A("chilaquiles", "Chilaquiles verdes", "Platillos", 180, 5, 20, 9, [{ t: "plato", g: 250 }]),
  A("huevos-mexicana", "Huevos a la mexicana", "Platillos", 140, 9, 3, 10, [{ t: "porción (2 huevos)", g: 150 }]),
  A("albondigas-caldillo", "Albóndigas en caldillo", "Platillos", 120, 8, 6, 7, [{ t: "plato (4 albóndigas)", g: 320 }, { t: "albóndiga con caldillo", g: 80 }], "albondiga"),
  A("albondigas", "Albóndigas de res (sin caldillo)", "Platillos", 200, 14, 6, 13, [{ t: "albóndiga", g: 40 }], "albondiga"),
  A("picadillo", "Picadillo de res con verduras", "Platillos", 150, 12, 6, 9, [{ t: "taza", g: 200 }]),
  A("tinga", "Tinga de pollo", "Platillos", 140, 14, 5, 7, [{ t: "taza", g: 180 }, { t: "tostada de tinga", g: 90 }], "tostada"),
  A("milanesa-empanizada", "Milanesa empanizada (pollo o res)", "Platillos", 250, 20, 13, 13, [{ t: "pieza", g: 150 }]),
  A("bistec-mexicana", "Bistec a la mexicana", "Platillos", 150, 17, 4, 7, [{ t: "porción", g: 200 }]),
  A("pollo-mole", "Pollo en mole", "Platillos", 180, 14, 8, 10, [{ t: "pieza con mole", g: 250 }]),
  A("chile-relleno", "Chile relleno capeado", "Platillos", 190, 8, 9, 13, [{ t: "pieza", g: 200 }]),
  A("flauta", "Flauta o taco dorado", "Platillos", 250, 10, 22, 13, [{ t: "pieza", g: 70 }], "tacos dorados"),
  A("sope", "Sope con frijol y queso", "Platillos", 230, 7, 28, 10, [{ t: "pieza", g: 110 }]),
  A("gordita", "Gordita rellena", "Platillos", 240, 9, 27, 11, [{ t: "pieza", g: 130 }]),
  A("frijoles-charros", "Frijoles charros", "Platillos", 110, 6, 11, 4.5, [{ t: "taza", g: 250 }]),
  // Antojitos, comida de la calle y postres (estimados)
  A("empanada-queso", "Empanada de queso (frita)", "Platillos", 330, 9, 30, 19, [{ t: "pieza", g: 90 }], "empanadas quesillo"),
  A("empanada-carne", "Empanada de carne, pollo o picadillo (frita)", "Platillos", 300, 10, 28, 16, [{ t: "pieza", g: 100 }], "empanadas tinga"),
  A("empanada-horneada", "Empanada horneada (queso, pollo o carne)", "Platillos", 280, 9, 33, 12, [{ t: "pieza", g: 100 }], "empanadas al horno"),
  A("picada", "Picada veracruzana", "Platillos", 200, 6, 27, 8, [{ t: "pieza", g: 90 }], "picadas veracruz"),
  A("garnacha", "Garnacha", "Platillos", 230, 8, 22, 12, [{ t: "pieza", g: 70 }], "garnachas veracruz orizaba"),
  A("memela", "Memela", "Platillos", 220, 7, 28, 9, [{ t: "pieza", g: 120 }], "memelas tlacoyo"),
  A("molote", "Molote", "Platillos", 300, 8, 30, 16, [{ t: "pieza", g: 80 }], "molotes"),
  A("tamal-elote", "Tamal de elote", "Platillos", 220, 4, 32, 9, [{ t: "pieza", g: 120 }], "uchepo"),
  A("pambazo", "Pambazo", "Platillos", 250, 9, 25, 13, [{ t: "pieza", g: 200 }]),
  A("tlayuda", "Tlayuda", "Platillos", 240, 11, 27, 10, [{ t: "pieza", g: 350 }]),
  A("taco-canasta", "Taco de canasta", "Platillos", 220, 7, 24, 11, [{ t: "taco", g: 60 }], "tacos sudados"),
  A("burrito", "Burrito", "Platillos", 210, 10, 24, 8, [{ t: "pieza", g: 250 }]),
  A("hot-dog", "Hot dog", "Platillos", 250, 9, 24, 13, [{ t: "pieza", g: 130 }], "jocho salchicha"),
  A("sincronizada", "Sincronizada", "Platillos", 260, 13, 22, 13, [{ t: "pieza", g: 140 }]),
  A("torta-milanesa", "Torta de milanesa", "Platillos", 240, 12, 26, 10, [{ t: "pieza", g: 330 }], "tortas"),
  A("elote-preparado", "Elote preparado (mayonesa, queso y chile)", "Platillos", 180, 4, 22, 9, [{ t: "pieza", g: 200 }]),
  A("esquite", "Esquite", "Platillos", 140, 3.5, 18, 6.5, [{ t: "vaso", g: 250 }], "esquites elote en vaso"),
  A("hot-cakes", "Hot cakes", "Platillos", 230, 6, 32, 9, [{ t: "pieza", g: 70 }], "panqueques hotcakes"),
  A("alitas", "Alitas (BBQ o búfalo)", "Platillos", 260, 20, 6, 17, [{ t: "pieza", g: 40 }, { t: "orden (10)", g: 400 }], "alas"),
  A("boneless", "Boneless", "Platillos", 280, 15, 18, 16, [{ t: "orden", g: 200 }]),
  A("sushi", "Sushi (rollo empanizado o natural)", "Platillos", 180, 6, 28, 5, [{ t: "rollo (8 piezas)", g: 250 }], "rollo"),
  A("concha", "Concha", "Grasas y otros", 380, 7, 55, 15, [{ t: "pieza", g: 80 }], "pan dulce"),
  A("dona", "Dona glaseada", "Grasas y otros", 420, 5, 50, 22, [{ t: "pieza", g: 60 }], "donas"),
  A("pastel", "Pastel con betún", "Grasas y otros", 370, 4.5, 52, 16, [{ t: "rebanada", g: 100 }], "cumpleaños"),
  A("flan", "Flan", "Grasas y otros", 150, 4, 24, 4.5, [{ t: "rebanada", g: 100 }]),
  A("gelatina", "Gelatina de agua", "Grasas y otros", 60, 1.2, 14, 0, [{ t: "vaso", g: 150 }]),
  A("arroz-leche", "Arroz con leche", "Grasas y otros", 130, 3.5, 22, 3, [{ t: "taza", g: 200 }]),
  A("atole", "Atole", "Bebidas", 85, 2, 16, 1.5, [{ t: "vaso", g: 250 }], "champurrado"),
  A("tamal", "Tamal", "Platillos", 200, 6, 25, 9, [{ t: "pieza", g: 150 }]),
  A("torta-jamon", "Torta de jamón", "Platillos", 220, 10, 28, 8, [{ t: "pieza", g: 250 }]),
  A("pozole", "Pozole", "Platillos", 95, 6, 9, 4, [{ t: "plato", g: 400 }]),
  A("caldo-pollo", "Caldo de pollo", "Platillos", 60, 6, 4, 2, [{ t: "plato", g: 400 }]),
  A("sopa-lentejas", "Sopa de lentejas", "Platillos", 90, 5.5, 14, 1.5, [{ t: "plato", g: 250 }]),
  A("pizza", "Pizza de pepperoni", "Platillos", 280, 12, 30, 12, [{ t: "rebanada", g: 107 }]),
  A("hamburguesa", "Hamburguesa sencilla", "Platillos", 260, 13, 25, 12, [{ t: "pieza", g: 200 }]),
];

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const VACIAS = new Set(["de", "del", "con", "sin", "la", "el", "los", "las", "y", "en", "a", "al", "un", "una"]);

/** Búsqueda local: primero lo que tenga todas las palabras; si no hay, lo más parecido. */
export function buscarLocal(q: string, max = 30): Alimento[] {
  // plurales: "tostadas" encuentra "tostada"
  // Sin palabras de relleno: "empanadas de queso" busca "empanada" y "queso"
  const palabras = normalizar(q).split(/\s+/).filter((w) => w && !VACIAS.has(w)).map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
  if (!palabras.length) return [];
  const puntuados = ALIMENTOS.map((a) => {
    const texto = normalizar(`${a.n} ${a.alias ?? ""}`);
    const n = palabras.filter((w) => texto.includes(w)).length;
    return { a, n, inicio: normalizar(a.n).startsWith(palabras[0]) ? 0 : 1 };
  });
  const orden = (x: { a: Alimento; n: number; inicio: number }, y: typeof x) => y.n - x.n || x.inicio - y.inicio || x.a.n.length - y.a.n.length;
  const todas = puntuados.filter((x) => x.n === palabras.length);
  // Si nada tiene todas las palabras, muestra lo que tenga alguna (lo más parecido primero)
  const lista = todas.length ? todas : puntuados.filter((x) => x.n > 0);
  return lista.sort(orden).slice(0, max).map((x) => x.a);
}

export { normalizar };
