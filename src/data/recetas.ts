/**
 * Recetario de Brío: más de 120 recetas mexicanas caseras, saludables y económicas.
 * Las kcal, macros y el costo se calculan solos a partir de data/alimentos.ts y data/compras.ts.
 * Ingrediente: [id de alimento, gramos, texto]. Id vacío = "al gusto" (no suma calorías).
 */
import { ALIMENTOS } from "./alimentos";
import { escalarIngrediente } from "../lib/porciones";
import { CARNE_FRESCA, COMPRAS, PERECEDEROS } from "./compras";

export type TipoReceta = "desayuno" | "comida" | "cena" | "colacion";
export type Equipo = "estufa" | "air fryer" | "microondas" | "licuadora" | "horno" | "ninguno";
export type Ingrediente = [string, number, string];

export interface Receta {
  id: string;
  nombre: string;
  tipos: TipoReceta[];
  min: number;
  equipo: Equipo[];
  ing: Ingrediente[];
  pasos: string[];
}

const R = (id: string, nombre: string, tipos: TipoReceta[], min: number, equipo: Equipo[], ing: Ingrediente[], pasos: string[]): Receta =>
  ({ id, nombre, tipos, min, equipo, ing, pasos });
const SAL: Ingrediente = ["", 0, "Sal y pimienta al gusto"];

const BASE: Receta[] = [
  /* ===================== DESAYUNOS ===================== */
  R("huevos-mexicana", "Huevos a la mexicana con tortillas", ["desayuno"], 12, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["jitomate", 60, "½ jitomate picado"], ["cebolla", 20, "Un trozo de cebolla"], ["serrano", 6, "1 chile serrano"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Sofríe jitomate, cebolla y chile picados en el aceite 2 minutos.", "Agrega los huevos batidos con sal y mueve hasta que cuajen.", "Sirve con las tortillas calientes."]),
  R("huevo-nopales", "Huevos revueltos con nopales", ["desayuno", "cena"], 12, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["nopales", 100, "1 taza de nopales cocidos"], ["cebolla", 15, "Un poco de cebolla"], ["aceite", 4.5, "1 cucharadita de aceite"],
    ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Sofríe la cebolla y los nopales picados 2 minutos.", "Agrega los huevos batidos y revuelve hasta que cuajen.", "Acompaña con tortillas."]),
  R("huevo-espinaca-panela", "Huevos con espinaca y panela", ["desayuno"], 10, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["clara", 66, "2 claras"], ["espinaca", 30, "1 taza de espinaca"], ["queso-panela", 30, "1 rebanada de panela en cubos"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["pan-integral", 56, "2 rebanadas de pan integral"], SAL,
  ], ["Saltea la espinaca 1 minuto en el aceite.", "Agrega huevos, claras y panela; revuelve a fuego bajo.", "Sirve con el pan tostado."]),
  R("omelette-champinones", "Omelette de champiñones", ["desayuno", "cena"], 12, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["champinones", 70, "1 taza de champiñones rebanados"], ["cebolla", 15, "Un poco de cebolla"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["pan-integral", 28, "1 rebanada de pan integral"], SAL,
  ], ["Saltea cebolla y champiñones hasta que suelten su jugo.", "Vierte los huevos batidos, tapa y deja cuajar a fuego bajo.", "Dobla y sirve con el pan."]),
  R("tostadas-huevo-frijol", "Tostadas de huevo con frijoles", ["desayuno", "cena"], 10, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["refritos", 60, "4 cucharadas de frijoles refritos"], ["tostada-horneada", 36, "3 tostadas horneadas"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["aceite", 2, "Unas gotas de aceite"], SAL,
  ], ["Haz los huevos estrellados o revueltos.", "Unta los frijoles en las tostadas.", "Coloca el huevo encima y termina con jitomate y cebolla."]),
  R("enfrijoladas-huevo", "Enfrijoladas con huevo", ["desayuno", "comida"], 15, ["estufa", "licuadora"], [
    ["frijol-negro", 150, "1 taza de frijoles cocidos"], ["tortilla-maiz", 60, "2 tortillas"], ["huevo", 100, "2 huevos"],
    ["queso-fresco", 20, "Queso fresco desmoronado"], ["cebolla", 10, "Cebolla en rodajas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Licúa los frijoles con un poco de su caldo y calienta.", "Pasa las tortillas calientes por la salsa de frijol y dóblalas.", "Sirve con los huevos estrellados, queso y cebolla."]),
  R("chilaquiles-horneados", "Chilaquiles verdes horneados con pollo", ["desayuno", "comida"], 15, ["estufa"], [
    ["tostada-horneada", 36, "3 tostadas horneadas en trozos"], ["salsa-verde", 120, "1 taza de salsa verde"], ["pechuga-cocida", 80, "Pollo deshebrado"],
    ["crema", 15, "1 cucharada de crema"], ["queso-fresco", 15, "Un poco de queso fresco"], ["cebolla", 10, "Cebolla en rodajas"],
  ], ["Calienta la salsa verde con el pollo.", "Agrega los trozos de tostada y mezcla rápido para que no se aguaden.", "Sirve con crema, queso y cebolla."]),
  R("avena-platano", "Avena con plátano y canela", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-light", 240, "1 taza de leche descremada"], ["platano", 118, "1 plátano"], ["", 0, "Canela al gusto"],
  ], ["Cuece la avena con la leche 4-5 minutos moviendo (o 2 minutos en microondas).", "Agrega canela y el plátano en rodajas."]),
  R("avena-proteica", "Avena proteica (sin refri)", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-polvo", 21, "3 cucharadas de leche en polvo"], ["platano", 60, "½ plátano"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"], ["", 0, "1 taza de agua y canela"],
  ], ["Cuece la avena en agua 4 minutos.", "Fuera del fuego disuelve la leche en polvo.", "Termina con plátano y crema de cacahuate."]),
  R("licuado-platano-avena", "Licuado de plátano y avena", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["platano", 118, "1 plátano"], ["avena", 30, "3 cucharadas de avena"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Licúa todo con hielo hasta que quede cremoso."]),
  R("yogur-fruta-granola", "Yogur griego con fruta y granola", ["desayuno", "colacion"], 5, ["ninguno"], [
    ["yogur-griego", 200, "1 taza de yogur griego natural"], ["papaya", 145, "1 taza de papaya"], ["granola", 30, "¼ taza de granola"],
  ], ["Sirve el yogur, agrega la fruta picada y la granola al final para que quede crujiente."]),
  R("pan-huevo-aguacate", "Pan integral con huevo y aguacate", ["desayuno", "cena"], 10, ["estufa"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["huevo", 100, "2 huevos"], ["aguacate", 50, "¼ de aguacate"],
    ["aceite", 2, "Unas gotas de aceite"], ["", 0, "Sal, limón y chile en polvo"],
  ], ["Tuesta el pan y unta el aguacate machacado con sal y limón.", "Pon encima los huevos estrellados o cocidos en rebanadas."]),
  R("sandwich-pavo-panela", "Sándwich de pavo y panela", ["desayuno", "cena"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["jamon-pavo", 40, "2 rebanadas de jamón de pavo"], ["queso-panela", 30, "1 rebanada de panela"],
    ["jitomate", 30, "Rodajas de jitomate"], ["lechuga", 20, "Hojas de lechuga"], ["", 0, "Mostaza al gusto"],
  ], ["Arma el sándwich con todos los ingredientes. Puedes tostarlo en sartén."]),
  R("molletes-integrales", "Molletes integrales", ["desayuno", "cena"], 10, ["horno", "air fryer"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["refritos", 60, "4 cucharadas de frijoles refritos"], ["queso-oaxaca", 30, "Queso Oaxaca deshebrado"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["serrano", 3, "Chile al gusto"],
  ], ["Unta frijoles en el pan y pon el queso encima.", "Gratina 5 minutos en air fryer u horno.", "Termina con el pico de gallo (jitomate, cebolla y chile)."]),
  R("hotcakes-avena", "Hot cakes de avena y plátano", ["desayuno"], 15, ["estufa", "licuadora"], [
    ["avena", 40, "4 cucharadas de avena"], ["huevo", 100, "2 huevos"], ["platano", 118, "1 plátano"], ["miel", 10, "1 cucharadita de miel"],
    ["aceite", 2, "Unas gotas de aceite"], ["", 0, "Canela y polvo para hornear (opcional)"],
  ], ["Licúa avena, huevos y plátano.", "Cocina pequeños hot cakes en sartén con unas gotas de aceite, 2 minutos por lado.", "Sirve con un hilo de miel."]),
  R("quesadillas-panela-champi", "Quesadillas de panela y champiñones", ["desayuno", "cena"], 10, ["estufa"], [
    ["tortilla-maiz", 60, "2 tortillas"], ["queso-panela", 40, "Panela en tiras"], ["champinones", 50, "Champiñones picados"], ["salsa-verde", 30, "Salsa al gusto"],
  ], ["Saltea los champiñones sin aceite hasta dorar.", "Rellena las tortillas con panela y champiñones y calienta en el comal.", "Acompaña con salsa."]),
  R("tacos-huevo-papa", "Tacos de huevo con papa", ["desayuno"], 15, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["papa", 100, "1 papa chica cocida en cubos"], ["tortilla-maiz", 60, "2 tortillas"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["salsa-roja", 30, "Salsa roja"], SAL,
  ], ["Dora la papa cocida en el aceite.", "Agrega los huevos batidos y revuelve.", "Arma los tacos y ponles salsa."]),
  R("huevos-rancheros", "Huevos rancheros ligeros", ["desayuno"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["tortilla-maiz", 60, "2 tortillas"], ["salsa-roja", 90, "Salsa ranchera (jitomate y chile)"],
    ["frijol-negro", 86, "½ taza de frijoles de la olla"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Calienta las tortillas y pon encima los huevos estrellados.", "Baña con la salsa caliente.", "Acompaña con frijoles."]),

  /* ===================== COMIDAS ===================== */
  R("pechuga-arroz-verduras", "Pechuga en air fryer con arroz y verduras", ["comida"], 25, ["air fryer", "estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["arroz-rojo", 120, "¾ taza de arroz rojo"], ["calabacita", 120, "1 calabacita"],
    ["zanahoria", 60, "1 zanahoria"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal, pimienta y limón"],
  ], ["Sazona la pechuga con ajo, sal, pimienta y limón.", "Cocínala en air fryer a 190 °C por 18 minutos, volteando a la mitad.", "Saltea las verduras en el aceite y sirve con el arroz."]),
  R("tostadas-atun", "Tostadas de atún a la mexicana", ["comida", "cena"], 10, ["ninguno"], [
    ["atun-agua", 100, "1 lata de atún en agua escurrido"], ["tostada-horneada", 36, "3 tostadas horneadas"], ["jitomate", 60, "½ jitomate picado"],
    ["cebolla", 20, "Cebolla picada"], ["serrano", 6, "1 chile serrano"], ["aguacate", 50, "¼ de aguacate"], ["", 0, "Limón y sal"],
  ], ["Mezcla el atún con jitomate, cebolla, chile, limón y sal.", "Sirve sobre las tostadas con rebanadas de aguacate."]),
  R("ensalada-atun-papa", "Ensalada de atún con papa", ["comida", "cena"], 20, ["estufa"], [
    ["atun-agua", 100, "1 lata de atún"], ["papa", 150, "1 papa mediana cocida"], ["zanahoria", 50, "½ zanahoria cocida"],
    ["mayonesa", 7, "½ cucharada de mayonesa"], ["", 0, "Limón, sal y pimienta"],
  ], ["Cuece papa y zanahoria en cubos 12 minutos.", "Mezcla con el atún, mayonesa, limón y sal."]),
  R("tacos-pollo", "Tacos de pollo deshebrado", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 120, "Pollo cocido deshebrado"], ["tortilla-maiz", 90, "3 tortillas"], ["cebolla", 20, "Cebolla y cilantro"],
    ["salsa-verde", 60, "Salsa verde"], ["lechuga", 30, "Lechuga picada"],
  ], ["Cuece la pechuga con sal y cebolla 20 minutos y deshébrala.", "Calienta las tortillas y arma los tacos con lechuga, cebolla y salsa."]),
  R("tinga-tostadas", "Tinga de pollo en tostadas", ["comida", "cena"], 25, ["estufa"], [
    ["pechuga-cocida", 120, "Pollo deshebrado"], ["jitomate", 120, "1 jitomate"], ["cebolla", 40, "½ cebolla fileteada"],
    ["tostada-horneada", 36, "3 tostadas horneadas"], ["crema", 15, "1 cucharada de crema"], ["aceite", 4.5, "1 cucharadita de aceite"],
    ["", 0, "Chipotle al gusto"],
  ], ["Acitrona la cebolla, agrega el jitomate licuado con chipotle y cocina 5 minutos.", "Agrega el pollo y deja que se impregne.", "Sirve en tostadas con un poco de crema."]),
  R("bistec-mexicana", "Bistec a la mexicana con frijoles", ["comida"], 20, ["estufa"], [
    ["bistec", 120, "120 g de bistec en tiras"], ["jitomate", 80, "Jitomate picado"], ["cebolla", 30, "Cebolla picada"], ["serrano", 6, "1 serrano"],
    ["frijol-negro", 86, "½ taza de frijoles de la olla"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Sella el bistec en el aceite a fuego alto.", "Agrega jitomate, cebolla y chile; cocina 5 minutos.", "Sirve con frijoles y tortillas."]),
  R("molida-papa-calabaza", "Carne molida con papa y calabacita", ["comida"], 25, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida"], ["papa", 100, "1 papa chica en cubos"], ["calabacita", 100, "1 calabacita en cubos"],
    ["jitomate", 60, "½ jitomate"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, comino y sal"],
  ], ["Dora la carne sin aceite.", "Agrega papa y jitomate licuado con ajo; tapa 10 minutos.", "Agrega la calabacita 5 minutos más y sirve con tortillas."]),
  R("picadillo-arroz", "Picadillo con arroz", ["comida"], 25, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida"], ["zanahoria", 50, "½ zanahoria picada"], ["papa", 80, "½ papa picada"],
    ["jitomate", 60, "½ jitomate"], ["arroz-blanco", 100, "⅔ taza de arroz blanco"],
  ], ["Dora la carne, agrega zanahoria, papa y jitomate licuado.", "Cocina tapado 12 minutos hasta que la papa esté suave.", "Sirve con el arroz."]),
  R("albondigas", "Albóndigas en caldillo", ["comida"], 35, ["estufa"], [
    ["molida-90", 120, "120 g de carne molida"], ["huevo", 25, "½ huevo"], ["arroz-blanco", 40, "2 cucharadas de arroz cocido"],
    ["jitomate", 120, "1 jitomate"], ["calabacita", 80, "½ calabacita"], ["", 0, "Ajo, cebolla, hierbabuena y sal"],
  ], ["Mezcla carne, huevo, arroz y sal; forma albóndigas.", "Licúa jitomate con ajo y cebolla y hiérvelo con 2 tazas de agua.", "Cuece las albóndigas en el caldillo 20 minutos y agrega la calabacita al final."]),
  R("sopa-lentejas", "Sopa de lentejas", ["comida", "cena"], 35, ["estufa"], [
    ["lentejas", 200, "1 taza de lentejas cocidas"], ["jitomate", 60, "½ jitomate"], ["zanahoria", 50, "½ zanahoria"], ["cebolla", 20, "Cebolla"],
    ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo y sal"],
  ], ["Cuece las lentejas con zanahoria picada 25 minutos.", "Agrega jitomate licuado con ajo y cebolla; hierve 5 minutos.", "Sirve con tortillas."]),
  R("frijoles-charros", "Frijoles charros ligeros", ["comida"], 25, ["estufa"], [
    ["frijol-bayo", 172, "1 taza de frijoles bayos cocidos"], ["salchicha-pavo", 45, "1 salchicha de pavo"], ["jitomate", 60, "½ jitomate"],
    ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"], ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Sofríe la salchicha picada con cebolla, jitomate y chile.", "Agrega los frijoles con su caldo y hierve 10 minutos.", "Sirve con tortillas."]),
  R("pescado-empapelado", "Pescado empapelado con verduras", ["comida"], 25, ["horno", "air fryer", "estufa"], [
    ["tilapia", 150, "1 filete de tilapia"], ["calabacita", 100, "Calabacita en rodajas"], ["zanahoria", 50, "Zanahoria en tiras"],
    ["jitomate", 60, "Jitomate en rodajas"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["", 0, "Ajo, limón, sal y orégano"],
  ], ["Coloca el pescado sobre papel aluminio con las verduras, ajo, limón y sal.", "Cierra y cocina 15 minutos en horno/air fryer a 190 °C (o en sartén tapada).", "Sirve con el arroz."]),
  R("caldo-pollo", "Caldo de pollo con verduras", ["comida"], 45, ["estufa"], [
    ["muslo", 180, "2 piezas de pierna/muslo sin piel"], ["papa", 100, "1 papa"], ["zanahoria", 60, "1 zanahoria"], ["calabacita", 100, "1 calabacita"],
    ["arroz-blanco", 60, "⅓ taza de arroz"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla, cilantro y limón"],
  ], ["Hierve el pollo con ajo y cebolla 25 minutos.", "Agrega papa y zanahoria 10 minutos, luego la calabacita 5 minutos.", "Sirve con arroz, cilantro, limón y tortillas."]),
  R("pasta-atun", "Pasta con atún y espinaca", ["comida"], 20, ["estufa"], [
    ["pasta", 140, "1 taza de pasta cocida"], ["atun-agua", 100, "1 lata de atún"], ["jitomate", 60, "½ jitomate picado"],
    ["espinaca", 30, "1 taza de espinaca"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal y pimienta"],
  ], ["Cuece la pasta.", "Saltea ajo, jitomate y espinaca en el aceite, agrega el atún.", "Mezcla con la pasta."]),
  R("enchiladas-horneadas", "Enchiladas verdes de pollo", ["comida"], 25, ["estufa", "horno"], [
    ["tortilla-maiz", 90, "3 tortillas"], ["pechuga-cocida", 90, "Pollo deshebrado"], ["salsa-verde", 120, "1 taza de salsa verde"],
    ["queso-fresco", 20, "Queso fresco"], ["crema", 15, "1 cucharada de crema"], ["cebolla", 10, "Cebolla"],
  ], ["Calienta las tortillas y rellénalas con pollo.", "Baña con salsa verde caliente.", "Termina con queso, crema y cebolla (puedes gratinar 5 minutos)."]),
  R("pollo-nopales", "Pollo con nopales y frijoles", ["comida"], 25, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en tiras"], ["nopales", 150, "1 taza de nopales"], ["frijol-negro", 86, "½ taza de frijoles"],
    ["tortilla-maiz", 60, "2 tortillas"], ["salsa-verde", 60, "Salsa verde"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Dora la pechuga en el aceite.", "Agrega nopales y salsa verde; cocina 8 minutos.", "Sirve con frijoles y tortillas."]),
  R("huevos-ahogados", "Huevos ahogados en salsa", ["comida", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["salsa-roja", 120, "Salsa de jitomate y chile"], ["frijol-negro", 86, "½ taza de frijoles"], ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Hierve la salsa en una olla chica.", "Rompe los huevos dentro y deja que se cuezan tapados 5 minutos.", "Sirve con frijoles y tortillas."]),
  R("tacos-bistec-nopales", "Tacos de bistec con nopales", ["comida", "cena"], 15, ["estufa"], [
    ["bistec", 100, "100 g de bistec"], ["nopales", 100, "Nopales asados"], ["tortilla-maiz", 90, "3 tortillas"],
    ["salsa-roja", 30, "Salsa"], ["cebolla", 15, "Cebolla y cilantro"], ["", 0, "Limón y sal"],
  ], ["Asa el bistec y los nopales en el comal.", "Pica todo y arma los tacos con cebolla, cilantro, limón y salsa."]),
  R("chuleta-ensalada", "Chuleta de cerdo con papa y ensalada", ["comida"], 25, ["air fryer", "estufa"], [
    ["chuleta", 120, "1 chuleta"], ["papa-airfryer", 150, "1 papa en gajos"], ["lechuga", 50, "Lechuga"], ["jitomate", 60, "Jitomate"],
    ["pepino", 50, "Pepino"], ["", 0, "Ajo, sal, limón"],
  ], ["Sazona la chuleta y cocina 12 minutos en air fryer (o sartén).", "Cocina los gajos de papa 15 minutos en air fryer.", "Acompaña con la ensalada con limón y sal."]),
  R("camarones-diabla", "Camarones a la diabla con arroz", ["comida"], 20, ["estufa"], [
    ["camaron", 150, "150 g de camarón"], ["salsa-roja", 60, "Salsa de chile guajillo y jitomate"], ["arroz-blanco", 120, "¾ taza de arroz"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo y sal"],
  ], ["Saltea los camarones con ajo en el aceite 3 minutos.", "Agrega la salsa y cocina 3 minutos más.", "Sirve con arroz."]),
  R("ensalada-pollo", "Ensalada de pollo con aguacate", ["comida", "cena"], 15, ["estufa", "air fryer"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["lechuga", 80, "Lechuga"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"],
    ["aguacate", 50, "¼ de aguacate"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, sal y pimienta"],
  ], ["Cocina la pechuga y córtala en tiras.", "Mezcla con las verduras, aguacate, limón y sal.", "Acompaña con tostadas."]),
  R("sardinas-mexicana", "Sardinas a la mexicana con tostadas", ["comida", "cena"], 10, ["ninguno"], [
    ["sardina", 100, "½ lata de sardina en tomate"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tostada-horneada", 36, "3 tostadas"], ["", 0, "Limón"],
  ], ["Desmenuza las sardinas y mézclalas con jitomate, cebolla, chile y limón.", "Sirve sobre las tostadas."]),
  R("arroz-huevo-verduras", "Arroz frito con huevo y verduras", ["comida", "cena"], 15, ["estufa"], [
    ["arroz-blanco", 150, "1 taza de arroz cocido"], ["huevo", 100, "2 huevos"], ["zanahoria", 50, "Zanahoria picada"],
    ["calabacita", 60, "Calabacita picada"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Salsa de soya o sal"],
  ], ["Saltea las verduras en el aceite.", "Agrega el arroz y luego los huevos batidos, revolviendo.", "Sazona con soya o sal."]),

  /* ===================== CENAS ===================== */
  R("tostadas-pollo", "Tostadas de pollo", ["cena", "comida"], 10, ["ninguno"], [
    ["pechuga-cocida", 90, "Pollo deshebrado"], ["tostada-horneada", 36, "3 tostadas"], ["refritos", 40, "Frijoles refritos"],
    ["lechuga", 30, "Lechuga"], ["salsa-verde", 30, "Salsa"], ["crema", 10, "Un poco de crema"],
  ], ["Unta frijoles en las tostadas.", "Agrega pollo, lechuga, salsa y un poco de crema."]),
  R("quesadillas-pollo", "Quesadillas de pollo y champiñón", ["cena"], 10, ["estufa"], [
    ["tortilla-maiz", 60, "2 tortillas"], ["pechuga-cocida", 60, "Pollo deshebrado"], ["queso-oaxaca", 30, "Queso Oaxaca"],
    ["champinones", 40, "Champiñones"], ["salsa-roja", 30, "Salsa"],
  ], ["Saltea los champiñones.", "Rellena las tortillas con pollo, queso y champiñones y calienta en comal.", "Sirve con salsa."]),
  R("sandwich-atun", "Sándwich de atún", ["cena", "comida"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["atun-agua", 100, "1 lata de atún"], ["mayonesa", 7, "½ cucharada de mayonesa"],
    ["lechuga", 20, "Lechuga"], ["jitomate", 30, "Jitomate"], ["", 0, "Limón y pimienta"],
  ], ["Mezcla el atún con mayonesa, limón y pimienta.", "Arma el sándwich con lechuga y jitomate."]),
  R("huevo-jamon", "Huevos revueltos con jamón", ["cena", "desayuno"], 8, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["jamon-pavo", 40, "2 rebanadas de jamón de pavo"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Dora el jamón picado.", "Agrega los huevos y revuelve.", "Sirve con tortillas."]),
  R("sincronizadas", "Sincronizadas de jamón y queso", ["cena"], 8, ["estufa"], [
    ["tortilla-harina", 90, "2 tortillas de harina"], ["jamon-pavo", 40, "2 rebanadas de jamón"], ["queso-oaxaca", 30, "Queso Oaxaca"],
    ["aguacate", 30, "Un poco de aguacate"],
  ], ["Arma con jamón y queso entre dos tortillas y dora por ambos lados.", "Acompaña con aguacate."]),
  R("wrap-pollo", "Wrap de pollo", ["cena", "comida"], 10, ["ninguno"], [
    ["tortilla-harina", 45, "1 tortilla de harina"], ["pechuga-cocida", 90, "Pollo en tiras"], ["lechuga", 30, "Lechuga"],
    ["jitomate", 30, "Jitomate"], ["yogur-griego", 30, "2 cucharadas de yogur griego como aderezo"], ["", 0, "Limón y pimienta"],
  ], ["Mezcla el yogur con limón y pimienta.", "Rellena la tortilla con pollo, verduras y aderezo; enróllala."]),
  R("calabacitas-panela", "Calabacitas a la mexicana con panela", ["cena", "comida"], 15, ["estufa"], [
    ["calabacita", 200, "2 calabacitas"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["queso-panela", 60, "2 rebanadas de panela"],
    ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Sofríe cebolla y jitomate, agrega las calabacitas en cubos y tapa 8 minutos.", "Agrega la panela en cubos al final.", "Sirve con tortillas."]),
  R("ensalada-garbanzo-atun", "Ensalada de garbanzo y atún", ["cena", "comida"], 10, ["ninguno"], [
    ["garbanzos", 100, "½ taza de garbanzos cocidos"], ["atun-agua", 100, "1 lata de atún"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"],
    ["aceite", 4.5, "1 cucharadita de aceite de oliva"], ["", 0, "Limón y sal"],
  ], ["Mezcla todo con limón, aceite y sal."]),
  R("huevo-cocido-aguacate", "Huevos cocidos con aguacate y tostadas", ["cena", "desayuno"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos cocidos"], ["aguacate", 50, "¼ de aguacate"], ["tostada-horneada", 24, "2 tostadas"],
    ["jitomate", 40, "Jitomate"], ["cebolla", 10, "Cebolla"],
  ], ["Cuece los huevos 10 minutos.", "Sirve sobre las tostadas con aguacate y pico de gallo."]),
  R("tacos-frijol-nopal", "Tacos de frijol con nopales", ["cena", "comida"], 15, ["estufa"], [
    ["refritos", 90, "Frijoles refritos"], ["nopales", 100, "Nopales asados"], ["tortilla-maiz", 90, "3 tortillas"],
    ["queso-fresco", 20, "Queso fresco"], ["salsa-verde", 30, "Salsa"],
  ], ["Asa los nopales.", "Arma los tacos con frijoles, nopales, queso y salsa."]),
  R("licuado-proteina", "Licuado de proteína casero", ["cena", "colacion", "desayuno"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["leche-polvo", 21, "3 cucharadas de leche en polvo"], ["platano", 118, "1 plátano"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Licúa todo con hielo."]),
  R("sopa-verduras-pollo", "Sopa de verduras con pollo", ["cena", "comida"], 30, ["estufa"], [
    ["pechuga-cocida", 90, "Pollo deshebrado"], ["calabacita", 100, "Calabacita"], ["zanahoria", 50, "Zanahoria"], ["papa", 80, "½ papa"],
    ["jitomate", 60, "Jitomate licuado"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Hierve el jitomate licuado con ajo y cebolla en 3 tazas de agua.", "Agrega papa y zanahoria 10 minutos, luego calabacita y pollo 5 minutos."]),
  R("tostadas-frijol-queso", "Tostadas de frijol con queso", ["cena", "colacion"], 5, ["ninguno"], [
    ["tostada-horneada", 24, "2 tostadas"], ["refritos", 60, "Frijoles refritos"], ["queso-fresco", 20, "Queso fresco"],
    ["lechuga", 20, "Lechuga"], ["salsa-roja", 20, "Salsa"],
  ], ["Unta frijoles, agrega lechuga, queso y salsa."]),
  R("atun-pepino", "Atún con pepino y limón", ["cena", "colacion"], 5, ["ninguno"], [
    ["atun-agua", 100, "1 lata de atún"], ["pepino", 150, "1 pepino en cubos"], ["tostada-horneada", 12, "1 tostada"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Mezcla el atún con pepino, limón, sal y chile.", "Acompaña con la tostada."]),

  /* ===================== COLACIONES ===================== */
  R("manzana-cacahuate", "Manzana con crema de cacahuate", ["colacion"], 2, ["ninguno"], [
    ["manzana", 180, "1 manzana"], ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Rebana la manzana y acompaña con la crema de cacahuate."]),
  R("yogur-miel", "Yogur griego con miel", ["colacion"], 2, ["ninguno"], [
    ["yogur-griego", 150, "1 vasito de yogur griego"], ["miel", 10, "1 cucharadita de miel"], ["", 0, "Canela"],
  ], ["Sirve el yogur con miel y canela."]),
  R("pepino-zanahoria", "Pepino y zanahoria con limón y chile", ["colacion"], 5, ["ninguno"], [
    ["pepino", 150, "1 pepino"], ["zanahoria", 60, "1 zanahoria"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Corta en bastones y sazona con limón, sal y chile."]),
  R("punado-cacahuates", "Puño de cacahuates", ["colacion"], 1, ["ninguno"], [
    ["cacahuates", 30, "1 puño (30 g) de cacahuates naturales"],
  ], ["Prefiere naturales o tostados sin sal."]),
  R("huevos-cocidos", "Huevos cocidos", ["colacion"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["", 0, "Sal y chile en polvo"],
  ], ["Cuece los huevos 10 minutos, pélalos y sazona. Aguantan todo el día sin refri si no los pelas."]),
  R("platano-cacahuates", "Plátano con cacahuates", ["colacion"], 1, ["ninguno"], [
    ["platano", 118, "1 plátano"], ["cacahuates", 15, "½ puño de cacahuates"],
  ], ["Ideal antes de entrenar."]),
  R("palomitas-naturales", "Palomitas naturales", ["colacion"], 5, ["estufa", "microondas"], [
    ["palomitas", 24, "3 tazas de palomitas"], ["", 0, "Sal, limón y chile en polvo"],
  ], ["Prepara el maíz palomero sin mantequilla (en olla tapada o en bolsa de papel en microondas).", "Sazona con limón y chile."]),
  R("papaya-yogur", "Papaya con yogur", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["papaya", 145, "1 taza de papaya"], ["yogur", 125, "1 vasito de yogur natural"],
  ], ["Sirve la papaya picada con el yogur."]),

  /* ===================== NUEVAS: DESAYUNOS ===================== */
  R("molletes-bolillo", "Molletes de bolillo con pico de gallo", ["desayuno", "cena"], 12, ["horno", "air fryer"], [
    ["bolillo", 70, "1 bolillo sin migajón"], ["refritos", 60, "4 cucharadas de frijoles refritos (de bolsa)"], ["queso-chihuahua", 30, "Queso manchego rallado"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["serrano", 3, "Chile al gusto"],
  ], ["Abre el bolillo, quítale el migajón y unta los frijoles.", "Pon el queso y gratina 5 minutos en air fryer u horno.", "Termina con el pico de gallo."]),
  R("huevo-rajas", "Huevos con rajas de poblano", ["desayuno", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["poblano", 100, "1 chile poblano asado en rajas"], ["cebolla", 20, "Cebolla fileteada"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Asa el poblano en el comal, déjalo sudar en una bolsa, pélalo y córtalo en rajas.", "Sofríe la cebolla y las rajas 2 minutos.", "Agrega los huevos batidos y revuelve. Sirve con tortillas."]),
  R("chilaquiles-rojos-huevo", "Chilaquiles rojos con huevo", ["desayuno"], 15, ["estufa"], [
    ["tostada-horneada", 36, "3 tostadas horneadas en trozos"], ["salsa-roja", 120, "1 taza de salsa roja"], ["huevo", 100, "2 huevos estrellados"],
    ["queso-fresco", 15, "Queso fresco"], ["crema", 10, "Un poco de crema"], ["cebolla", 10, "Cebolla en rodajas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Calienta la salsa y agrega los trozos de tostada; mezcla rápido.", "Sirve con los huevos estrellados encima.", "Termina con queso, crema y cebolla."]),
  R("avena-manzana-nuez", "Avena con manzana y nuez", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-light", 240, "1 taza de leche descremada"], ["manzana", 90, "½ manzana picada"],
    ["nueces", 10, "Unas nueces picadas"], ["", 0, "Canela al gusto"],
  ], ["Cuece la avena con la leche y la manzana 5 minutos.", "Sirve con canela y nuez picada."]),
  R("avena-fria-durazno", "Avena fría con durazno", ["desayuno"], 5, ["ninguno"], [
    ["avena", 40, "4 cucharadas de avena"], ["leche-light", 200, "¾ taza de leche descremada"], ["durazno", 150, "1 durazno picado"],
    ["chia", 6, "½ cucharada de chía"], ["", 0, "Canela"],
  ], ["Mezcla avena, leche y chía en un frasco y refrigera toda la noche.", "En la mañana agrega el durazno picado y canela."]),
  R("tostadas-requeson", "Tostadas de requesón con jitomate", ["desayuno", "cena"], 5, ["ninguno"], [
    ["tostada-horneada", 36, "3 tostadas horneadas"], ["requeson", 80, "4 cucharadas de requesón"], ["jitomate", 40, "Jitomate picado"],
    ["aguacate", 30, "Un poco de aguacate"], ["", 0, "Sal, orégano y chile"],
  ], ["Unta el requesón en las tostadas.", "Agrega jitomate, aguacate, sal, orégano y chile."]),
  R("pan-requeson-fresas", "Pan integral con requesón, fresas y miel", ["desayuno"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["requeson", 60, "3 cucharadas de requesón"], ["fresas", 100, "Fresas rebanadas"],
    ["miel", 7, "Un hilo de miel"],
  ], ["Tuesta el pan y unta el requesón.", "Acomoda las fresas y termina con miel."]),
  R("licuado-fresa-avena", "Licuado de fresa con avena", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["fresas", 150, "1 taza de fresas"], ["avena", 30, "3 cucharadas de avena"],
    ["chia", 6, "½ cucharada de chía"],
  ], ["Licúa todo con hielo."]),
  R("licuado-mamey", "Licuado de mamey", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["mamey", 85, "¼ de mamey"], ["avena", 20, "2 cucharadas de avena"], ["", 0, "Canela"],
  ], ["Licúa todo con hielo y canela."]),
  R("licuado-guayaba", "Licuado de guayaba", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["guayaba", 110, "2 guayabas"], ["avena", 20, "2 cucharadas de avena"],
  ], ["Licúa las guayabas con la leche y la avena; cuela si no te gustan las semillas."]),
  R("licuado-zarzamora", "Licuado de zarzamora", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["zarzamora", 100, "¾ taza de zarzamoras"], ["avena", 20, "2 cucharadas de avena"],
  ], ["Licúa todo con hielo."]),
  R("yogur-mango-chia", "Yogur griego con mango y chía", ["desayuno", "colacion"], 5, ["ninguno"], [
    ["yogur-griego", 200, "1 taza de yogur griego"], ["mango", 150, "¾ de mango picado"], ["chia", 12, "1 cucharada de chía"],
  ], ["Sirve el yogur con el mango y la chía."]),
  R("burrito-huevo-frijol", "Burrito de huevo con frijoles", ["desayuno"], 10, ["estufa"], [
    ["tortilla-harina", 45, "1 tortilla de harina grande"], ["huevo", 100, "2 huevos"], ["frijol-lata", 60, "¼ de taza de frijoles de lata escurridos"],
    ["salsa-roja", 30, "Salsa"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Calienta los frijoles y machácalos un poco.", "Haz los huevos revueltos.", "Rellena la tortilla con frijoles, huevo y salsa y enróllala."]),
  R("camote-yogur", "Camote con yogur y nuez", ["desayuno", "colacion"], 10, ["microondas", "horno", "air fryer"], [
    ["camote", 130, "1 camote chico cocido"], ["yogur-griego", 100, "½ taza de yogur griego"], ["nueces", 10, "Nuez picada"], ["", 0, "Canela"],
  ], ["Cuece el camote (8 minutos en microondas o 25 en horno/air fryer).", "Ábrelo y sirve con yogur, canela y nuez."]),
  R("ensalada-frutas", "Ensalada de frutas con yogur y granola", ["desayuno", "colacion"], 8, ["ninguno"], [
    ["papaya", 80, "Papaya picada"], ["melon", 80, "Melón picado"], ["uvas", 60, "Uvas"], ["pina", 60, "Piña"], ["yogur", 125, "1 vasito de yogur natural"],
    ["granola", 20, "2 cucharadas de granola"],
  ], ["Pica la fruta, agrega el yogur y la granola al final."]),
  R("huevo-ejotes", "Huevos con ejotes", ["desayuno", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["ejotes", 100, "1 taza de ejotes en trozos"], ["jitomate", 40, "Jitomate picado"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Cuece los ejotes 5 minutos en agua con sal.", "Sofríe con el jitomate y agrega los huevos batidos.", "Sirve con tortillas."]),
  R("salchichas-mexicana", "Salchichas a la mexicana", ["desayuno", "cena"], 10, ["estufa"], [
    ["salchicha-pavo", 90, "2 salchichas de pavo"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Pica las salchichas y dóralas.", "Agrega jitomate, cebolla y chile picados; cocina 3 minutos.", "Sirve con tortillas."]),
  R("amaranto-leche-fresas", "Amaranto con leche y fresas", ["desayuno", "colacion"], 3, ["ninguno"], [
    ["amaranto", 20, "4 cucharadas de amaranto natural"], ["leche-light", 200, "¾ taza de leche descremada"], ["fresas", 80, "Fresas picadas"],
  ], ["Sirve el amaranto como cereal con la leche fría y las fresas."]),

  /* ===================== NUEVAS: COMIDAS ===================== */
  R("carne-asada-nopales", "Carne asada con nopales y frijoles", ["comida"], 20, ["estufa"], [
    ["carne-asar", 120, "120 g de carne para asar"], ["nopales", 100, "Nopales asados"], ["frijol-negro", 86, "½ taza de frijoles de la olla"],
    ["tortilla-maiz", 60, "2 tortillas"], ["salsa-roja", 30, "Salsa"], ["cebolla", 15, "Cebollitas asadas"], ["", 0, "Limón y sal"],
  ], ["Sazona la carne con sal y limón y ásala en comal o sartén muy caliente.", "Asa también los nopales y la cebolla.", "Sirve con frijoles, tortillas y salsa."]),
  R("tacos-carne-asada", "Tacos de carne asada con guacamole", ["comida", "cena"], 15, ["estufa"], [
    ["carne-asar", 100, "100 g de carne para asar"], ["tortilla-maiz", 90, "3 tortillas"], ["aguacate", 50, "¼ de aguacate machacado"],
    ["cebolla", 15, "Cebolla y cilantro"], ["salsa-verde", 30, "Salsa"], ["", 0, "Limón y sal"],
  ], ["Asa la carne y pícala.", "Machaca el aguacate con limón y sal.", "Arma los tacos con guacamole, cebolla, cilantro y salsa."]),
  R("milanesa-pollo-ensalada", "Milanesa de pollo a la plancha con arroz y ensalada", ["comida"], 20, ["estufa", "air fryer"], [
    ["milanesa-pollo", 120, "1 milanesa de pollo"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["lechuga", 60, "Lechuga"],
    ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal, pimienta y limón"],
  ], ["Sazona la milanesa con ajo, sal y pimienta.", "Cocínala a la plancha 3 minutos por lado (o 10 minutos en air fryer).", "Sirve con arroz y la ensalada con limón."]),
  R("torta-milanesa-pollo", "Torta de milanesa de pollo", ["comida", "cena"], 15, ["estufa"], [
    ["bolillo", 70, "1 bolillo sin migajón"], ["milanesa-pollo", 100, "1 milanesa de pollo a la plancha"], ["refritos", 30, "Frijoles refritos"],
    ["lechuga", 20, "Lechuga"], ["jitomate", 30, "Jitomate"], ["aguacate", 30, "Aguacate"], ["", 0, "Chiles en vinagre al gusto"],
  ], ["Cocina la milanesa a la plancha.", "Abre el bolillo, quita el migajón y unta frijoles.", "Arma con la milanesa, lechuga, jitomate y aguacate."]),
  R("milanesa-res-pure", "Milanesa de res con puré y ejotes", ["comida"], 25, ["estufa"], [
    ["milanesa-res", 110, "1 milanesa de res"], ["papa", 150, "1 papa cocida para puré"], ["leche-light", 30, "Un chorrito de leche"],
    ["ejotes", 100, "1 taza de ejotes"], ["aceite", 4.5, "1 cucharadita de aceite"], SAL,
  ], ["Machaca la papa cocida con la leche y sal.", "Cuece los ejotes 5 minutos.", "Cocina la milanesa a la plancha 2 minutos por lado y sirve todo junto."]),
  R("milanesa-res-nopales", "Milanesa de res con ensalada de nopales", ["comida"], 20, ["estufa"], [
    ["milanesa-res", 110, "1 milanesa de res"], ["nopales", 120, "Nopales cocidos en tiras"], ["jitomate", 40, "Jitomate"], ["cebolla", 15, "Cebolla"],
    ["queso-fresco", 15, "Queso fresco"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Cilantro, orégano y limón"],
  ], ["Mezcla los nopales con jitomate, cebolla, cilantro, orégano, limón y queso.", "Cocina la milanesa a la plancha.", "Sirve con la ensalada y tortillas."]),
  R("pollo-verde-chayote", "Pollo en salsa verde con chayote", ["comida"], 35, ["estufa", "licuadora"], [
    ["muslo", 180, "2 piezas de pierna y muslo sin piel"], ["tomate-verde", 140, "4 tomates verdes"], ["serrano", 6, "1 serrano"],
    ["chayote", 130, "1 chayote en cubos"], ["cebolla", 20, "Cebolla"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["", 0, "Ajo, cilantro y sal"],
  ], ["Cuece el pollo con ajo y cebolla 20 minutos.", "Hierve los tomates y el chile, licúalos con cilantro y un poco de caldo.", "Junta la salsa con el pollo y el chayote; cocina 10 minutos. Sirve con arroz."]),
  R("hamburguesa-casera", "Hamburguesa casera en pan integral", ["comida", "cena"], 15, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida de res"], ["pan-integral", 56, "2 rebanadas de pan integral"], ["lechuga", 20, "Lechuga"],
    ["jitomate", 30, "Jitomate"], ["cebolla", 15, "Cebolla"], ["aguacate", 30, "Aguacate"], ["", 0, "Sal, pimienta y mostaza"],
  ], ["Forma una torta delgada con la carne, sal y pimienta.", "Cocínala en sartén 4 minutos por lado.", "Arma la hamburguesa con las verduras y el aguacate."]),
  R("rajas-pollo-elote", "Rajas con pollo y elote", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 100, "Pollo en tiras"], ["poblano", 100, "1 poblano asado en rajas"], ["elote", 70, "½ taza de granos de elote"],
    ["crema", 15, "1 cucharada de crema"], ["cebolla", 20, "Cebolla"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Sofríe la cebolla, las rajas y el elote 3 minutos.", "Agrega el pollo y la crema; calienta 2 minutos.", "Sirve con tortillas."]),
  R("pescado-veracruzana", "Pescado a la veracruzana", ["comida"], 25, ["estufa"], [
    ["tilapia", 150, "1 filete de pescado"], ["jitomate", 120, "1 jitomate"], ["cebolla", 30, "Cebolla"], ["pimiento", 40, "Pimiento morrón"],
    ["arroz-blanco", 100, "⅔ taza de arroz"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, aceitunas, alcaparras y orégano (opcional)"],
  ], ["Sofríe cebolla, ajo y pimiento; agrega el jitomate picado y cocina 5 minutos.", "Pon el pescado encima, tapa y cocina 8 minutos.", "Sirve con arroz."]),
  R("tacos-pescado", "Tacos de pescado con col", ["comida", "cena"], 20, ["estufa", "air fryer"], [
    ["tilapia", 120, "1 filete de pescado"], ["tortilla-maiz", 90, "3 tortillas"], ["col", 50, "Col rallada"], ["jitomate", 30, "Pico de gallo"],
    ["yogur-griego", 20, "Yogur griego con limón como aderezo"], ["", 0, "Limón, sal y chile"],
  ], ["Sazona el pescado y cocínalo a la plancha o en air fryer.", "Mezcla el yogur con limón.", "Arma los tacos con col, pescado, pico de gallo y el aderezo."]),
  R("pollo-brocoli-arroz", "Pollo con brócoli, coliflor y arroz", ["comida"], 25, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en cubos"], ["brocoli", 80, "Brócoli"], ["coliflor", 60, "Coliflor"], ["zanahoria", 40, "Zanahoria"],
    ["arroz-blanco", 100, "⅔ taza de arroz"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal y salsa de soya"],
  ], ["Dora el pollo en el aceite con ajo.", "Agrega las verduras y un poco de agua; tapa 5 minutos.", "Sazona y sirve con arroz."]),
  R("burrito-pollo-frijol", "Burrito de pollo y frijoles", ["comida", "cena"], 10, ["estufa"], [
    ["tortilla-harina", 45, "1 tortilla de harina grande"], ["pechuga-cocida", 80, "Pollo deshebrado"], ["frijol-lata", 80, "Frijoles de lata escurridos"],
    ["lechuga", 20, "Lechuga"], ["salsa-roja", 30, "Salsa"],
  ], ["Calienta el pollo y los frijoles.", "Rellena la tortilla con todo y enróllala; dórala en el comal."]),
  R("chuleta-salsa-verde", "Chuleta en salsa verde con frijoles", ["comida"], 25, ["estufa", "licuadora"], [
    ["chuleta", 120, "1 chuleta de cerdo"], ["tomate-verde", 140, "4 tomates verdes"], ["serrano", 6, "1 serrano"],
    ["frijol-bayo", 86, "½ taza de frijoles bayos de la olla"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Dora la chuleta en sartén.", "Licúa los tomates hervidos con chile, ajo y cebolla; vierte sobre la chuleta y cocina 10 minutos.", "Sirve con frijoles y tortillas."]),
  R("bowl-pollo-camote", "Pollo con camote y brócoli al horno", ["comida"], 30, ["air fryer", "horno"], [
    ["pechuga-cocida", 120, "120 g de pechuga"], ["camote", 130, "1 camote chico en cubos"], ["brocoli", 100, "Brócoli"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Paprika, ajo, sal y pimienta"],
  ], ["Mezcla el camote con aceite y especias; cocina 15 minutos a 200 °C.", "Agrega el pollo sazonado y el brócoli; 12 minutos más.", "Sirve todo junto."]),
  R("tortitas-coliflor", "Tortitas de coliflor con panela en caldillo", ["comida", "cena"], 25, ["estufa"], [
    ["coliflor", 200, "Coliflor cocida"], ["huevo", 50, "1 huevo"], ["queso-panela", 40, "Panela"], ["salsa-roja", 90, "Caldillo de jitomate"],
    ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Corta la coliflor en ramitos y rellena con un trozo de panela.", "Pásalos por el huevo batido y dora en el aceite.", "Sirve en el caldillo de jitomate caliente."]),
  R("pollo-ensalada-betabel", "Pollo con ensalada de betabel y naranja", ["comida", "cena"], 20, ["estufa", "air fryer"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["betabel", 80, "1 betabel cocido"], ["zanahoria", 50, "Zanahoria rallada"],
    ["naranja", 60, "½ naranja en gajos"], ["lechuga", 40, "Lechuga"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón y sal"],
  ], ["Cocina la pechuga y córtala en tiras.", "Mezcla betabel en cubos, zanahoria, naranja y lechuga con limón.", "Sirve con el pollo y las tostadas."]),
  R("espagueti-rojo-pollo", "Espagueti rojo con pollo", ["comida"], 25, ["estufa", "licuadora"], [
    ["pasta", 140, "1 taza de espagueti cocido"], ["jitomate", 100, "1 jitomate"], ["pechuga-cocida", 100, "Pollo deshebrado"],
    ["queso-chihuahua", 15, "Queso manchego rallado"], ["crema", 10, "Un poco de crema"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Cuece el espagueti.", "Licúa el jitomate con ajo, cebolla y crema; cocina 5 minutos.", "Mezcla con la pasta y el pollo; termina con queso."]),
  R("salpicon-res", "Salpicón de res en tostadas", ["comida", "cena"], 15, ["estufa"], [
    ["bistec", 100, "Carne de res cocida y deshebrada"], ["lechuga", 50, "Lechuga picada"], ["jitomate", 60, "Jitomate"],
    ["cebolla", 20, "Cebolla morada"], ["aguacate", 40, "Aguacate"], ["tostada-horneada", 36, "3 tostadas"], ["", 0, "Limón, orégano y sal"],
  ], ["Cuece la carne con sal y deshébrala (puedes usar sobrante).", "Mezcla con lechuga, jitomate, cebolla, limón y orégano.", "Sirve sobre tostadas con aguacate."]),
  R("fajitas-pollo", "Fajitas de pollo con pimiento", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en tiras"], ["pimiento", 120, "1 pimiento morrón en tiras"], ["cebolla", 40, "½ cebolla"],
    ["tortilla-harina", 45, "1 tortilla de harina"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Comino, ajo, sal y limón"],
  ], ["Saltea el pollo con las especias a fuego alto.", "Agrega pimiento y cebolla; 4 minutos más.", "Sirve con la tortilla."]),
  R("ceviche-pescado", "Ceviche de pescado con tostadas", ["comida", "cena"], 20, ["ninguno"], [
    ["tilapia", 120, "Pescado en cubos chicos"], ["pepino", 60, "Pepino"], ["jitomate", 60, "Jitomate"], ["cebolla", 20, "Cebolla"],
    ["serrano", 6, "1 serrano"], ["tostada-horneada", 36, "3 tostadas"], ["aguacate", 30, "Aguacate"], ["", 0, "Jugo de 6 limones, cilantro y sal"],
  ], ["Cubre el pescado con jugo de limón y refrigera 30-40 minutos hasta que se vea blanco.", "Escurre y mezcla con las verduras picadas.", "Sirve en tostadas con aguacate."]),
  R("sardinas-nopales", "Sardinas con nopales", ["comida", "cena"], 15, ["estufa"], [
    ["sardina", 100, "½ lata de sardinas en tomate"], ["nopales", 100, "Nopales cocidos"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Sofríe la cebolla y el chile, agrega los nopales.", "Agrega las sardinas con su salsa y calienta 3 minutos.", "Sirve con tortillas."]),
  R("coctel-camaron", "Coctel de camarón ligero", ["comida", "cena"], 15, ["ninguno"], [
    ["camaron", 120, "120 g de camarón cocido"], ["jitomate", 80, "Jitomate picado"], ["pepino", 60, "Pepino"], ["cebolla", 20, "Cebolla"],
    ["aguacate", 30, "Aguacate"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, cilantro, salsa picante y un chorrito de catsup"],
  ], ["Mezcla el camarón con las verduras picadas, limón y salsa.", "Sirve frío con aguacate y tostadas."]),
  R("caldo-res", "Caldo de res con verduras", ["comida"], 60, ["estufa"], [
    ["bistec", 120, "120 g de chambarete o carne para caldo"], ["col", 70, "Un trozo de col"], ["elote", 70, "½ elote en trozos"],
    ["zanahoria", 50, "Zanahoria"], ["chayote", 80, "½ chayote"], ["papa", 80, "½ papa"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla, cilantro y limón"],
  ], ["Hierve la carne con ajo y cebolla 40 minutos (o 20 en olla exprés).", "Agrega elote, papa y zanahoria 10 minutos, luego chayote y col 5 minutos.", "Sirve con cilantro, limón y tortillas."]),
  R("ensalada-espinaca-pera", "Ensalada de espinaca con pollo y pera", ["comida", "cena"], 15, ["estufa", "air fryer"], [
    ["pechuga-cocida", 120, "120 g de pechuga"], ["espinaca", 60, "2 tazas de espinaca"], ["pera", 90, "½ pera rebanada"],
    ["nueces", 10, "Unas nueces"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, sal y pimienta"],
  ], ["Cocina la pechuga y córtala en tiras.", "Mezcla con espinaca, pera y nuez; aliña con limón.", "Acompaña con tostadas."]),
  R("ensalada-lentejas", "Ensalada de lentejas", ["comida", "cena"], 15, ["estufa"], [
    ["lentejas", 150, "¾ taza de lentejas cocidas"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"], ["cebolla", 15, "Cebolla"],
    ["queso-fresco", 20, "Queso fresco"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, aceite de oliva y sal"],
  ], ["Cuece las lentejas sin que se deshagan y enfríalas.", "Mezcla con las verduras picadas, queso y limón.", "Acompaña con tostadas."]),

  /* ===================== NUEVAS: COLACIONES ===================== */
  R("jicama-pepino-naranja", "Jícama, pepino y naranja con chile", ["colacion"], 5, ["ninguno"], [
    ["jicama", 130, "1 taza de jícama"], ["pepino", 80, "Pepino"], ["naranja", 60, "½ naranja"], ["", 0, "Limón y chile en polvo"],
  ], ["Corta en bastones y sazona con limón y chile."]),
  R("mango-chile", "Mango con limón y chile", ["colacion"], 3, ["ninguno"], [
    ["mango", 200, "1 mango"], ["", 0, "Limón y chile en polvo"],
  ], ["Pica el mango y sazona con limón y chile."]),
  R("sandia-melon", "Sandía y melón picados", ["colacion"], 5, ["ninguno"], [
    ["sandia", 150, "1 taza de sandía"], ["melon", 150, "1 taza de melón"], ["", 0, "Limón y chile (opcional)"],
  ], ["Pica la fruta y sirve fría."]),
  R("vaso-fruta", "Vaso de fruta: papaya, sandía y tuna", ["colacion"], 5, ["ninguno"], [
    ["papaya", 80, "Papaya"], ["sandia", 80, "Sandía"], ["tuna", 100, "1 tuna pelada"], ["", 0, "Limón y chile"],
  ], ["Pica la fruta en cubos y sazona al gusto."]),
  R("pina-pepino", "Piña con pepino y chile", ["colacion"], 5, ["ninguno"], [
    ["pina", 120, "¾ taza de piña"], ["pepino", 80, "Pepino"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Pica en cubos y sazona."]),
  R("mandarinas-nueces", "Mandarinas con nueces", ["colacion"], 2, ["ninguno"], [
    ["mandarina", 176, "2 mandarinas"], ["nueces", 14, "Medio puño de nueces"],
  ], ["Pela las mandarinas y acompaña con las nueces."]),
  R("coctel-citricos", "Coctel de cítricos con kiwi", ["colacion", "desayuno"], 5, ["ninguno"], [
    ["toronja", 120, "½ toronja en gajos"], ["naranja", 130, "1 naranja en gajos"], ["kiwi", 75, "1 kiwi"], ["mandarina", 88, "1 mandarina"], ["miel", 7, "Un hilo de miel"],
  ], ["Pela los cítricos en gajos, agrega el kiwi picado y un hilo de miel."]),
  R("toronja-miel", "Toronja con miel", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["toronja", 240, "1 toronja"], ["miel", 7, "1 cucharadita de miel"],
  ], ["Parte la toronja a la mitad, separa los gajos con un cuchillo y pon miel."]),
  R("pera-requeson", "Pera con requesón y canela", ["colacion"], 3, ["ninguno"], [
    ["pera", 180, "1 pera"], ["requeson", 60, "3 cucharadas de requesón"], ["", 0, "Canela"],
  ], ["Rebana la pera y sirve con el requesón y canela."]),
  R("durazno-yogur", "Durazno con yogur griego y almendras", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["durazno", 150, "1 durazno"], ["yogur-griego", 150, "1 vasito de yogur griego"], ["almendras", 10, "Unas almendras"],
  ], ["Pica el durazno y sirve sobre el yogur con almendras."]),
  R("kiwi-fresas-amaranto", "Kiwi y fresas con amaranto", ["colacion"], 3, ["ninguno"], [
    ["kiwi", 75, "1 kiwi"], ["fresas", 100, "Fresas"], ["amaranto", 10, "2 cucharadas de amaranto"],
  ], ["Pica la fruta y espolvorea el amaranto."]),
  R("tunas-frescas", "Tunas frescas", ["colacion"], 5, ["ninguno"], [
    ["tuna", 200, "2 tunas peladas"],
  ], ["Pélalas con cuidado (con guante o tenedor) y sírvelas frías."]),
  R("ciruelas-almendras", "Ciruelas con almendras", ["colacion"], 1, ["ninguno"], [
    ["ciruela", 132, "2 ciruelas"], ["almendras", 14, "Medio puño de almendras"],
  ], ["Lava las ciruelas y acompaña con las almendras."]),
  R("yogur-ciruela-amaranto", "Yogur natural con ciruela y amaranto", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["yogur", 125, "1 vasito de yogur natural"], ["ciruela", 66, "1 ciruela picada"], ["amaranto", 10, "2 cucharadas de amaranto"],
  ], ["Sirve el yogur con la ciruela y el amaranto."]),
  R("yogur-zarzamora", "Yogur con zarzamoras y granola", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["yogur", 125, "1 vasito de yogur natural"], ["zarzamora", 70, "½ taza de zarzamoras"], ["granola", 15, "Granola"],
  ], ["Sirve el yogur con las zarzamoras y la granola."]),
  R("uvas-panela", "Uvas con queso panela", ["colacion"], 2, ["ninguno"], [
    ["uvas", 150, "1 taza de uvas"], ["queso-panela", 30, "1 rebanada de panela en cubos"],
  ], ["Sirve las uvas con la panela en cubos."]),
  R("guayabas-chile", "Guayabas con limón y chile", ["colacion"], 2, ["ninguno"], [
    ["guayaba", 110, "2 guayabas"], ["", 0, "Limón y chile en polvo"],
  ], ["Parte en cuartos y sazona."]),
  R("mamey-canela", "Mamey con canela", ["colacion"], 3, ["ninguno"], [
    ["mamey", 170, "½ mamey"], ["", 0, "Canela"],
  ], ["Sirve el mamey en cubos con canela."]),
  R("esquites-ligeros", "Esquites ligeros", ["colacion", "cena"], 15, ["estufa"], [
    ["elote", 150, "1 vaso de granos de elote"], ["queso-fresco", 10, "Queso fresco"], ["yogur-griego", 20, "Yogur griego en lugar de mayonesa"],
    ["", 0, "Epazote, limón, sal y chile en polvo"],
  ], ["Cuece los granos de elote con sal y epazote 10 minutos.", "Sirve con yogur, queso, limón y chile."]),
  R("palomitas-cacahuates", "Palomitas con cacahuates", ["colacion"], 5, ["estufa", "microondas"], [
    ["palomitas", 16, "2 tazas de palomitas naturales"], ["cacahuates", 15, "Medio puño de cacahuates"], ["", 0, "Limón y chile"],
  ], ["Prepara las palomitas sin mantequilla y mezcla con los cacahuates."]),
  R("hummus-verduras", "Hummus casero con verduras", ["colacion"], 10, ["licuadora"], [
    ["garbanzos", 80, "½ taza de garbanzos cocidos"], ["aceite", 4.5, "1 cucharadita de aceite de oliva"], ["zanahoria", 60, "Zanahoria en bastones"],
    ["pepino", 60, "Pepino en bastones"], ["", 0, "Limón, ajo, comino y sal"],
  ], ["Licúa los garbanzos con aceite, limón, ajo, comino, sal y un poco de agua.", "Acompaña con las verduras en bastones."]),
  R("ensalada-betabel-queso", "Ensalada de betabel, jícama y queso fresco", ["cena", "colacion"], 10, ["ninguno"], [
    ["betabel", 160, "2 betabeles cocidos"], ["jicama", 60, "Jícama en tiras"], ["queso-fresco", 30, "Queso fresco"], ["lechuga", 40, "Lechuga"],
    ["nueces", 10, "Unas nueces"], ["", 0, "Limón y sal"],
  ], ["Corta el betabel en cubos y mezcla con jícama, lechuga, queso y nuez.", "Aliña con limón y sal."]),
];

/* ---------- Valores calculados ---------- */
const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

export interface Nutricion { kcal: number; proteina: number; carbos: number; grasa: number }

/** Gramos de un ingrediente para la porción (las piezas se redondean a enteras: 1 o 2 panes, no 1½). */
export const gramosIng = ([, g, t]: Ingrediente, factor = 1) => (g ? escalarIngrediente(g, t, factor).g : 0);

export function nutricion(r: Receta, factor = 1): Nutricion {
  const t = { kcal: 0, proteina: 0, carbos: 0, grasa: 0 };
  for (const ing of r.ing) {
    const a = POR_ID.get(ing[0]);
    if (!a || !ing[1]) continue;
    const f = gramosIng(ing, factor) / 100;
    t.kcal += a.kcal * f; t.proteina += a.p * f; t.carbos += a.c * f; t.grasa += a.g * f;
  }
  return { kcal: Math.round(t.kcal), proteina: Math.round(t.proteina), carbos: Math.round(t.carbos), grasa: Math.round(t.grasa) };
}

/** Costo aproximado de una porción (MXN). */
export function costo(r: Receta, factor = 1): number {
  let c = 0;
  for (const ing of r.ing) {
    const k = COMPRAS[ing[0]];
    if (k && ing[1]) c += (gramosIng(ing, factor) / k.g) * k.precio;
  }
  return Math.round(c);
}

export const necesitaRefri = (r: Receta) => r.ing.some(([id]) => PERECEDEROS.has(id));
/** Lleva carne o pollo crudo: sin refri se puede, pero comprándolo el mismo día. */
export const llevaCarneFresca = (r: Receta) => r.ing.some(([id]) => CARNE_FRESCA.has(id));

/* ---------- Sin aceite ---------- */
const SIN_ACEITE_TXT = "Sin aceite: sartén antiadherente o un chorrito de agua";
const quitarAceite = (t: string) => t
  .replace(/ en el aceite/g, " en sartén antiadherente")
  .replace(/ con unas gotas de aceite/g, " antiadherente, sin aceite")
  .replace(/, aceite( de oliva)? y /g, " y ")
  .replace(/ con aceite y /g, " con ")
  .replace(/ con aceite, /g, " con ")
  .replace(/aceite( de oliva)?, /g, "");
function sinAceite(r: Receta): Receta {
  if (!r.ing.some(([id, , t]) => id === "aceite" || (!id && /aceite/i.test(t)))) return r;
  return {
    ...r,
    ing: r.ing.map(([id, g, t]) => (id === "aceite" ? ["", 0, SIN_ACEITE_TXT] : !id ? [id, g, quitarAceite(t)] : [id, g, t]) as Ingrediente),
    pasos: r.pasos.map(quitarAceite),
  };
}

/** Recetario activo (cambia si la persona no cocina con aceite). */
export let RECETAS: Receta[] = BASE;
let sinAceiteActivo = false;
export function configurarRecetas(o: { sinAceite?: boolean }) {
  const v = !!o.sinAceite;
  if (v === sinAceiteActivo) return;
  sinAceiteActivo = v;
  RECETAS = v ? BASE.map(sinAceite) : BASE;
}

export function etiquetas(r: Receta): string[] {
  const n = nutricion(r);
  const e: string[] = [];
  if (n.proteina >= 25 || (n.kcal > 0 && (n.proteina * 4) / n.kcal >= 0.3)) e.push("Alta en proteína");
  if (costo(r) <= 35) e.push("Económica");
  if (r.min <= 10) e.push("Rápida");
  if (!necesitaRefri(r) && !llevaCarneFresca(r)) e.push("Sin refri");
  return e;
}

export const recetaPorId = (id: string) => RECETAS.find((r) => r.id === id);
export const TIPOS_RECETA: { id: TipoReceta; t: string }[] = [
  { id: "desayuno", t: "Desayuno" }, { id: "comida", t: "Comida" }, { id: "cena", t: "Cena" }, { id: "colacion", t: "Colación" },
];
