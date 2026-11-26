/**
 * Recetario de Brío: más de 120 recetas mexicanas caseras, saludables y económicas.
 * Las kcal, macros y el costo se calculan solos a partir de data/alimentos.ts y data/compras.ts.
 * Ingrediente: [id de alimento, gramos, texto]. Id vacío = "al gusto" (no suma calorías).
 */
import { ALIMENTOS } from "./alimentos";
import { ajustarIngrediente, esPieza, escalarIngrediente } from "../lib/porciones";
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
  ], ["Pica el jitomate en cubos chicos, la cebolla finita y el serrano en rodajas (quítale las venas si no quieres que pique tanto).", "Bate los 3 huevos en un plato hondo con una pizca de sal y pimienta; no hace falta espumarlos, solo que se mezclen yema y clara.", "Calienta el aceite en un sartén a fuego medio 1 minuto y sofríe cebolla y chile 1 minuto, hasta que la cebolla se vea transparente.", "Agrega el jitomate y cocina 2 minutos más, moviendo, hasta que suelte su jugo y se ablande.", "Baja a fuego medio-bajo, vierte el huevo y mueve con la pala de afuera hacia el centro, sin parar, unos 2 minutos.", "Apágalo cuando todavía se vea un poco húmedo: se termina de cocer con el calor del sartén y queda jugoso, no seco.", "Calienta las tortillas en el comal 30 segundos por lado y sirve de inmediato."]),
  R("huevo-nopales", "Huevos revueltos con nopales", ["desayuno", "cena"], 12, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["nopales", 100, "1 taza de nopales cocidos"], ["cebolla", 15, "Un poco de cebolla"], ["aceite", 4.5, "1 cucharadita de aceite"],
    ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Si tus nopales son crudos, córtalos en tiras y hiérvelos 8 minutos con sal y un trozo de cebolla; enjuágalos con agua fría para quitar la baba. Si ya vienen cocidos, solo escúrrelos bien.", "Pica la cebolla finita y bate los 3 huevos con sal y pimienta.", "Calienta el aceite en sartén a fuego medio y sofríe la cebolla 1 minuto.", "Agrega los nopales y saltéalos 2-3 minutos hasta que se sequen un poco y ya no se vean babosos.", "Baja el fuego, vierte el huevo y revuelve suavemente 2 minutos, hasta que cuaje pero siga jugoso.", "Sirve con las tortillas calientes y una salsa si te gusta.", "Tip: los nopales cocidos sin refri aguantan 1 día tapados; mejor cómpralos el mismo día."]),
  R("huevo-espinaca-panela", "Huevos con espinaca y panela", ["desayuno"], 10, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["clara", 66, "2 claras"], ["espinaca", 30, "1 taza de espinaca"], ["queso-panela", 30, "1 rebanada de panela en cubos"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["pan-integral", 56, "2 rebanadas de pan integral"], SAL,
  ], ["Lava la espinaca y escúrrela bien; corta la panela en cubos de 1 cm.", "Bate los 2 huevos con las 2 claras, sal y pimienta.", "Calienta el aceite en sartén a fuego medio y saltea la espinaca 1 minuto, solo hasta que se marchite.", "Baja a fuego bajo, agrega el huevo y los cubos de panela y revuelve despacio 2-3 minutos.", "Apaga cuando el huevo esté apenas cuajado; la panela debe quedar suave, no derretida del todo.", "Mientras, tuesta el pan en el comal o tostador 1-2 minutos por lado.", "Sirve el huevo sobre o junto al pan. Tip: sin refri, compra la panela el mismo día."]),
  R("omelette-champinones", "Omelette de champiñones", ["desayuno", "cena"], 12, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["champinones", 70, "1 taza de champiñones rebanados"], ["cebolla", 15, "Un poco de cebolla"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["pan-integral", 28, "1 rebanada de pan integral"], SAL,
  ], ["Limpia los champiñones con un trapo húmedo (no los remojes) y rebánalos delgado; pica la cebolla.", "Bate los 3 huevos con sal y pimienta hasta que se vean uniformes.", "Calienta la mitad del aceite en sartén a fuego medio-alto y saltea cebolla y champiñones 4-5 minutos, hasta que suelten su jugo y este se evapore. Sácalos a un plato.", "Baja a fuego bajo, pon el resto del aceite y vierte el huevo; mueve el sartén para que cubra todo el fondo.", "Tapa y deja cuajar 2-3 minutos sin mover, hasta que la superficie ya no esté líquida.", "Pon los champiñones en una mitad, dobla el omelette con la pala y deja 30 segundos más.", "Sirve con el pan tostado."]),
  R("tostadas-huevo-frijol", "Tostadas de huevo con frijoles", ["desayuno", "cena"], 10, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["refritos", 60, "4 cucharadas de frijoles refritos"], ["tostada-horneada", 36, "3 tostadas horneadas"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["aceite", 2, "Unas gotas de aceite"], SAL,
  ], ["Calienta los frijoles refritos en un sartén chico 2 minutos con una cucharada de agua para que se puedan untar.", "Pica jitomate y cebolla en cubos chicos y mézclalos con una pizca de sal.", "En un sartén con unas gotas de aceite a fuego medio, estrella los 2 huevos y cocínalos 3 minutos tapados (la yema queda tierna) o revuélvelos si prefieres.", "Unta una capa delgada de frijoles en cada tostada.", "Pon el huevo encima y termina con el jitomate y la cebolla.", "Cómelas recién armadas para que la tostada no se aguade."]),
  R("enfrijoladas-huevo", "Enfrijoladas con huevo", ["desayuno", "comida"], 15, ["estufa", "licuadora"], [
    ["frijol-negro", 150, "1 taza de frijoles cocidos"], ["tortilla-maiz", 60, "2 tortillas"], ["huevo", 100, "2 huevos"],
    ["queso-fresco", 20, "Queso fresco desmoronado"], ["cebolla", 10, "Cebolla en rodajas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Licúa la taza de frijoles cocidos con ¼ de taza de su caldo (o agua) hasta que quede una salsa espesa como atole.", "Vacíala a un sartén y caliéntala a fuego bajo 3-4 minutos, moviendo; agrega sal si le falta. Si espesa mucho, agrega un chorrito de agua.", "Calienta las tortillas en el comal hasta que estén flexibles.", "Pasa cada tortilla por la salsa de frijol hasta cubrirla y dóblala en cuatro en el plato.", "En otro sartén con unas gotas de aceite, estrella los 2 huevos 3 minutos tapados.", "Sirve las enfrijoladas con los huevos encima, queso fresco desmoronado y aros de cebolla.", "Tip: si no tienes licuadora, machaca los frijoles con un tenedor o un vaso dentro del sartén."]),
  R("chilaquiles-horneados", "Chilaquiles verdes horneados con pollo", ["desayuno", "comida"], 15, ["estufa"], [
    ["tostada-horneada", 36, "3 tostadas horneadas en trozos"], ["salsa-verde", 120, "1 taza de salsa verde"], ["pechuga-cocida", 80, "Pollo deshebrado"],
    ["crema", 15, "1 cucharada de crema"], ["queso-fresco", 15, "Un poco de queso fresco"], ["cebolla", 10, "Cebolla en rodajas"],
  ], ["Si no tienes pollo cocido, hierve la pechuga con sal y un trozo de cebolla 20 minutos y deshébrala.", "Parte las tostadas horneadas en trozos de 3-4 cm.", "Calienta la salsa verde en un sartén a fuego medio hasta que hierva y agrega el pollo; cocina 2 minutos.", "Apaga el fuego y agrega los trozos de tostada; mezcla rápido, 20-30 segundos, solo para cubrirlos.", "Sirve de inmediato para que queden crujientes por fuera.", "Termina con la crema, el queso fresco desmoronado y aros de cebolla.", "Tip: sin refri, compra la crema y el queso el mismo día o sáltatelos."]),
  R("avena-platano", "Avena con plátano y canela", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-light", 240, "1 taza de leche descremada"], ["platano", 118, "1 plátano"], ["", 0, "Canela al gusto"],
  ], ["Pon la leche y la avena en una olla chica a fuego medio.", "Cuando empiece a hervir, baja el fuego y mueve 4-5 minutos hasta que espese a tu gusto.", "En microondas: mezcla en un tazón grande y calienta 1 minuto, mueve y calienta 1 minuto más (el tazón grande evita que se derrame).", "Agrega canela al gusto y mezcla.", "Pela el plátano y rebánalo encima.", "Tip: si queda muy espesa, agrega un chorrito de leche; si la quieres más dulce, usa el plátano bien maduro en lugar de azúcar."]),
  R("avena-proteica", "Avena proteica (sin refri)", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-polvo", 21, "3 cucharadas de leche en polvo"], ["platano", 60, "½ plátano"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"], ["", 0, "1 taza de agua y canela"],
  ], ["Hierve la taza de agua en una olla chica y agrega la avena y la canela.", "Cocina a fuego bajo 4 minutos, moviendo, hasta que espese.", "Apaga el fuego y espera 1 minuto para que no esté hirviendo.", "Agrega las 3 cucharadas de leche en polvo y mueve hasta que se disuelvan sin grumos (con el fuego alto se hacen grumos).", "Sirve y termina con el plátano en rodajas y la crema de cacahuate.", "Tip: es ideal sin refri, la leche en polvo y la avena duran semanas en un frasco cerrado."]),
  R("licuado-platano-avena", "Licuado de plátano y avena", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["platano", 118, "1 plátano"], ["avena", 30, "3 cucharadas de avena"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Pon en la licuadora primero la leche, luego la avena, el plátano en trozos y la crema de cacahuate.", "Agrega 3-4 cubos de hielo si lo quieres frío.", "Licúa 40-60 segundos a velocidad alta hasta que no se sientan trozos de avena.", "Prueba: si está muy espeso agrega un poco de agua o leche y licúa 5 segundos más.", "Tómalo recién hecho; si lo dejas reposar, la avena lo espesa.", "Tip: sin refri usa leche en polvo con agua fría (3 cucharadas por taza)."]),
  R("yogur-fruta-granola", "Yogur griego con fruta y granola", ["desayuno", "colacion"], 5, ["ninguno"], [
    ["yogur-griego", 200, "1 taza de yogur griego natural"], ["papaya", 145, "1 taza de papaya"], ["granola", 30, "¼ taza de granola"],
  ], ["Pela la papaya, quítale las semillas y córtala en cubos de 2 cm.", "Sirve la taza de yogur griego en un tazón.", "Pon encima la papaya.", "Agrega la granola justo al momento de comer para que se mantenga crujiente.", "Si te gusta más dulce, una pizca de canela ayuda sin agregar azúcar.", "Tip: sin refri, compra el yogur el mismo día y cómelo en las primeras horas."]),
  R("pan-huevo-aguacate", "Pan integral con huevo y aguacate", ["desayuno", "cena"], 10, ["estufa"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["huevo", 100, "2 huevos"], ["aguacate", 50, "¼ de aguacate"],
    ["aceite", 2, "Unas gotas de aceite"], ["", 0, "Sal, limón y chile en polvo"],
  ], ["Pon agua a hervir si quieres los huevos cocidos (10 minutos para yema dura) o calienta un sartén con unas gotas de aceite para estrellarlos (3 minutos tapados).", "Machaca el ¼ de aguacate con un tenedor, sal y unas gotas de limón.", "Tuesta el pan en el comal 1-2 minutos por lado hasta que esté dorado.", "Unta el aguacate sobre el pan.", "Pon encima los huevos (estrellados enteros o cocidos en rebanadas).", "Termina con chile en polvo y un poco más de sal."]),
  R("sandwich-pavo-panela", "Sándwich de pavo y panela", ["desayuno", "cena"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["jamon-pavo", 40, "2 rebanadas de jamón de pavo"], ["queso-panela", 30, "1 rebanada de panela"],
    ["jitomate", 30, "Rodajas de jitomate"], ["lechuga", 20, "Hojas de lechuga"], ["", 0, "Mostaza al gusto"],
  ], ["Lava y seca la lechuga; rebana el jitomate delgado.", "Unta mostaza en una de las rebanadas de pan.", "Acomoda la lechuga, el jamón de pavo, la panela y el jitomate.", "Tapa con la otra rebanada y presiona suavemente.", "Si lo quieres caliente, tuéstalo en sartén a fuego medio 2 minutos por lado, presionando con la pala.", "Tip: sin refri, compra jamón y panela para el día; no aguantan fuera del frío."]),
  R("molletes-integrales", "Molletes integrales", ["desayuno", "cena"], 10, ["horno", "air fryer"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["refritos", 60, "4 cucharadas de frijoles refritos"], ["queso-oaxaca", 30, "Queso Oaxaca deshebrado"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["serrano", 3, "Chile al gusto"],
  ], ["Calienta los frijoles refritos con una cucharada de agua para que se unten fácil.", "Unta los frijoles en las 2 rebanadas de pan y pon encima el queso Oaxaca deshebrado.", "Air fryer: 180 °C por 5-6 minutos. Horno: 200 °C por 8 minutos. Sartén: tapado a fuego bajo 5 minutos.", "Están listos cuando el queso se derrite y la orilla del pan está dorada.", "Mientras, pica jitomate, cebolla y chile y mézclalos con sal (pico de gallo).", "Sirve con el pico de gallo encima."]),
  R("hotcakes-avena", "Hot cakes de avena y plátano", ["desayuno"], 15, ["estufa", "licuadora"], [
    ["avena", 40, "4 cucharadas de avena"], ["huevo", 100, "2 huevos"], ["platano", 118, "1 plátano"], ["miel", 10, "1 cucharadita de miel"],
    ["aceite", 2, "Unas gotas de aceite"], ["", 0, "Canela y polvo para hornear (opcional)"],
  ], ["Licúa las 4 cucharadas de avena, los 2 huevos, el plátano, canela y una pizca de polvo para hornear hasta que quede una mezcla lisa.", "Deja reposar la mezcla 3 minutos para que la avena se hidrate y espese un poco.", "Calienta un sartén antiadherente a fuego medio-bajo con unas gotas de aceite (pásalas con una servilleta).", "Vierte 2 cucharadas de mezcla por hot cake; hazlos chicos para que no se rompan.", "Cocina 2 minutos hasta que salgan burbujas y la orilla se vea seca; voltea y cocina 1-2 minutos más.", "Sirve con la cucharadita de miel y más plátano si quieres.", "Tip: si se queman por fuera y están crudos por dentro, baja el fuego."]),
  R("quesadillas-panela-champi", "Quesadillas de panela y champiñones", ["desayuno", "cena"], 10, ["estufa"], [
    ["tortilla-maiz", 60, "2 tortillas"], ["queso-panela", 40, "Panela en tiras"], ["champinones", 50, "Champiñones picados"], ["salsa-verde", 30, "Salsa al gusto"],
  ], ["Limpia los champiñones con un trapo húmedo y pícalos.", "Saltéalos en un sartén caliente sin aceite a fuego medio-alto 4-5 minutos, hasta que suelten su agua y se doren. Ponles sal al final.", "Corta la panela en tiras.", "Calienta las tortillas en el comal, rellénalas con panela y champiñones y dóblalas.", "Déjalas 1-2 minutos por lado a fuego medio hasta que la panela se suavice.", "Sirve con salsa al gusto."]),
  R("tacos-huevo-papa", "Tacos de huevo con papa", ["desayuno"], 15, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["papa", 100, "1 papa chica cocida en cubos"], ["tortilla-maiz", 60, "2 tortillas"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["salsa-roja", 30, "Salsa roja"], SAL,
  ], ["Si la papa está cruda, córtala en cubos de 1 cm y hiérvela 8 minutos con sal; escúrrela.", "Calienta el aceite en sartén a fuego medio y dora los cubos de papa 4-5 minutos, moviendo de vez en cuando.", "Bate los 2 huevos con sal y pimienta y viértelos sobre la papa.", "Revuelve 2 minutos hasta que cuajen.", "Calienta las tortillas en el comal.", "Arma los tacos y báñalos con salsa roja."]),
  R("huevos-rancheros", "Huevos rancheros ligeros", ["desayuno"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["tortilla-maiz", 60, "2 tortillas"], ["salsa-roja", 90, "Salsa ranchera (jitomate y chile)"],
    ["frijol-negro", 86, "½ taza de frijoles de la olla"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Para la salsa: asa en el comal 1 jitomate y 1 chile 5-6 minutos, volteando, hasta que se tatemen. Licúalos con sal y un poco de ajo.", "Calienta la salsa en un sartén chico 3 minutos.", "Calienta los frijoles de la olla.", "En un sartén con unas gotas de aceite, estrella los 2 huevos y cocínalos tapados 3 minutos.", "Calienta las tortillas, ponlas en el plato y coloca un huevo sobre cada una.", "Báñalos con la salsa caliente y sirve con los frijoles a un lado."]),

  /* ===================== COMIDAS ===================== */
  R("pechuga-arroz-verduras", "Pechuga en air fryer con arroz y verduras", ["comida"], 25, ["air fryer", "estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["arroz-rojo", 120, "¾ taza de arroz rojo"], ["calabacita", 120, "1 calabacita"],
    ["zanahoria", 60, "1 zanahoria"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal, pimienta y limón"],
  ], ["Si la pechuga es gruesa, ábrela en mariposa o aplánala para que mida unos 2 cm; así se cuece parejo.", "Sazónala con ajo picado o en polvo, sal, pimienta y el jugo de medio limón; deja reposar 5 minutos.", "Air fryer: precalienta a 190 °C 3 minutos y cocina la pechuga 16-18 minutos, volteando a la mitad.", "Revisa que por dentro ya no esté rosada (si tienes termómetro, 74 °C). Déjala reposar 3 minutos antes de cortarla para que no se seque.", "Mientras, corta la calabacita y la zanahoria en medias lunas y saltéalas en el aceite a fuego medio 5-6 minutos con sal.", "Calienta el arroz rojo y sirve todo junto.", "Sin air fryer: cocina la pechuga en sartén a fuego medio, 6-7 minutos por lado, tapada."]),
  R("tostadas-atun", "Tostadas de atún a la mexicana", ["comida", "cena"], 10, ["ninguno"], [
    ["atun-agua", 100, "1 lata de atún en agua escurrido"], ["tostada-horneada", 36, "3 tostadas horneadas"], ["jitomate", 60, "½ jitomate picado"],
    ["cebolla", 20, "Cebolla picada"], ["serrano", 6, "1 chile serrano"], ["aguacate", 50, "¼ de aguacate"], ["", 0, "Limón y sal"],
  ], ["Abre la lata de atún, escúrrela bien presionando la tapa y vacíalo en un tazón.", "Pica el jitomate y la cebolla en cubos chicos y el serrano finito.", "Mezcla el atún con jitomate, cebolla y chile, el jugo de 1 limón y sal al gusto.", "Deja reposar 2 minutos para que el limón se integre.", "Rebana el aguacate.", "Sirve el atún sobre las tostadas y ponles el aguacate encima justo al comer."]),
  R("ensalada-atun-papa", "Ensalada de atún con papa", ["comida", "cena"], 20, ["estufa"], [
    ["atun-agua", 100, "1 lata de atún"], ["papa", 150, "1 papa mediana cocida"], ["zanahoria", 50, "½ zanahoria cocida"],
    ["mayonesa", 7, "½ cucharada de mayonesa"], ["", 0, "Limón, sal y pimienta"],
  ], ["Pela la papa y la zanahoria y córtalas en cubos de 1 cm.", "Hiérvelas en agua con sal 10-12 minutos, hasta que un tenedor entre fácil pero no se deshagan.", "Escúrrelas y déjalas enfriar 5 minutos extendidas en un plato.", "Escurre el atún y desmenúzalo con un tenedor.", "Mezcla papa, zanahoria y atún con la mayonesa, el jugo de medio limón, sal y pimienta.", "Sirve tibia o a temperatura ambiente. Tip: sin refri, cómela el mismo día por la mayonesa."]),
  R("tacos-pollo", "Tacos de pollo deshebrado", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 120, "Pollo cocido deshebrado"], ["tortilla-maiz", 90, "3 tortillas"], ["cebolla", 20, "Cebolla y cilantro"],
    ["salsa-verde", 60, "Salsa verde"], ["lechuga", 30, "Lechuga picada"],
  ], ["Pon la pechuga en una olla con agua que la cubra, sal y un trozo de cebolla.", "Hierve a fuego medio 20 minutos, hasta que al partirla ya no esté rosada.", "Sácala, deja que se entibie 5 minutos y deshébrala con dos tenedores.", "Pica la cebolla, el cilantro y la lechuga.", "Calienta las tortillas en el comal hasta que se inflen un poco.", "Arma los tacos con el pollo, lechuga, cebolla, cilantro y salsa verde.", "Tip: guarda el caldo del pollo para una sopa o para hacer arroz."]),
  R("tinga-tostadas", "Tinga de pollo en tostadas", ["comida", "cena"], 25, ["estufa"], [
    ["pechuga-cocida", 120, "Pollo deshebrado"], ["jitomate", 120, "1 jitomate"], ["cebolla", 40, "½ cebolla fileteada"],
    ["tostada-horneada", 36, "3 tostadas horneadas"], ["crema", 15, "1 cucharada de crema"], ["aceite", 4.5, "1 cucharadita de aceite"],
    ["", 0, "Chipotle al gusto"],
  ], ["Si no tienes pollo deshebrado, hierve la pechuga 20 minutos con sal y cebolla y deshébrala.", "Licúa el jitomate con chipotle al gusto (1 chile es suficiente para que pique poco) y un poco de sal.", "Calienta el aceite y acitrona la cebolla fileteada a fuego medio 3 minutos, hasta que esté suave.", "Vierte el jitomate licuado y cocina 5 minutos, hasta que cambie a un rojo más oscuro.", "Agrega el pollo, mezcla y cocina 3 minutos más para que absorba la salsa.", "Sirve sobre las tostadas con un poco de crema.", "Tip: sin refri, la tinga se come el mismo día."]),
  R("bistec-mexicana", "Bistec a la mexicana con frijoles", ["comida"], 20, ["estufa"], [
    ["bistec", 120, "120 g de bistec en tiras"], ["jitomate", 80, "Jitomate picado"], ["cebolla", 30, "Cebolla picada"], ["serrano", 6, "1 serrano"],
    ["frijol-negro", 86, "½ taza de frijoles de la olla"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Corta el bistec en tiras de 1 cm y sazónalo con sal y pimienta.", "Pica el jitomate, la cebolla y el serrano.", "Calienta el aceite a fuego alto hasta que esté bien caliente y sella el bistec 2-3 minutos sin moverlo mucho, para que se dore.", "Agrega cebolla y chile y cocina 1 minuto.", "Agrega el jitomate, baja a fuego medio y cocina 5 minutos hasta que se forme una salsita.", "Calienta los frijoles y las tortillas y sirve todo junto.", "Tip: sin refri, compra la carne el mismo día y cocínala pronto."]),
  R("molida-papa-calabaza", "Carne molida con papa y calabacita", ["comida"], 25, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida"], ["papa", 100, "1 papa chica en cubos"], ["calabacita", 100, "1 calabacita en cubos"],
    ["jitomate", 60, "½ jitomate"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, comino y sal"],
  ], ["Corta la papa y la calabacita en cubos de 1 cm.", "Licúa el medio jitomate con 1 ajo, una pizca de comino, sal y ¼ de taza de agua.", "Dora la carne molida en sartén a fuego medio-alto sin aceite 5 minutos, deshaciéndola con la pala; si suelta mucha grasa, retírala.", "Agrega la papa y el jitomate licuado, mezcla, tapa y cocina a fuego bajo 10 minutos.", "Agrega la calabacita y cocina 5 minutos más, tapado, hasta que la papa esté suave.", "Calienta las tortillas y sirve."]),
  R("picadillo-arroz", "Picadillo con arroz", ["comida"], 25, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida"], ["zanahoria", 50, "½ zanahoria picada"], ["papa", 80, "½ papa picada"],
    ["jitomate", 60, "½ jitomate"], ["arroz-blanco", 100, "⅔ taza de arroz blanco"],
  ], ["Pica la zanahoria y la papa en cubos chicos (medio centímetro) para que se cuezan rápido.", "Licúa el medio jitomate con ajo, sal y ¼ de taza de agua.", "Dora la carne en sartén a fuego medio-alto 5 minutos, deshaciéndola.", "Agrega zanahoria, papa y el jitomate licuado; mezcla bien.", "Tapa y cocina a fuego bajo 12 minutos, moviendo a la mitad; si se seca, agrega un chorrito de agua.", "Está listo cuando la papa se deshace al presionarla. Sirve con el arroz caliente."]),
  R("albondigas", "Albóndigas en caldillo", ["comida"], 35, ["estufa"], [
    ["molida-90", 120, "120 g de carne molida"], ["huevo", 25, "½ huevo"], ["arroz-blanco", 40, "2 cucharadas de arroz cocido"],
    ["jitomate", 120, "1 jitomate"], ["calabacita", 80, "½ calabacita"], ["", 0, "Ajo, cebolla, hierbabuena y sal"],
  ], ["Mezcla con las manos la carne molida, el medio huevo batido, las 2 cucharadas de arroz cocido, sal y hierbabuena picada.", "Forma albóndigas del tamaño de una nuez (salen 6-7); mojarte las manos ayuda a que no se peguen.", "Licúa el jitomate con 1 ajo, un trozo de cebolla, sal y 2 tazas de agua.", "Hierve el caldillo en una olla 5 minutos.", "Baja el fuego a medio y mete las albóndigas una por una; no las muevas los primeros 5 minutos para que no se desbaraten.", "Cocina tapado 15 minutos, agrega la calabacita en cubos y cocina 5 minutos más.", "Prueba la sal del caldillo y sirve caliente."]),
  R("sopa-lentejas", "Sopa de lentejas", ["comida", "cena"], 35, ["estufa"], [
    ["lentejas", 200, "1 taza de lentejas cocidas"], ["jitomate", 60, "½ jitomate"], ["zanahoria", 50, "½ zanahoria"], ["cebolla", 20, "Cebolla"],
    ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo y sal"],
  ], ["Si las lentejas son crudas, enjuágalas y hiérvelas en 3 tazas de agua 25 minutos; las de lata o ya cocidas solo se calientan.", "Pica la zanahoria en cubos y agrégala a las lentejas los últimos 10 minutos.", "Licúa el medio jitomate con 1 ajo, un trozo de cebolla y sal.", "Agrega el jitomate licuado a las lentejas y hierve 5 minutos más.", "Prueba y ajusta la sal; si está muy espesa, agrega agua caliente.", "Sirve con las tortillas calientes."]),
  R("frijoles-charros", "Frijoles charros ligeros", ["comida"], 25, ["estufa"], [
    ["frijol-bayo", 172, "1 taza de frijoles bayos cocidos"], ["salchicha-pavo", 45, "1 salchicha de pavo"], ["jitomate", 60, "½ jitomate"],
    ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"], ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Pica la salchicha de pavo en rodajas, la cebolla, el jitomate y el serrano.", "En una olla a fuego medio sofríe la salchicha 2 minutos hasta dorar (suelta su propia grasa).", "Agrega cebolla y chile 1 minuto y luego el jitomate 3 minutos.", "Agrega los frijoles bayos con su caldo (si les falta caldo, agrega ½ taza de agua).", "Hierve a fuego bajo 10 minutos para que se mezclen los sabores; ajusta la sal.", "Sirve en plato hondo con tortillas calientes."]),
  R("pescado-empapelado", "Pescado empapelado con verduras", ["comida"], 25, ["horno", "air fryer", "estufa"], [
    ["tilapia", 150, "1 filete de tilapia"], ["calabacita", 100, "Calabacita en rodajas"], ["zanahoria", 50, "Zanahoria en tiras"],
    ["jitomate", 60, "Jitomate en rodajas"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["", 0, "Ajo, limón, sal y orégano"],
  ], ["Corta un cuadro de papel aluminio de 30 cm y pon encima el filete de tilapia.", "Sazona con ajo picado, sal, orégano y el jugo de medio limón.", "Cubre con las rodajas de calabacita, las tiras de zanahoria y el jitomate.", "Cierra el papel como sobre, doblando bien las orillas para que no salga el vapor.", "Horno o air fryer a 190 °C por 15 minutos; en sartén, tapado a fuego medio-bajo 15 minutos.", "Abre con cuidado (sale vapor muy caliente): el pescado está listo cuando se deshace en hojuelas con un tenedor.", "Sirve con el arroz. Tip: sin refri, compra el pescado el mismo día."]),
  R("caldo-pollo", "Caldo de pollo con verduras", ["comida"], 45, ["estufa"], [
    ["muslo", 180, "2 piezas de pierna/muslo sin piel"], ["papa", 100, "1 papa"], ["zanahoria", 60, "1 zanahoria"], ["calabacita", 100, "1 calabacita"],
    ["arroz-blanco", 60, "⅓ taza de arroz"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla, cilantro y limón"],
  ], ["Pon las piezas de pollo sin piel en una olla con 6 tazas de agua, 2 ajos, un trozo de cebolla y sal.", "Hierve a fuego medio 25 minutos, quitando con una cuchara la espuma que sale arriba.", "Pela y corta la papa y la zanahoria en trozos grandes; agrégalas y cocina 10 minutos.", "Agrega la calabacita en trozos y cocina 5 minutos más.", "Mientras, calienta el arroz (o cuécelo aparte).", "Sirve el caldo con arroz, cilantro picado, limón y tortillas calientes.", "Tip: sin refri, hierve el caldo que sobre antes de dormir para que aguante al día siguiente."]),
  R("pasta-atun", "Pasta con atún y espinaca", ["comida"], 20, ["estufa"], [
    ["pasta", 140, "1 taza de pasta cocida"], ["atun-agua", 100, "1 lata de atún"], ["jitomate", 60, "½ jitomate picado"],
    ["espinaca", 30, "1 taza de espinaca"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal y pimienta"],
  ], ["Hierve agua con sal en una olla y cuece la pasta el tiempo que diga el paquete (normalmente 8-10 minutos), hasta que esté suave pero firme.", "Antes de escurrirla, guarda ¼ de taza del agua de cocción.", "En un sartén con el aceite a fuego medio, sofríe 1 ajo picado 30 segundos (sin que se queme).", "Agrega el jitomate picado 2 minutos y luego la espinaca 1 minuto, hasta que se marchite.", "Agrega el atún escurrido y la pasta; mezcla 1 minuto.", "Si se ve seca, agrega un poco del agua de la pasta. Sazona con sal y pimienta y sirve."]),
  R("enchiladas-horneadas", "Enchiladas verdes de pollo", ["comida"], 25, ["estufa", "horno"], [
    ["tortilla-maiz", 90, "3 tortillas"], ["pechuga-cocida", 90, "Pollo deshebrado"], ["salsa-verde", 120, "1 taza de salsa verde"],
    ["queso-fresco", 20, "Queso fresco"], ["crema", 15, "1 cucharada de crema"], ["cebolla", 10, "Cebolla"],
  ], ["Si no tienes pollo deshebrado, hierve la pechuga 20 minutos con sal y cebolla y deshébrala.", "Calienta la salsa verde en un sartén hasta que hierva y baja a fuego bajo.", "Calienta las tortillas en el comal hasta que estén flexibles (así no se rompen al enrollar).", "Rellena cada tortilla con pollo y enróllala; acomódalas en el plato con la unión hacia abajo.", "Báñalas con la salsa caliente.", "Termina con queso fresco, crema y aros de cebolla. Si quieres gratinar: 5 minutos en horno a 200 °C antes de la crema.", "Tip: sin refri, compra crema y queso el mismo día."]),
  R("pollo-nopales", "Pollo con nopales y frijoles", ["comida"], 25, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en tiras"], ["nopales", 150, "1 taza de nopales"], ["frijol-negro", 86, "½ taza de frijoles"],
    ["tortilla-maiz", 60, "2 tortillas"], ["salsa-verde", 60, "Salsa verde"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Corta la pechuga en tiras de 1 cm y sazónala con sal y pimienta.", "Si los nopales son crudos, córtalos en tiras y ásalos en el comal 5-6 minutos por lado hasta que cambien a verde oscuro y se les seque la baba.", "Calienta el aceite en sartén a fuego medio-alto y cocina el pollo 6-7 minutos, moviendo, hasta que ya no esté rosado por dentro.", "Agrega los nopales y ¼ de taza de salsa verde; cocina 3 minutos para que se mezclen.", "Calienta los frijoles y las tortillas.", "Sirve el pollo con nopales, los frijoles a un lado y más salsa si te gusta."]),
  R("huevos-ahogados", "Huevos ahogados en salsa", ["comida", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["salsa-roja", 120, "Salsa de jitomate y chile"], ["frijol-negro", 86, "½ taza de frijoles"], ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Haz la salsa: asa 1 jitomate y 1 chile en el comal 5-6 minutos hasta tatemar y licúalos con ajo, sal y ½ taza de agua.", "Vierte la salsa en un sartén hondo y caliéntala a fuego medio hasta que hierva suave.", "Rompe cada huevo en una taza y deslízalo con cuidado sobre la salsa, separados entre sí.", "Tapa y cocina a fuego bajo 5-6 minutos: la clara debe quedar blanca y firme, la yema todavía suave.", "Si quieres la yema cocida, déjalos 2-3 minutos más.", "Sirve en plato hondo con la salsa, los frijoles calientes y tortillas."]),
  R("tacos-bistec-nopales", "Tacos de bistec con nopales", ["comida", "cena"], 15, ["estufa"], [
    ["bistec", 100, "100 g de bistec"], ["nopales", 100, "Nopales asados"], ["tortilla-maiz", 90, "3 tortillas"],
    ["salsa-roja", 30, "Salsa"], ["cebolla", 15, "Cebolla y cilantro"], ["", 0, "Limón y sal"],
  ], ["Sazona el bistec con sal y pimienta.", "Asa los nopales en el comal caliente 5-6 minutos por lado; córtalos en tiras.", "En el mismo comal a fuego alto, asa el bistec 2-3 minutos por lado (si es delgado, menos).", "Déjalo reposar 2 minutos y pícalo en cuadritos.", "Calienta las tortillas en el comal.", "Arma los tacos con bistec, nopales, cebolla y cilantro picados, salsa y limón.", "Tip: sin refri, compra el bistec el mismo día."]),
  R("chuleta-ensalada", "Chuleta de cerdo con papa y ensalada", ["comida"], 25, ["air fryer", "estufa"], [
    ["chuleta", 120, "1 chuleta"], ["papa-airfryer", 150, "1 papa en gajos"], ["lechuga", 50, "Lechuga"], ["jitomate", 60, "Jitomate"],
    ["pepino", 50, "Pepino"], ["", 0, "Ajo, sal, limón"],
  ], ["Corta la papa con cáscara en gajos, sécalos con una servilleta y sazónalos con sal, pimienta y ajo en polvo.", "Air fryer: papas a 200 °C por 18-20 minutos, agitando la canasta a la mitad.", "Sazona la chuleta con ajo, sal y limón.", "Air fryer: chuleta a 190 °C por 12-14 minutos volteándola a la mitad (en sartén: 5-6 minutos por lado a fuego medio). Por dentro debe quedar blanca o apenas rosada en el centro.", "Mientras, lava y corta la lechuga, el jitomate y el pepino; aliña con limón y sal.", "Sirve la chuleta con las papas y la ensalada.", "Tip: sin refri, compra la chuleta el mismo día."]),
  R("camarones-diabla", "Camarones a la diabla con arroz", ["comida"], 20, ["estufa"], [
    ["camaron", 150, "150 g de camarón"], ["salsa-roja", 60, "Salsa de chile guajillo y jitomate"], ["arroz-blanco", 120, "¾ taza de arroz"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo y sal"],
  ], ["Limpia los camarones: quítales la cáscara y la vena del lomo, enjuágalos y sécalos.", "Para la salsa: desvena 2 chiles guajillo, ásalos 20 segundos por lado en el comal (si se queman amargan), remójalos en agua caliente 5 minutos y licúalos con 1 jitomate, ajo y sal.", "Calienta el aceite en sartén a fuego medio, vierte la salsa colada y cocina 5 minutos hasta que espese.", "Agrega los camarones y cocina 3-4 minutos, solo hasta que se pongan rosados y curvos en forma de C.", "No los cocines de más o quedan duros como hule.", "Sirve con el arroz caliente.", "Tip: sin refri, compra el camarón el mismo día y cocínalo pronto."]),
  R("ensalada-pollo", "Ensalada de pollo con aguacate", ["comida", "cena"], 15, ["estufa", "air fryer"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["lechuga", 80, "Lechuga"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"],
    ["aguacate", 50, "¼ de aguacate"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, sal y pimienta"],
  ], ["Sazona la pechuga con sal, pimienta y limón.", "Air fryer: 190 °C por 16-18 minutos volteando a la mitad. Sartén: 6-7 minutos por lado a fuego medio, tapado. Por dentro no debe quedar rosada.", "Déjala reposar 3 minutos y córtala en tiras.", "Lava y desinfecta la lechuga; córtala junto con el jitomate y el pepino.", "Rebana el aguacate al final para que no se oscurezca.", "Sirve la lechuga, encima las verduras, el pollo y el aguacate; aliña con limón, sal y pimienta.", "Acompaña con las tostadas partidas como crutones."]),
  R("sardinas-mexicana", "Sardinas a la mexicana con tostadas", ["comida", "cena"], 10, ["ninguno"], [
    ["sardina", 100, "½ lata de sardina en tomate"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tostada-horneada", 36, "3 tostadas"], ["", 0, "Limón"],
  ], ["Abre la lata y separa media lata de sardinas con un poco de su salsa de tomate.", "Quítales la espina central si no te gusta (es comestible y aporta calcio).", "Pica el jitomate, la cebolla y el serrano finito.", "Desmenuza las sardinas con un tenedor y mézclalas con la verdura, el jugo de 1 limón y sal.", "Sirve sobre las tostadas.", "Tip: la otra media lata pásala a un frasco con tapa; sin refri, cómela el mismo día."]),
  R("arroz-huevo-verduras", "Arroz frito con huevo y verduras", ["comida", "cena"], 15, ["estufa"], [
    ["arroz-blanco", 150, "1 taza de arroz cocido"], ["huevo", 100, "2 huevos"], ["zanahoria", 50, "Zanahoria picada"],
    ["calabacita", 60, "Calabacita picada"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Salsa de soya o sal"],
  ], ["Usa arroz cocido del día anterior o bien frío: el arroz recién hecho se apelmaza.", "Pica la zanahoria y la calabacita en cubos chicos.", "Bate los 2 huevos con una pizca de sal.", "Calienta el aceite en sartén a fuego alto, saltea la zanahoria 2 minutos y la calabacita 1 minuto.", "Empuja las verduras a un lado, vierte el huevo en el espacio libre y revuélvelo hasta que cuaje.", "Agrega el arroz y mezcla todo 3 minutos a fuego alto, aplanándolo para que se dore un poco.", "Sazona con salsa de soya (1 cucharada) o sal y sirve."]),

  /* ===================== CENAS ===================== */
  R("tostadas-pollo", "Tostadas de pollo", ["cena", "comida"], 10, ["ninguno"], [
    ["pechuga-cocida", 90, "Pollo deshebrado"], ["tostada-horneada", 36, "3 tostadas"], ["refritos", 40, "Frijoles refritos"],
    ["lechuga", 30, "Lechuga"], ["salsa-verde", 30, "Salsa"], ["crema", 10, "Un poco de crema"],
  ], ["Si no tienes pollo deshebrado, hierve la pechuga 20 minutos con sal y cebolla y deshébrala.", "Calienta los frijoles refritos con una cucharada de agua.", "Lava y pica la lechuga finita.", "Unta frijoles en cada tostada.", "Pon encima el pollo, la lechuga, salsa y un poco de crema.", "Cómelas recién armadas para que no se aguaden."]),
  R("quesadillas-pollo", "Quesadillas de pollo y champiñón", ["cena"], 10, ["estufa"], [
    ["tortilla-maiz", 60, "2 tortillas"], ["pechuga-cocida", 60, "Pollo deshebrado"], ["queso-oaxaca", 30, "Queso Oaxaca"],
    ["champinones", 40, "Champiñones"], ["salsa-roja", 30, "Salsa"],
  ], ["Limpia y pica los champiñones; saltéalos en sartén caliente sin aceite 4-5 minutos hasta que se doren y se seque su jugo. Sal al final.", "Deshebra el queso Oaxaca.", "Calienta las tortillas en el comal a fuego medio.", "Pon queso, pollo y champiñones en media tortilla y dóblala.", "Cocina 1-2 minutos por lado, hasta que el queso se derrita y la tortilla esté doradita.", "Sirve con salsa."]),
  R("sandwich-atun", "Sándwich de atún", ["cena", "comida"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["atun-agua", 100, "1 lata de atún"], ["mayonesa", 7, "½ cucharada de mayonesa"],
    ["lechuga", 20, "Lechuga"], ["jitomate", 30, "Jitomate"], ["", 0, "Limón y pimienta"],
  ], ["Escurre bien el atún presionando la tapa de la lata.", "Mézclalo con la media cucharada de mayonesa, unas gotas de limón y pimienta.", "Lava la lechuga y rebana el jitomate.", "Tuesta el pan si te gusta crujiente (1-2 minutos por lado en el comal).", "Arma: pan, lechuga, atún, jitomate y pan.", "Tip: sin refri, cómelo en las primeras 2 horas por la mayonesa."]),
  R("huevo-jamon", "Huevos revueltos con jamón", ["cena", "desayuno"], 8, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["jamon-pavo", 40, "2 rebanadas de jamón de pavo"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Pica el jamón de pavo en cuadritos.", "Bate los 2 huevos con una pizca de sal (el jamón ya es salado, no te pases).", "Calienta unas gotas de aceite en sartén a fuego medio y dora el jamón 1 minuto.", "Agrega el huevo y revuelve 2 minutos hasta que cuaje pero siga jugoso.", "Calienta las tortillas.", "Sirve con salsa si te gusta."]),
  R("sincronizadas", "Sincronizadas de jamón y queso", ["cena"], 8, ["estufa"], [
    ["tortilla-harina", 90, "2 tortillas de harina"], ["jamon-pavo", 40, "2 rebanadas de jamón"], ["queso-oaxaca", 30, "Queso Oaxaca"],
    ["aguacate", 30, "Un poco de aguacate"],
  ], ["Deshebra el queso Oaxaca.", "Pon una tortilla de harina en el comal a fuego medio-bajo.", "Acomoda la mitad del queso, el jamón y el resto del queso, y tapa con la otra tortilla.", "Cocina 2 minutos, voltea con cuidado y cocina 2 minutos más, hasta que el queso se derrita y esté doradita.", "Córtala en 4 triángulos.", "Sirve con el aguacate en rebanadas o machacado con sal."]),
  R("wrap-pollo", "Wrap de pollo", ["cena", "comida"], 10, ["ninguno"], [
    ["tortilla-harina", 45, "1 tortilla de harina"], ["pechuga-cocida", 90, "Pollo en tiras"], ["lechuga", 30, "Lechuga"],
    ["jitomate", 30, "Jitomate"], ["yogur-griego", 30, "2 cucharadas de yogur griego como aderezo"], ["", 0, "Limón y pimienta"],
  ], ["Si el pollo no está cocido, sazónalo y cocínalo en sartén 6-7 minutos por lado o en air fryer a 190 °C por 16 minutos; córtalo en tiras.", "Mezcla las 2 cucharadas de yogur griego con unas gotas de limón, sal y pimienta (este es el aderezo).", "Calienta la tortilla de harina 20 segundos por lado para que no se rompa al enrollar.", "Unta el aderezo al centro y pon lechuga, jitomate y el pollo.", "Dobla los lados hacia adentro y enrolla apretando.", "Córtalo a la mitad en diagonal. Tip: sin refri, compra el yogur el mismo día."]),
  R("calabacitas-panela", "Calabacitas a la mexicana con panela", ["cena", "comida"], 15, ["estufa"], [
    ["calabacita", 200, "2 calabacitas"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["queso-panela", 60, "2 rebanadas de panela"],
    ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Corta las calabacitas en cubos de 1 cm; pica el jitomate y la cebolla.", "Calienta el aceite en sartén a fuego medio y sofríe la cebolla 1 minuto.", "Agrega el jitomate y cocina 2 minutos.", "Agrega las calabacitas, sal, tapa y cocina 6-8 minutos, hasta que estén suaves pero no aguadas.", "Corta la panela en cubos y agrégala al final, solo para que se caliente (1 minuto).", "Sirve con tortillas calientes."]),
  R("ensalada-garbanzo-atun", "Ensalada de garbanzo y atún", ["cena", "comida"], 10, ["ninguno"], [
    ["garbanzos", 100, "½ taza de garbanzos cocidos"], ["atun-agua", 100, "1 lata de atún"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"],
    ["aceite", 4.5, "1 cucharadita de aceite de oliva"], ["", 0, "Limón y sal"],
  ], ["Si los garbanzos son de lata, enjuágalos con agua para quitar el exceso de sal.", "Escurre el atún.", "Pica el jitomate y el pepino en cubos de 1 cm.", "Mezcla garbanzos, atún, jitomate y pepino en un tazón.", "Aliña con la cucharadita de aceite de oliva, el jugo de 1 limón y sal.", "Deja reposar 5 minutos para que tome sabor y sirve."]),
  R("huevo-cocido-aguacate", "Huevos cocidos con aguacate y tostadas", ["cena", "desayuno"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos cocidos"], ["aguacate", 50, "¼ de aguacate"], ["tostada-horneada", 24, "2 tostadas"],
    ["jitomate", 40, "Jitomate"], ["cebolla", 10, "Cebolla"],
  ], ["Pon los 2 huevos en una olla, cúbrelos con agua fría y llévalos a hervor.", "Desde que hierve, cuenta 10 minutos para yema dura (7 minutos si la quieres cremosa).", "Pásalos a agua fría 2 minutos: así se pelan fácil y la yema no se pone verde.", "Pica jitomate y cebolla con sal; rebana el aguacate.", "Pela los huevos y córtalos en rebanadas.", "Arma las tostadas con huevo, aguacate y la salsita de jitomate."]),
  R("tacos-frijol-nopal", "Tacos de frijol con nopales", ["cena", "comida"], 15, ["estufa"], [
    ["refritos", 90, "Frijoles refritos"], ["nopales", 100, "Nopales asados"], ["tortilla-maiz", 90, "3 tortillas"],
    ["queso-fresco", 20, "Queso fresco"], ["salsa-verde", 30, "Salsa"],
  ], ["Asa los nopales en el comal caliente 5-6 minutos por lado, hasta que se vean secos y verde oscuro; córtalos en tiras y ponles sal.", "Calienta los frijoles refritos con una cucharada de agua.", "Calienta las tortillas en el comal.", "Unta frijoles en cada tortilla y pon encima los nopales.", "Termina con queso fresco desmoronado y salsa.", "Tip: sin refri, compra el queso el mismo día o sáltatelo."]),
  R("licuado-proteina", "Licuado de proteína casero", ["cena", "colacion", "desayuno"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["leche-polvo", 21, "3 cucharadas de leche en polvo"], ["platano", 118, "1 plátano"],
    ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Pon la leche en la licuadora y agrega las 3 cucharadas de leche en polvo.", "Licúa 10 segundos para disolver la leche en polvo antes de lo demás (así no quedan grumos).", "Agrega el plátano en trozos y la crema de cacahuate.", "Agrega hielo si lo quieres frío y licúa 30-40 segundos.", "Tómalo recién hecho.", "Tip: es buena opción después del gym; la leche en polvo suma proteína sin necesitar refri."]),
  R("sopa-verduras-pollo", "Sopa de verduras con pollo", ["cena", "comida"], 30, ["estufa"], [
    ["pechuga-cocida", 90, "Pollo deshebrado"], ["calabacita", 100, "Calabacita"], ["zanahoria", 50, "Zanahoria"], ["papa", 80, "½ papa"],
    ["jitomate", 60, "Jitomate licuado"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Pica la calabacita, la zanahoria y la media papa en cubos de 1 cm.", "Licúa 1 jitomate con ajo, un trozo de cebolla, sal y 3 tazas de agua.", "Vierte el caldo de jitomate en una olla y hierve 5 minutos.", "Agrega la papa y la zanahoria y cocina a fuego medio 10 minutos.", "Agrega la calabacita y el pollo deshebrado y cocina 5 minutos más.", "Prueba la sal y sirve caliente con limón."]),
  R("tostadas-frijol-queso", "Tostadas de frijol con queso", ["cena", "colacion"], 5, ["ninguno"], [
    ["tostada-horneada", 24, "2 tostadas"], ["refritos", 60, "Frijoles refritos"], ["queso-fresco", 20, "Queso fresco"],
    ["lechuga", 20, "Lechuga"], ["salsa-roja", 20, "Salsa"],
  ], ["Calienta los frijoles refritos con una cucharada de agua para que se unten fácil.", "Lava y pica la lechuga.", "Unta los frijoles en las tostadas.", "Pon encima lechuga y queso fresco desmoronado.", "Termina con salsa.", "Cómelas al momento para que sigan crujientes."]),
  R("atun-pepino", "Atún con pepino y limón", ["cena", "colacion"], 5, ["ninguno"], [
    ["atun-agua", 100, "1 lata de atún"], ["pepino", 150, "1 pepino en cubos"], ["tostada-horneada", 12, "1 tostada"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Escurre bien la lata de atún.", "Pela el pepino si la cáscara está dura y córtalo en cubos.", "Mezcla atún y pepino con el jugo de 1 limón, sal y chile en polvo.", "Deja reposar 2 minutos para que el limón se integre.", "Sirve con la tostada.", "Tip: es una colación alta en proteína y no necesita refri."]),

  /* ===================== COLACIONES ===================== */
  R("manzana-cacahuate", "Manzana con crema de cacahuate", ["colacion"], 2, ["ninguno"], [
    ["manzana", 180, "1 manzana"], ["crema-cacahuate", 16, "1 cucharada de crema de cacahuate"],
  ], ["Lava la manzana y córtala en gajos, quitándole el centro con las semillas.", "Pon la cucharada de crema de cacahuate en un platito.", "Unta cada gajo o sumérgelo en la crema.", "Si la crema está muy dura, mézclala con unas gotas de agua tibia.", "Cómela al momento para que la manzana no se oxide (o ponle unas gotas de limón)."]),
  R("yogur-miel", "Yogur griego con miel", ["colacion"], 2, ["ninguno"], [
    ["yogur-griego", 150, "1 vasito de yogur griego"], ["miel", 10, "1 cucharadita de miel"], ["", 0, "Canela"],
  ], ["Sirve el vasito de yogur griego en un tazón.", "Agrega la cucharadita de miel en hilo.", "Espolvorea canela al gusto.", "Mezcla un poco o cómelo así para que cada cucharada tenga su toque de miel.", "Tip: sin refri, compra el yogur el mismo día."]),
  R("pepino-zanahoria", "Pepino y zanahoria con limón y chile", ["colacion"], 5, ["ninguno"], [
    ["pepino", 150, "1 pepino"], ["zanahoria", 60, "1 zanahoria"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Lava el pepino y la zanahoria; pela la zanahoria.", "Córtalos en bastones del tamaño de un dedo.", "Acomódalos en un vaso o tazón.", "Exprime 1 limón encima y agrega sal y chile en polvo.", "Mezcla bien y cómelos al momento."]),
  R("punado-cacahuates", "Puño de cacahuates", ["colacion"], 1, ["ninguno"], [
    ["cacahuates", 30, "1 puño (30 g) de cacahuates naturales"],
  ], ["Mide un puño (unos 30 g): es más fácil pasarse si comes directo de la bolsa.", "Sírvelos en un platito o bolsita.", "Si te gustan con sabor, agrega limón y chile en polvo.", "Prefiere cacahuates naturales o tostados sin sal; los japoneses o enchilados de bolsa llevan harina y más grasa."]),
  R("huevos-cocidos", "Huevos cocidos", ["colacion"], 12, ["estufa"], [
    ["huevo", 100, "2 huevos"], ["", 0, "Sal y chile en polvo"],
  ], ["Pon los 2 huevos en una olla y cúbrelos con agua fría (2 cm por encima).", "Calienta a fuego alto hasta que hierva.", "Desde que hierve, cuenta 10 minutos para yema dura o 7 para yema cremosa.", "Pásalos a un tazón con agua fría 2 minutos para cortar la cocción.", "Pélalos bajo el chorro del agua empezando por la parte ancha.", "Sírvelos con sal y chile en polvo. Tip: cocidos y con cáscara aguantan 1 día sin refri."]),
  R("platano-cacahuates", "Plátano con cacahuates", ["colacion"], 1, ["ninguno"], [
    ["platano", 118, "1 plátano"], ["cacahuates", 15, "½ puño de cacahuates"],
  ], ["Pela el plátano.", "Rebánalo o cómelo entero.", "Mide medio puño de cacahuates (unos 15 g).", "Combínalos en el plato: el plátano da energía rápida y el cacahuate grasa buena que te deja satisfecho.", "Ideal antes del gym o como colación de media mañana."]),
  R("palomitas-naturales", "Palomitas naturales", ["colacion"], 5, ["estufa", "microondas"], [
    ["palomitas", 24, "3 tazas de palomitas"], ["", 0, "Sal, limón y chile en polvo"],
  ], ["Estufa: pon 2 cucharadas de maíz palomero en una olla con tapa, a fuego medio, con 1 cucharadita de aceite o sin aceite si es antiadherente.", "Cuando empiecen a reventar, mueve la olla de vez en cuando sin destapar.", "Apaga cuando pasen 3 segundos entre cada reventón (si esperas más, se queman).", "Microondas: maíz en una bolsa de papel de estraza bien doblada, 2-3 minutos hasta que los reventones se espacien.", "Sirve 3 tazas y sazona con sal, limón y chile en polvo.", "Evita las de microondas con mantequilla: tienen mucha más grasa."]),
  R("papaya-yogur", "Papaya con yogur", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["papaya", 145, "1 taza de papaya"], ["yogur", 125, "1 vasito de yogur natural"],
  ], ["Pela la papaya, quítale las semillas y córtala en cubos.", "Mide 1 taza.", "Sirve en un tazón y agrega el vasito de yogur natural encima.", "Opcional: unas gotas de limón o canela.", "Tip: sin refri, compra el yogur el mismo día; la papaya picada cómela en el día."]),

  /* ===================== NUEVAS: DESAYUNOS ===================== */
  R("molletes-bolillo", "Molletes de bolillo con pico de gallo", ["desayuno", "cena"], 12, ["horno", "air fryer"], [
    ["bolillo", 70, "1 bolillo sin migajón"], ["refritos", 60, "4 cucharadas de frijoles refritos (de bolsa)"], ["queso-chihuahua", 30, "Queso manchego rallado"],
    ["jitomate", 40, "Jitomate picado"], ["cebolla", 10, "Cebolla picada"], ["serrano", 3, "Chile al gusto"],
  ], ["Parte el bolillo a la mitad a lo largo y quítale el migajón con los dedos (así tiene menos calorías y se dora mejor).", "Calienta los frijoles de bolsa con una cucharada de agua.", "Unta los frijoles en cada mitad y pon encima el queso manchego rallado.", "Air fryer: 180 °C por 5-6 minutos. Horno: 200 °C por 8 minutos. Sartén tapado a fuego bajo: 6 minutos.", "Mientras, pica jitomate, cebolla y chile con sal para el pico de gallo.", "Sirve los molletes con el pico de gallo encima."]),
  R("huevo-rajas", "Huevos con rajas de poblano", ["desayuno", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["poblano", 100, "1 chile poblano asado en rajas"], ["cebolla", 20, "Cebolla fileteada"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Asa el poblano directo en la flama o en el comal, volteándolo, hasta que la piel esté negra (6-8 minutos).", "Mételo en una bolsa de plástico cerrada 5 minutos para que sude; así la piel se quita fácil.", "Pélalo, quítale semillas y venas y córtalo en tiras (rajas).", "Calienta el aceite a fuego medio y sofríe la cebolla fileteada 2 minutos, agrega las rajas 2 minutos más.", "Agrega los 3 huevos batidos con sal y pimienta y revuelve 2 minutos hasta que cuajen.", "Sirve con tortillas calientes."]),
  R("chilaquiles-rojos-huevo", "Chilaquiles rojos con huevo", ["desayuno"], 15, ["estufa"], [
    ["tostada-horneada", 36, "3 tostadas horneadas en trozos"], ["salsa-roja", 120, "1 taza de salsa roja"], ["huevo", 100, "2 huevos estrellados"],
    ["queso-fresco", 15, "Queso fresco"], ["crema", 10, "Un poco de crema"], ["cebolla", 10, "Cebolla en rodajas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Haz la salsa roja: asa 2 jitomates y 1-2 chiles en el comal hasta tatemar, licúa con ajo y sal.", "Calienta la salsa en un sartén hasta que hierva.", "En otro sartén con unas gotas de aceite, estrella los 2 huevos 3 minutos tapados.", "Apaga el fuego de la salsa, agrega los trozos de tostada y mezcla 20-30 segundos para que se cubran sin aguadarse.", "Sirve los chilaquiles, encima los huevos, el queso fresco, la crema y la cebolla en rodajas.", "Tip: sin refri, compra crema y queso el mismo día."]),
  R("avena-manzana-nuez", "Avena con manzana y nuez", ["desayuno"], 8, ["estufa", "microondas"], [
    ["avena", 50, "½ taza de avena"], ["leche-light", 240, "1 taza de leche descremada"], ["manzana", 90, "½ manzana picada"],
    ["nueces", 10, "Unas nueces picadas"], ["", 0, "Canela al gusto"],
  ], ["Pica la media manzana en cubos chicos (con cáscara tiene más fibra) y las nueces.", "Pon la leche, la avena y la manzana en una olla chica a fuego medio.", "Cuando hierva, baja el fuego y mueve 4-5 minutos hasta que espese; la manzana se suaviza un poco.", "Microondas: todo en un tazón grande, 1 minuto, mueve, y 1 minuto más.", "Agrega canela y mezcla.", "Sirve con las nueces encima para que se mantengan crujientes."]),
  R("avena-fria-durazno", "Avena fría con durazno", ["desayuno"], 5, ["ninguno"], [
    ["avena", 40, "4 cucharadas de avena"], ["leche-light", 200, "¾ taza de leche descremada"], ["durazno", 150, "1 durazno picado"],
    ["chia", 6, "½ cucharada de chía"], ["", 0, "Canela"],
  ], ["En un frasco o vaso mezcla las 4 cucharadas de avena, la leche, la chía y canela.", "Mueve bien para que la chía no se haga bolitas.", "Deja reposar al menos 15 minutos (o desde la noche anterior si tienes refri) para que la avena y la chía se hidraten y espese.", "Vuelve a mover a los 5 minutos de haberla hecho.", "Pica el durazno y ponlo encima al momento de comer.", "Tip: sin refri, prepárala con leche en polvo y agua y cómela el mismo día."]),
  R("tostadas-requeson", "Tostadas de requesón con jitomate", ["desayuno", "cena"], 5, ["ninguno"], [
    ["tostada-horneada", 36, "3 tostadas horneadas"], ["requeson", 80, "4 cucharadas de requesón"], ["jitomate", 40, "Jitomate picado"],
    ["aguacate", 30, "Un poco de aguacate"], ["", 0, "Sal, orégano y chile"],
  ], ["Pica el jitomate en cubos chicos y mézclalo con sal y orégano.", "Machaca el aguacate con un tenedor.", "Unta el requesón sobre las tostadas (1 cucharada y un poco por tostada).", "Pon encima el jitomate y un poco de aguacate.", "Termina con chile en polvo o salsa.", "Tip: sin refri, compra el requesón el mismo día."]),
  R("pan-requeson-fresas", "Pan integral con requesón, fresas y miel", ["desayuno"], 5, ["ninguno"], [
    ["pan-integral", 56, "2 rebanadas de pan integral"], ["requeson", 60, "3 cucharadas de requesón"], ["fresas", 100, "Fresas rebanadas"],
    ["miel", 7, "Un hilo de miel"],
  ], ["Lava las fresas, quítales el rabito y rebánalas.", "Tuesta el pan en el comal 1-2 minutos por lado.", "Unta el requesón sobre el pan.", "Acomoda las fresas encima.", "Termina con un hilo de miel (con media cucharadita basta).", "Tip: sin refri, compra el requesón y las fresas para el día."]),
  R("licuado-fresa-avena", "Licuado de fresa con avena", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["fresas", 150, "1 taza de fresas"], ["avena", 30, "3 cucharadas de avena"],
    ["chia", 6, "½ cucharada de chía"],
  ], ["Lava las fresas y quítales el rabito.", "Pon en la licuadora la leche, las fresas, la avena y la chía.", "Agrega 3-4 hielos si lo quieres frío.", "Licúa 40-60 segundos hasta que esté cremoso.", "Tómalo de inmediato: la chía lo espesa con el tiempo.", "Tip: las fresas congeladas sirven igual y lo dejan frío sin hielo."]),
  R("licuado-mamey", "Licuado de mamey", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["mamey", 85, "¼ de mamey"], ["avena", 20, "2 cucharadas de avena"], ["", 0, "Canela"],
  ], ["Parte el mamey, quítale el hueso y saca la pulpa de ¼ de mamey con una cuchara.", "Pon en la licuadora la leche, el mamey, la avena y canela.", "Licúa 40 segundos hasta que esté terso.", "Si queda muy espeso, agrega un poco de agua o leche.", "Tómalo recién hecho.", "Tip: el mamey ya es muy dulce, no necesita azúcar."]),
  R("licuado-guayaba", "Licuado de guayaba", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["guayaba", 110, "2 guayabas"], ["avena", 20, "2 cucharadas de avena"],
  ], ["Lava las guayabas y córtalas en cuartos (puedes dejarles la cáscara).", "Licúa primero las guayabas con la mitad de la leche 30 segundos.", "Cuela si no te gustan las semillitas.", "Regresa a la licuadora con el resto de la leche y la avena y licúa 30 segundos más.", "Agrega hielo si lo quieres frío.", "Tómalo de inmediato. La guayaba tiene mucha vitamina C."]),
  R("licuado-zarzamora", "Licuado de zarzamora", ["desayuno", "colacion"], 5, ["licuadora"], [
    ["leche-light", 245, "1 taza de leche descremada"], ["zarzamora", 100, "¾ taza de zarzamoras"], ["avena", 20, "2 cucharadas de avena"],
  ], ["Lava las zarzamoras con cuidado (son delicadas).", "Pon en la licuadora la leche, las zarzamoras y la avena.", "Licúa 40-60 segundos.", "Cuélalo si no te gustan las semillitas.", "Agrega hielo o tómalo así.", "Tip: las zarzamoras congeladas son más baratas y funcionan igual."]),
  R("yogur-mango-chia", "Yogur griego con mango y chía", ["desayuno", "colacion"], 5, ["ninguno"], [
    ["yogur-griego", 200, "1 taza de yogur griego"], ["mango", 150, "¾ de mango picado"], ["chia", 12, "1 cucharada de chía"],
  ], ["Pela el mango y córtalo en cubos.", "Sirve la taza de yogur griego en un tazón.", "Agrega la cucharada de chía y mezcla; déjala reposar 5 minutos para que se suavice un poco.", "Pon el mango encima.", "Opcional: unas gotas de limón y una pizca de chile en polvo sobre el mango.", "Tip: sin refri, compra el yogur el mismo día."]),
  R("burrito-huevo-frijol", "Burrito de huevo con frijoles", ["desayuno"], 10, ["estufa"], [
    ["tortilla-harina", 45, "1 tortilla de harina grande"], ["huevo", 100, "2 huevos"], ["frijol-lata", 60, "¼ de taza de frijoles de lata escurridos"],
    ["salsa-roja", 30, "Salsa"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Enjuaga y escurre los frijoles de lata para quitarles el exceso de sal.", "Bate los 2 huevos con sal.", "Calienta unas gotas de aceite en sartén a fuego medio, agrega los frijoles 1 minuto y luego el huevo; revuelve 2 minutos hasta que cuaje.", "Calienta la tortilla de harina 20 segundos por lado para que esté flexible.", "Pon el relleno al centro, agrega salsa, dobla los lados hacia adentro y enrolla apretando.", "Si quieres, dóralo en el sartén 1 minuto por lado con la unión hacia abajo para que no se abra."]),
  R("camote-yogur", "Camote con yogur y nuez", ["desayuno", "colacion"], 10, ["microondas", "horno", "air fryer"], [
    ["camote", 130, "1 camote chico cocido"], ["yogur-griego", 100, "½ taza de yogur griego"], ["nueces", 10, "Nuez picada"], ["", 0, "Canela"],
  ], ["Lava el camote y pícalo varias veces con un tenedor.", "Microondas: 5-6 minutos volteándolo a la mitad. Air fryer: 200 °C por 25-30 minutos. Horno: 200 °C por 40 minutos.", "Está listo cuando un cuchillo entra sin resistencia.", "Ábrelo a lo largo y aplasta un poco la pulpa con un tenedor.", "Pon encima el yogur griego, la nuez picada y canela.", "Tip: el camote cocido aguanta 1 día sin refri si lo dejas entero con cáscara."]),
  R("ensalada-frutas", "Ensalada de frutas con yogur y granola", ["desayuno", "colacion"], 8, ["ninguno"], [
    ["papaya", 80, "Papaya picada"], ["melon", 80, "Melón picado"], ["uvas", 60, "Uvas"], ["pina", 60, "Piña"], ["yogur", 125, "1 vasito de yogur natural"],
    ["granola", 20, "2 cucharadas de granola"],
  ], ["Lava y pica la papaya, el melón y la piña en cubos del mismo tamaño.", "Lava las uvas y pártelas a la mitad.", "Mezcla toda la fruta en un tazón.", "Sirve y pon encima el yogur natural.", "Agrega las 2 cucharadas de granola justo al comer para que no se aguade.", "Tip: sin refri, pica la fruta al momento; picada se oxida y se echa a perder rápido."]),
  R("huevo-ejotes", "Huevos con ejotes", ["desayuno", "cena"], 15, ["estufa"], [
    ["huevo", 150, "3 huevos"], ["ejotes", 100, "1 taza de ejotes en trozos"], ["jitomate", 40, "Jitomate picado"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["tortilla-maiz", 60, "2 tortillas"], SAL,
  ], ["Quítales las puntas a los ejotes y córtalos en trozos de 2 cm.", "Hiérvelos en agua con sal 5 minutos, hasta que estén suaves pero sigan verdes; escúrrelos.", "Calienta el aceite a fuego medio y sofríe el jitomate picado 2 minutos.", "Agrega los ejotes y saltea 1 minuto.", "Vierte los 3 huevos batidos con sal y pimienta y revuelve 2 minutos hasta que cuajen.", "Sirve con tortillas calientes."]),
  R("salchichas-mexicana", "Salchichas a la mexicana", ["desayuno", "cena"], 10, ["estufa"], [
    ["salchicha-pavo", 90, "2 salchichas de pavo"], ["jitomate", 60, "½ jitomate"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 2, "Unas gotas de aceite"],
  ], ["Corta las 2 salchichas de pavo en rodajas.", "Pica el jitomate, la cebolla y el serrano.", "Calienta unas gotas de aceite a fuego medio y dora la salchicha 2-3 minutos.", "Agrega cebolla y chile 1 minuto.", "Agrega el jitomate y cocina 3 minutos hasta que se forme una salsita.", "Sirve con tortillas calientes. Tip: sin refri, compra las salchichas el mismo día."]),
  R("amaranto-leche-fresas", "Amaranto con leche y fresas", ["desayuno", "colacion"], 3, ["ninguno"], [
    ["amaranto", 20, "4 cucharadas de amaranto natural"], ["leche-light", 200, "¾ taza de leche descremada"], ["fresas", 80, "Fresas picadas"],
  ], ["Lava las fresas y pícalas.", "Sirve las 4 cucharadas de amaranto en un tazón.", "Agrega la leche fría o tibia.", "Pon las fresas encima.", "Cómelo de inmediato para que el amaranto siga crujiente.", "Tip: sin refri usa leche en polvo (3 cucharadas en ¾ de taza de agua)."]),

  /* ===================== NUEVAS: COMIDAS ===================== */
  R("carne-asada-nopales", "Carne asada con nopales y frijoles", ["comida"], 20, ["estufa"], [
    ["carne-asar", 120, "120 g de carne para asar"], ["nopales", 100, "Nopales asados"], ["frijol-negro", 86, "½ taza de frijoles de la olla"],
    ["tortilla-maiz", 60, "2 tortillas"], ["salsa-roja", 30, "Salsa"], ["cebolla", 15, "Cebollitas asadas"], ["", 0, "Limón y sal"],
  ], ["Sazona la carne con sal, pimienta y un poco de limón 10 minutos antes.", "Calienta el comal o sartén a fuego alto hasta que esté muy caliente.", "Asa los nopales y las cebollitas 5-6 minutos por lado, hasta que se tateman.", "Asa la carne 3-4 minutos por lado (si es delgada, 2 minutos). No la aplastes, pierde su jugo.", "Déjala reposar 3 minutos y córtala en tiras.", "Calienta los frijoles y las tortillas y sirve todo con salsa y limón.", "Tip: sin refri, compra la carne el mismo día."]),
  R("tacos-carne-asada", "Tacos de carne asada con guacamole", ["comida", "cena"], 15, ["estufa"], [
    ["carne-asar", 100, "100 g de carne para asar"], ["tortilla-maiz", 90, "3 tortillas"], ["aguacate", 50, "¼ de aguacate machacado"],
    ["cebolla", 15, "Cebolla y cilantro"], ["salsa-verde", 30, "Salsa"], ["", 0, "Limón y sal"],
  ], ["Machaca el aguacate con sal y limón para el guacamole.", "Pica la cebolla y el cilantro.", "Sazona la carne con sal y pimienta.", "Ásala en comal o sartén a fuego alto 3-4 minutos por lado.", "Déjala reposar 2 minutos y pícala en cuadritos.", "Calienta las tortillas y arma los tacos con carne, guacamole, cebolla, cilantro, salsa y limón."]),
  R("milanesa-pollo-ensalada", "Milanesa de pollo a la plancha con arroz y ensalada", ["comida"], 20, ["estufa", "air fryer"], [
    ["milanesa-pollo", 120, "1 milanesa de pollo"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["lechuga", 60, "Lechuga"],
    ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal, pimienta y limón"],
  ], ["Sazona la milanesa con ajo, sal, pimienta y unas gotas de limón.", "Sartén: calienta la cucharadita de aceite a fuego medio-alto y cocina la milanesa 3-4 minutos por lado.", "Air fryer: 190 °C por 10-12 minutos, volteando a la mitad.", "Está lista cuando por dentro está blanca, sin partes rosadas.", "Mientras, lava y corta la lechuga, el jitomate y el pepino; aliña con limón y sal.", "Calienta el arroz y sirve todo junto."]),
  R("torta-milanesa-pollo", "Torta de milanesa de pollo", ["comida", "cena"], 15, ["estufa"], [
    ["bolillo", 70, "1 bolillo sin migajón"], ["milanesa-pollo", 100, "1 milanesa de pollo a la plancha"], ["refritos", 30, "Frijoles refritos"],
    ["lechuga", 20, "Lechuga"], ["jitomate", 30, "Jitomate"], ["aguacate", 30, "Aguacate"], ["", 0, "Chiles en vinagre al gusto"],
  ], ["Cocina la milanesa en sartén con unas gotas de aceite 3-4 minutos por lado, sazonada con sal y pimienta.", "Parte el bolillo y quítale el migajón.", "Calienta el bolillo en el comal 1 minuto por lado para que esté crujiente.", "Unta frijoles refritos en la base.", "Pon la milanesa, lechuga, jitomate, aguacate y chiles en vinagre al gusto.", "Tapa, presiona y parte a la mitad."]),
  R("milanesa-res-pure", "Milanesa de res con puré y ejotes", ["comida"], 25, ["estufa"], [
    ["milanesa-res", 110, "1 milanesa de res"], ["papa", 150, "1 papa cocida para puré"], ["leche-light", 30, "Un chorrito de leche"],
    ["ejotes", 100, "1 taza de ejotes"], ["aceite", 4.5, "1 cucharadita de aceite"], SAL,
  ], ["Pela la papa, córtala en trozos y hiérvela 15 minutos con sal hasta que esté muy suave.", "Escúrrela y aplástala con un tenedor con un chorrito de leche, sal y pimienta hasta que quede cremosa.", "Hierve los ejotes en trozos 5 minutos y escúrrelos.", "Sazona la milanesa con sal y pimienta.", "Cocínala en sartén con la cucharadita de aceite a fuego alto 2 minutos por lado (la de res es delgada y se cuece rápido).", "Sirve la milanesa con el puré y los ejotes. Tip: sin refri, compra la carne el mismo día."]),
  R("milanesa-res-nopales", "Milanesa de res con ensalada de nopales", ["comida"], 20, ["estufa"], [
    ["milanesa-res", 110, "1 milanesa de res"], ["nopales", 120, "Nopales cocidos en tiras"], ["jitomate", 40, "Jitomate"], ["cebolla", 15, "Cebolla"],
    ["queso-fresco", 15, "Queso fresco"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Cilantro, orégano y limón"],
  ], ["Para la ensalada: mezcla los nopales cocidos en tiras con jitomate y cebolla picados, cilantro, orégano, limón y sal.", "Deja reposar la ensalada mientras cocinas para que tome sabor.", "Sazona la milanesa con sal y pimienta.", "Calienta el aceite a fuego alto y cocina la milanesa 2 minutos por lado.", "Desmorona el queso fresco sobre la ensalada.", "Sirve con tortillas calientes."]),
  R("pollo-verde-chayote", "Pollo en salsa verde con chayote", ["comida"], 35, ["estufa", "licuadora"], [
    ["muslo", 180, "2 piezas de pierna y muslo sin piel"], ["tomate-verde", 140, "4 tomates verdes"], ["serrano", 6, "1 serrano"],
    ["chayote", 130, "1 chayote en cubos"], ["cebolla", 20, "Cebolla"], ["arroz-blanco", 100, "⅔ taza de arroz"], ["", 0, "Ajo, cilantro y sal"],
  ], ["Hierve las piezas de pollo con agua que las cubra, ajo, cebolla y sal 20 minutos. Guarda 1 taza del caldo.", "Mientras, hierve los tomates verdes y el serrano 5 minutos hasta que cambien a verde opaco.", "Licúa los tomates, el chile, un ajo, cilantro y la taza de caldo.", "Vierte la salsa en una olla, agrega el pollo y el chayote en cubos.", "Cocina a fuego medio 10-12 minutos, hasta que el chayote esté suave.", "Prueba la sal y sirve con el arroz."]),
  R("hamburguesa-casera", "Hamburguesa casera en pan integral", ["comida", "cena"], 15, ["estufa"], [
    ["molida-90", 100, "100 g de carne molida de res"], ["pan-integral", 56, "2 rebanadas de pan integral"], ["lechuga", 20, "Lechuga"],
    ["jitomate", 30, "Jitomate"], ["cebolla", 15, "Cebolla"], ["aguacate", 30, "Aguacate"], ["", 0, "Sal, pimienta y mostaza"],
  ], ["Sazona la carne molida con sal y pimienta y forma una torta de 1.5 cm de grosor; hazle un hundido al centro con el pulgar (así no se infla).", "Calienta un sartén o comal a fuego medio-alto sin aceite.", "Cocina la carne 4 minutos por lado sin aplastarla.", "Tuesta el pan en el mismo comal 1 minuto.", "Lava la lechuga y rebana el jitomate, la cebolla y el aguacate.", "Arma: pan con mostaza, lechuga, carne, jitomate, cebolla, aguacate y pan."]),
  R("rajas-pollo-elote", "Rajas con pollo y elote", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 100, "Pollo en tiras"], ["poblano", 100, "1 poblano asado en rajas"], ["elote", 70, "½ taza de granos de elote"],
    ["crema", 15, "1 cucharada de crema"], ["cebolla", 20, "Cebolla"], ["tortilla-maiz", 60, "2 tortillas"], ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Asa el poblano en la flama o comal hasta que la piel esté negra, súdalo 5 minutos en una bolsa, pélalo y córtalo en rajas.", "Corta el pollo en tiras y sazónalo con sal.", "Calienta el aceite y cocina el pollo 6 minutos hasta que no esté rosado; sácalo.", "En el mismo sartén sofríe la cebolla fileteada 2 minutos, agrega las rajas y el elote 3 minutos.", "Regresa el pollo, agrega la cucharada de crema, mezcla y apaga.", "Sirve con tortillas. Tip: sin refri, compra la crema el mismo día."]),
  R("pescado-veracruzana", "Pescado a la veracruzana", ["comida"], 25, ["estufa"], [
    ["tilapia", 150, "1 filete de pescado"], ["jitomate", 120, "1 jitomate"], ["cebolla", 30, "Cebolla"], ["pimiento", 40, "Pimiento morrón"],
    ["arroz-blanco", 100, "⅔ taza de arroz"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, aceitunas, alcaparras y orégano (opcional)"],
  ], ["Pica el jitomate, la cebolla, el pimiento y el ajo.", "Calienta el aceite a fuego medio y sofríe cebolla, ajo y pimiento 3 minutos.", "Agrega el jitomate, orégano, y las aceitunas y alcaparras si tienes; cocina 5 minutos hasta formar una salsa.", "Sazona el pescado con sal y acomódalo encima de la salsa.", "Tapa y cocina a fuego bajo 8-10 minutos, hasta que el pescado se deshaga en hojuelas con un tenedor.", "Sirve con el arroz y bastante salsa encima. Tip: sin refri, compra el pescado el mismo día."]),
  R("tacos-pescado", "Tacos de pescado con col", ["comida", "cena"], 20, ["estufa", "air fryer"], [
    ["tilapia", 120, "1 filete de pescado"], ["tortilla-maiz", 90, "3 tortillas"], ["col", 50, "Col rallada"], ["jitomate", 30, "Pico de gallo"],
    ["yogur-griego", 20, "Yogur griego con limón como aderezo"], ["", 0, "Limón, sal y chile"],
  ], ["Mezcla 2 cucharadas de yogur griego con limón y sal para el aderezo.", "Ralla la col finita y prepara el pico de gallo.", "Sazona el pescado con sal, chile en polvo y limón.", "Sartén: unas gotas de aceite a fuego medio, 3 minutos por lado. Air fryer: 200 °C por 8-10 minutos.", "Desmenúzalo en trozos grandes.", "Calienta las tortillas y arma: pescado, col, pico de gallo y el aderezo."]),
  R("pollo-brocoli-arroz", "Pollo con brócoli, coliflor y arroz", ["comida"], 25, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en cubos"], ["brocoli", 80, "Brócoli"], ["coliflor", 60, "Coliflor"], ["zanahoria", 40, "Zanahoria"],
    ["arroz-blanco", 100, "⅔ taza de arroz"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Ajo, sal y salsa de soya"],
  ], ["Corta la pechuga en cubos de 2 cm, el brócoli y la coliflor en ramitos chicos y la zanahoria en rodajas.", "Hierve brócoli, coliflor y zanahoria 3 minutos (o al vapor 5); deben quedar firmes.", "Calienta el aceite a fuego alto y dora el pollo 6-7 minutos.", "Agrega ajo picado 30 segundos y las verduras escurridas.", "Agrega 1 cucharada de salsa de soya y saltea 2 minutos.", "Sirve con el arroz caliente."]),
  R("burrito-pollo-frijol", "Burrito de pollo y frijoles", ["comida", "cena"], 10, ["estufa"], [
    ["tortilla-harina", 45, "1 tortilla de harina grande"], ["pechuga-cocida", 80, "Pollo deshebrado"], ["frijol-lata", 80, "Frijoles de lata escurridos"],
    ["lechuga", 20, "Lechuga"], ["salsa-roja", 30, "Salsa"],
  ], ["Enjuaga y escurre los frijoles de lata.", "Calienta el pollo deshebrado y los frijoles juntos en un sartén 2 minutos.", "Calienta la tortilla de harina para que esté flexible.", "Pon al centro el pollo con frijoles, lechuga picada y salsa.", "Dobla los lados hacia adentro y enrolla apretando.", "Dóralo 1 minuto por lado en el sartén con la unión hacia abajo."]),
  R("chuleta-salsa-verde", "Chuleta en salsa verde con frijoles", ["comida"], 25, ["estufa", "licuadora"], [
    ["chuleta", 120, "1 chuleta de cerdo"], ["tomate-verde", 140, "4 tomates verdes"], ["serrano", 6, "1 serrano"],
    ["frijol-bayo", 86, "½ taza de frijoles bayos de la olla"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Hierve los tomates verdes y el serrano 5 minutos; licúalos con ajo, un trozo de cebolla y sal.", "Sazona la chuleta con sal.", "Dórala en un sartén caliente a fuego medio-alto 3 minutos por lado (con su propia grasa basta).", "Vierte la salsa verde, baja el fuego, tapa y cocina 10 minutos para que la carne quede suave.", "Calienta los frijoles de la olla.", "Sirve la chuleta con su salsa, frijoles y tortillas. Tip: sin refri, compra la carne el mismo día."]),
  R("bowl-pollo-camote", "Pollo con camote y brócoli al horno", ["comida"], 30, ["air fryer", "horno"], [
    ["pechuga-cocida", 120, "120 g de pechuga"], ["camote", 130, "1 camote chico en cubos"], ["brocoli", 100, "Brócoli"],
    ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Paprika, ajo, sal y pimienta"],
  ], ["Corta la pechuga y el camote en cubos de 2 cm y el brócoli en ramitos.", "Mezcla todo con la cucharadita de aceite, paprika, ajo en polvo, sal y pimienta.", "Air fryer: camote primero a 200 °C por 8 minutos; luego agrega el pollo y el brócoli y cocina 12 minutos más, agitando a la mitad.", "Horno: todo en una charola a 200 °C por 25 minutos, volteando a la mitad.", "Está listo cuando el camote está suave y el pollo ya no está rosado por dentro.", "Sirve en un tazón; un chorrito de limón le queda bien."]),
  R("tortitas-coliflor", "Tortitas de coliflor con panela en caldillo", ["comida", "cena"], 25, ["estufa"], [
    ["coliflor", 200, "Coliflor cocida"], ["huevo", 50, "1 huevo"], ["queso-panela", 40, "Panela"], ["salsa-roja", 90, "Caldillo de jitomate"],
    ["aceite", 4.5, "1 cucharadita de aceite"],
  ], ["Hierve la coliflor en ramitos 8 minutos hasta que esté suave; escúrrela muy bien y aplástala con un tenedor.", "Separa el huevo: bate la clara a punto de turrón (hasta que haga picos firmes) y luego agrega la yema.", "Forma tortitas con la coliflor y un trozo de panela al centro.", "Pásalas por el huevo batido y dóralas en el aceite a fuego medio 2 minutos por lado. Sécalas en una servilleta.", "Para el caldillo: licúa 1 jitomate con ajo, cebolla, sal y 1 taza de agua y hiérvelo 5 minutos.", "Mete las tortitas en el caldillo 3 minutos y sirve."]),
  R("pollo-ensalada-betabel", "Pollo con ensalada de betabel y naranja", ["comida", "cena"], 20, ["estufa", "air fryer"], [
    ["pechuga-cocida", 125, "125 g de pechuga"], ["betabel", 80, "1 betabel cocido"], ["zanahoria", 50, "Zanahoria rallada"],
    ["naranja", 60, "½ naranja en gajos"], ["lechuga", 40, "Lechuga"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón y sal"],
  ], ["Sazona la pechuga con sal, pimienta y limón.", "Air fryer: 190 °C por 16-18 minutos volteando a la mitad. Sartén: 6-7 minutos por lado, tapado.", "Si el betabel es crudo, hiérvelo 40 minutos (o compra cocido); pélalo y córtalo en cubos.", "Ralla la zanahoria, pela la naranja y sepárala en gajos, lava la lechuga.", "Mezcla la ensalada con limón y sal.", "Corta el pollo en tiras y sírvelo sobre la ensalada con las tostadas a un lado."]),
  R("espagueti-rojo-pollo", "Espagueti rojo con pollo", ["comida"], 25, ["estufa", "licuadora"], [
    ["pasta", 140, "1 taza de espagueti cocido"], ["jitomate", 100, "1 jitomate"], ["pechuga-cocida", 100, "Pollo deshebrado"],
    ["queso-chihuahua", 15, "Queso manchego rallado"], ["crema", 10, "Un poco de crema"], ["", 0, "Ajo, cebolla y sal"],
  ], ["Cuece el espagueti en agua hirviendo con sal según el paquete (8-10 minutos) y escúrrelo.", "Licúa el jitomate con ajo, un trozo de cebolla, sal y ¼ de taza de agua.", "Vierte el jitomate licuado en una olla y cocina 5 minutos a fuego medio.", "Agrega la cucharada de crema, el pollo deshebrado y el espagueti; mezcla 2 minutos.", "Sirve con el queso manchego rallado encima.", "Tip: sin refri, compra la crema el mismo día."]),
  R("salpicon-res", "Salpicón de res en tostadas", ["comida", "cena"], 15, ["estufa"], [
    ["bistec", 100, "Carne de res cocida y deshebrada"], ["lechuga", 50, "Lechuga picada"], ["jitomate", 60, "Jitomate"],
    ["cebolla", 20, "Cebolla morada"], ["aguacate", 40, "Aguacate"], ["tostada-horneada", 36, "3 tostadas"], ["", 0, "Limón, orégano y sal"],
  ], ["Si la carne no está cocida, hierve 150 g de falda o chambarete con agua, ajo, cebolla y sal 50-60 minutos (o 25 en olla exprés) hasta que se deshaga; deshébrala fina.", "Pica la lechuga, el jitomate y la cebolla morada; rebana el aguacate.", "Mezcla la carne con la lechuga, jitomate y cebolla.", "Aliña con el jugo de 2 limones, orégano y sal; deja reposar 5 minutos.", "Sirve sobre las tostadas.", "Pon el aguacate encima al momento de comer."]),
  R("fajitas-pollo", "Fajitas de pollo con pimiento", ["comida", "cena"], 20, ["estufa"], [
    ["pechuga-cocida", 125, "125 g de pechuga en tiras"], ["pimiento", 120, "1 pimiento morrón en tiras"], ["cebolla", 40, "½ cebolla"],
    ["tortilla-harina", 45, "1 tortilla de harina"], ["aceite", 4.5, "1 cucharadita de aceite"], ["", 0, "Comino, ajo, sal y limón"],
  ], ["Corta la pechuga en tiras delgadas y sazónala con comino, ajo en polvo, sal y el jugo de medio limón.", "Corta el pimiento y la cebolla en tiras.", "Calienta el aceite a fuego alto y cocina el pollo 5-6 minutos sin moverlo demasiado, para que se dore.", "Agrega pimiento y cebolla y saltea 3-4 minutos: deben quedar suaves pero todavía un poco crujientes.", "Calienta la tortilla de harina.", "Sirve las fajitas en la tortilla con salsa o limón."]),
  R("ceviche-pescado", "Ceviche de pescado con tostadas", ["comida", "cena"], 20, ["ninguno"], [
    ["tilapia", 120, "Pescado en cubos chicos"], ["pepino", 60, "Pepino"], ["jitomate", 60, "Jitomate"], ["cebolla", 20, "Cebolla"],
    ["serrano", 6, "1 serrano"], ["tostada-horneada", 36, "3 tostadas"], ["aguacate", 30, "Aguacate"], ["", 0, "Jugo de 6 limones, cilantro y sal"],
  ], ["Usa pescado muy fresco (compra el mismo día). Córtalo en cubos de 1 cm.", "Ponlo en un tazón de vidrio, cúbrelo con el jugo de los 6 limones y una pizca de sal.", "Deja que se 'cueza' en el limón 15-20 minutos, moviendo a la mitad, hasta que esté blanco por fuera y por dentro.", "Mientras, pica el pepino, el jitomate, la cebolla, el serrano y el cilantro.", "Escurre un poco del limón, mezcla el pescado con la verdura y ajusta la sal.", "Sirve sobre las tostadas con aguacate.", "Importante: sin refri, prepáralo y cómelo de inmediato; no lo guardes."]),
  R("sardinas-nopales", "Sardinas con nopales", ["comida", "cena"], 15, ["estufa"], [
    ["sardina", 100, "½ lata de sardinas en tomate"], ["nopales", 100, "Nopales cocidos"], ["cebolla", 20, "Cebolla"], ["serrano", 6, "1 serrano"],
    ["tortilla-maiz", 60, "2 tortillas"],
  ], ["Si los nopales son crudos, córtalos en tiras y hiérvelos 8 minutos con sal; enjuágalos.", "Pica la cebolla y el serrano.", "En un sartén a fuego medio sofríe cebolla y chile 2 minutos (con la salsa de la sardina basta, no necesita aceite).", "Agrega los nopales y saltea 2 minutos.", "Agrega la media lata de sardinas con su salsa, desmenúzalas y cocina 3 minutos.", "Sirve con tortillas calientes."]),
  R("coctel-camaron", "Coctel de camarón ligero", ["comida", "cena"], 15, ["ninguno"], [
    ["camaron", 120, "120 g de camarón cocido"], ["jitomate", 80, "Jitomate picado"], ["pepino", 60, "Pepino"], ["cebolla", 20, "Cebolla"],
    ["aguacate", 30, "Aguacate"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, cilantro, salsa picante y un chorrito de catsup"],
  ], ["Si el camarón es crudo, hiérvelo 2-3 minutos en agua con sal, solo hasta que se ponga rosado; pásalo a agua fría.", "Pica el jitomate, el pepino, la cebolla y el cilantro en cubos chicos.", "En un vaso mezcla el jugo de 2 limones, salsa picante y un chorrito de catsup (1 cucharada basta).", "Agrega el camarón y la verdura y mezcla.", "Termina con aguacate en cubos.", "Sirve con las tostadas. Sin refri, compra el camarón ya cocido el mismo día y cómelo pronto."]),
  R("caldo-res", "Caldo de res con verduras", ["comida"], 60, ["estufa"], [
    ["bistec", 120, "120 g de chambarete o carne para caldo"], ["col", 70, "Un trozo de col"], ["elote", 70, "½ elote en trozos"],
    ["zanahoria", 50, "Zanahoria"], ["chayote", 80, "½ chayote"], ["papa", 80, "½ papa"], ["tortilla-maiz", 60, "2 tortillas"], ["", 0, "Ajo, cebolla, cilantro y limón"],
  ], ["Pon la carne en una olla con 6 tazas de agua, 2 ajos, un trozo de cebolla y sal.", "Hierve a fuego medio-bajo 40 minutos, quitando la espuma de arriba (olla exprés: 20 minutos).", "Agrega el elote en trozos y la zanahoria; cocina 10 minutos.", "Agrega la papa y el chayote en trozos; cocina 8 minutos.", "Agrega la col al final, 3 minutos, para que no se deshaga.", "Sirve con cilantro picado, limón, salsa y tortillas.", "Tip: sin refri, hierve lo que sobre antes de dormir para que aguante."]),
  R("ensalada-espinaca-pera", "Ensalada de espinaca con pollo y pera", ["comida", "cena"], 15, ["estufa", "air fryer"], [
    ["pechuga-cocida", 120, "120 g de pechuga"], ["espinaca", 60, "2 tazas de espinaca"], ["pera", 90, "½ pera rebanada"],
    ["nueces", 10, "Unas nueces"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, sal y pimienta"],
  ], ["Sazona la pechuga con sal, pimienta y limón.", "Air fryer: 190 °C por 16-18 minutos volteando a la mitad. Sartén: 6-7 minutos por lado, tapado.", "Déjala reposar 3 minutos y córtala en tiras.", "Lava y escurre bien la espinaca; rebana la pera al último para que no se oxide.", "Mezcla espinaca, pera y nueces con limón, sal y pimienta.", "Pon el pollo encima y acompaña con las tostadas."]),
  R("ensalada-lentejas", "Ensalada de lentejas", ["comida", "cena"], 15, ["estufa"], [
    ["lentejas", 150, "¾ taza de lentejas cocidas"], ["jitomate", 60, "Jitomate"], ["pepino", 60, "Pepino"], ["cebolla", 15, "Cebolla"],
    ["queso-fresco", 20, "Queso fresco"], ["tostada-horneada", 24, "2 tostadas"], ["", 0, "Limón, aceite de oliva y sal"],
  ], ["Si las lentejas son crudas, hiérvelas 20-25 minutos en agua con sal hasta que estén suaves pero enteras; escúrrelas y déjalas entibiar.", "Pica el jitomate, el pepino y la cebolla en cubos chicos.", "Mezcla las lentejas con la verdura.", "Aliña con el jugo de 1 limón, un chorrito de aceite de oliva y sal.", "Desmorona el queso fresco encima.", "Sirve con las tostadas."]),

  /* ===================== NUEVAS: COLACIONES ===================== */
  R("jicama-pepino-naranja", "Jícama, pepino y naranja con chile", ["colacion"], 5, ["ninguno"], [
    ["jicama", 130, "1 taza de jícama"], ["pepino", 80, "Pepino"], ["naranja", 60, "½ naranja"], ["", 0, "Limón y chile en polvo"],
  ], ["Pela la jícama y córtala en bastones.", "Lava el pepino y córtalo en bastones.", "Pela la media naranja y sepárala en gajos.", "Acomoda todo en un vaso o plato.", "Exprime limón encima y espolvorea chile en polvo.", "Cómela al momento."]),
  R("mango-chile", "Mango con limón y chile", ["colacion"], 3, ["ninguno"], [
    ["mango", 200, "1 mango"], ["", 0, "Limón y chile en polvo"],
  ], ["Lava el mango.", "Corta las dos 'mejillas' a los lados del hueso.", "Hazles cortes en cuadrícula sin atravesar la cáscara y voltéalas hacia afuera para que salgan los cubos.", "Corta lo que queda alrededor del hueso.", "Ponle limón y chile en polvo al gusto."]),
  R("sandia-melon", "Sandía y melón picados", ["colacion"], 5, ["ninguno"], [
    ["sandia", 150, "1 taza de sandía"], ["melon", 150, "1 taza de melón"], ["", 0, "Limón y chile (opcional)"],
  ], ["Lava la cáscara de la sandía y el melón antes de cortarlos (las bacterias de la cáscara pasan al cuchillo).", "Corta una taza de cada uno en cubos, sin cáscara ni semillas.", "Mezcla en un vaso o tazón.", "Opcional: limón y chile en polvo.", "Sin refri, pica solo lo que te vas a comer; la fruta picada se echa a perder rápido."]),
  R("vaso-fruta", "Vaso de fruta: papaya, sandía y tuna", ["colacion"], 5, ["ninguno"], [
    ["papaya", 80, "Papaya"], ["sandia", 80, "Sandía"], ["tuna", 100, "1 tuna pelada"], ["", 0, "Limón y chile"],
  ], ["Lava la papaya y la sandía; pélalas y córtalas en cubos.", "Pela la tuna con cuidado: corta las puntas, haz un corte a lo largo de la cáscara y despréndela (usa tenedor para no espinarte).", "Corta la tuna en rodajas.", "Acomoda todo en un vaso.", "Termina con limón y chile en polvo."]),
  R("pina-pepino", "Piña con pepino y chile", ["colacion"], 5, ["ninguno"], [
    ["pina", 120, "¾ taza de piña"], ["pepino", 80, "Pepino"], ["", 0, "Limón, sal y chile en polvo"],
  ], ["Pela la piña, quítale el centro duro y córtala en cubos (¾ de taza).", "Lava el pepino y córtalo en cubos o bastones.", "Mezcla en un vaso.", "Agrega limón, una pizca de sal y chile en polvo.", "Cómela al momento."]),
  R("mandarinas-nueces", "Mandarinas con nueces", ["colacion"], 2, ["ninguno"], [
    ["mandarina", 176, "2 mandarinas"], ["nueces", 14, "Medio puño de nueces"],
  ], ["Pela las 2 mandarinas y sepáralas en gajos.", "Mide medio puño de nueces (unos 15 g).", "Sírvelos juntos en un plato.", "La fruta aporta vitamina C y la nuez grasa buena que te deja satisfecho."]),
  R("coctel-citricos", "Coctel de cítricos con kiwi", ["colacion", "desayuno"], 5, ["ninguno"], [
    ["toronja", 120, "½ toronja en gajos"], ["naranja", 130, "1 naranja en gajos"], ["kiwi", 75, "1 kiwi"], ["mandarina", 88, "1 mandarina"], ["miel", 7, "Un hilo de miel"],
  ], ["Pela la toronja, la naranja y la mandarina; separa los gajos y quítales la piel blanca si te amarga.", "Pela el kiwi y córtalo en rodajas.", "Mezcla todo en un tazón con el jugo que soltaron.", "Termina con un hilo de miel (½ cucharadita basta).", "Cómelo al momento."]),
  R("toronja-miel", "Toronja con miel", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["toronja", 240, "1 toronja"], ["miel", 7, "1 cucharadita de miel"],
  ], ["Corta la toronja a la mitad por el ecuador.", "Con un cuchillo chico, corta alrededor de cada gajo para despegarlo de la piel.", "Pon media cucharadita de miel en cada mitad.", "Cómela con cuchara.", "Ojo: la toronja interactúa con algunos medicamentos; si tomas alguno, pregúntale a tu médico."]),
  R("pera-requeson", "Pera con requesón y canela", ["colacion"], 3, ["ninguno"], [
    ["pera", 180, "1 pera"], ["requeson", 60, "3 cucharadas de requesón"], ["", 0, "Canela"],
  ], ["Lava la pera y córtala en gajos, quitando el centro.", "Sirve las 3 cucharadas de requesón en un plato.", "Acomoda la pera alrededor.", "Espolvorea canela.", "Tip: sin refri, compra el requesón el mismo día."]),
  R("durazno-yogur", "Durazno con yogur griego y almendras", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["durazno", 150, "1 durazno"], ["yogur-griego", 150, "1 vasito de yogur griego"], ["almendras", 10, "Unas almendras"],
  ], ["Lava el durazno, quítale el hueso y córtalo en gajos.", "Sirve el yogur griego en un tazón.", "Pon el durazno encima.", "Pica las almendras y espolvoréalas.", "Tip: sin refri, compra el yogur el mismo día."]),
  R("kiwi-fresas-amaranto", "Kiwi y fresas con amaranto", ["colacion"], 3, ["ninguno"], [
    ["kiwi", 75, "1 kiwi"], ["fresas", 100, "Fresas"], ["amaranto", 10, "2 cucharadas de amaranto"],
  ], ["Pela el kiwi y córtalo en cubos.", "Lava las fresas, quítales el rabito y pártelas a la mitad.", "Mezcla en un tazón.", "Espolvorea las 2 cucharadas de amaranto justo al comer para que esté crujiente."]),
  R("tunas-frescas", "Tunas frescas", ["colacion"], 5, ["ninguno"], [
    ["tuna", 200, "2 tunas peladas"],
  ], ["Si las tunas no vienen peladas, sujétalas con un tenedor (tienen espinitas casi invisibles).", "Corta las dos puntas.", "Haz un corte a lo largo de la cáscara, sin llegar a la pulpa.", "Despega la cáscara con el cuchillo y el tenedor.", "Córtalas en rodajas o cómelas enteras."]),
  R("ciruelas-almendras", "Ciruelas con almendras", ["colacion"], 1, ["ninguno"], [
    ["ciruela", 132, "2 ciruelas"], ["almendras", 14, "Medio puño de almendras"],
  ], ["Lava las 2 ciruelas.", "Mide medio puño de almendras (unos 15 g).", "Sírvelos juntos.", "Es una colación práctica para llevar en la mochila: no necesita refri."]),
  R("yogur-ciruela-amaranto", "Yogur natural con ciruela y amaranto", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["yogur", 125, "1 vasito de yogur natural"], ["ciruela", 66, "1 ciruela picada"], ["amaranto", 10, "2 cucharadas de amaranto"],
  ], ["Lava la ciruela, quítale el hueso y pícala.", "Sirve el yogur natural en un tazón.", "Pon la ciruela encima.", "Espolvorea el amaranto al momento de comer.", "Tip: sin refri, compra el yogur el mismo día."]),
  R("yogur-zarzamora", "Yogur con zarzamoras y granola", ["colacion", "desayuno"], 3, ["ninguno"], [
    ["yogur", 125, "1 vasito de yogur natural"], ["zarzamora", 70, "½ taza de zarzamoras"], ["granola", 15, "Granola"],
  ], ["Lava las zarzamoras con cuidado.", "Sirve el yogur natural en un tazón.", "Agrega las zarzamoras.", "Pon la granola encima justo al comer (2 cucharadas bastan).", "Tip: sin refri, compra el yogur el mismo día."]),
  R("uvas-panela", "Uvas con queso panela", ["colacion"], 2, ["ninguno"], [
    ["uvas", 150, "1 taza de uvas"], ["queso-panela", 30, "1 rebanada de panela en cubos"],
  ], ["Lava las uvas y desgránalas.", "Corta la panela en cubos de 1 cm.", "Sírvelos juntos en un plato.", "Combinación de dulce y salado con proteína.", "Tip: sin refri, compra la panela el mismo día."]),
  R("guayabas-chile", "Guayabas con limón y chile", ["colacion"], 2, ["ninguno"], [
    ["guayaba", 110, "2 guayabas"], ["", 0, "Limón y chile en polvo"],
  ], ["Lava las guayabas y quítales el rabito.", "Córtalas en cuartos (la cáscara se come).", "Exprime limón encima.", "Espolvorea chile en polvo al gusto."]),
  R("mamey-canela", "Mamey con canela", ["colacion"], 3, ["ninguno"], [
    ["mamey", 170, "½ mamey"], ["", 0, "Canela"],
  ], ["Parte el mamey a la mitad a lo largo y quítale el hueso.", "Saca la pulpa de una mitad con una cuchara o córtala en cubos.", "Espolvorea canela.", "Está en su punto cuando al presionarlo cede un poco, como un aguacate maduro."]),
  R("esquites-ligeros", "Esquites ligeros", ["colacion", "cena"], 15, ["estufa"], [
    ["elote", 150, "1 vaso de granos de elote"], ["queso-fresco", 10, "Queso fresco"], ["yogur-griego", 20, "Yogur griego en lugar de mayonesa"],
    ["", 0, "Epazote, limón, sal y chile en polvo"],
  ], ["Desgrana el elote con un cuchillo, cortando de arriba hacia abajo (o usa granos de lata escurridos).", "Hierve los granos en agua con sal y una rama de epazote 10 minutos, hasta que estén suaves.", "Escúrrelos y sírvelos en un vaso.", "Agrega el yogur griego (1 cucharada) en lugar de mayonesa y mezcla.", "Termina con queso fresco desmoronado, limón y chile en polvo.", "Tip: sin refri, compra el yogur y el queso el mismo día."]),
  R("palomitas-cacahuates", "Palomitas con cacahuates", ["colacion"], 5, ["estufa", "microondas"], [
    ["palomitas", 16, "2 tazas de palomitas naturales"], ["cacahuates", 15, "Medio puño de cacahuates"], ["", 0, "Limón y chile"],
  ], ["Prepara las palomitas: 1½ cucharadas de maíz palomero en olla tapada a fuego medio, moviendo hasta que los reventones se espacien 3 segundos.", "Mide 2 tazas y ponlas en un tazón.", "Agrega el medio puño de cacahuates.", "Sazona con limón y chile en polvo y mezcla.", "Cómelas al momento para que no se aguaden con el limón."]),
  R("hummus-verduras", "Hummus casero con verduras", ["colacion"], 10, ["licuadora"], [
    ["garbanzos", 80, "½ taza de garbanzos cocidos"], ["aceite", 4.5, "1 cucharadita de aceite de oliva"], ["zanahoria", 60, "Zanahoria en bastones"],
    ["pepino", 60, "Pepino en bastones"], ["", 0, "Limón, ajo, comino y sal"],
  ], ["Si los garbanzos son de lata, enjuágalos; si los cociste tú, guarda un poco del agua.", "Licúa los garbanzos con 1 ajo chico, el jugo de 1 limón, una pizca de comino, sal y la cucharadita de aceite de oliva.", "Agrega 2-3 cucharadas de agua (o del agua de los garbanzos) y licúa hasta que quede cremoso; detén y baja lo que se pega a las paredes.", "Prueba y ajusta sal y limón.", "Pela y corta la zanahoria y el pepino en bastones.", "Sirve el hummus con las verduras para untar. Sin refri, dura 1 día tapado."]),
  R("ensalada-betabel-queso", "Ensalada de betabel, jícama y queso fresco", ["cena", "colacion"], 10, ["ninguno"], [
    ["betabel", 160, "2 betabeles cocidos"], ["jicama", 60, "Jícama en tiras"], ["queso-fresco", 30, "Queso fresco"], ["lechuga", 40, "Lechuga"],
    ["nueces", 10, "Unas nueces"], ["", 0, "Limón y sal"],
  ], ["Si los betabeles son crudos, hiérvelos 40 minutos hasta que un cuchillo entre fácil; déjalos enfriar y pélalos (mancha, usa un plato).", "Córtalos en cubos.", "Pela la jícama y córtala en tiras; lava y pica la lechuga.", "Mezcla todo con el jugo de 1 limón y sal.", "Desmorona el queso fresco y agrega las nueces encima.", "Tip: sin refri, compra el queso el mismo día."]),
];

/* ---------- Valores calculados ---------- */
const POR_ID = new Map(ALIMENTOS.map((a) => [a.id, a]));

export interface Nutricion { kcal: number; proteina: number; carbos: number; grasa: number }

/* ---------- Ajustes por ingrediente y extras ---------- */
/** Prefijo de los ingredientes agregados en los ajustes: { "+huevo": 50 } = 50 g de huevo extra. */
export const EXTRA = "+";

/** Ingredientes agregados a mano: [id, gramos en el plato]. No cambian con la porción. */
export const extrasDe = (ajustes?: Record<string, number>): [string, number][] =>
  Object.entries(ajustes ?? {}).filter(([k, g]) => k.startsWith(EXTRA) && g > 0).map(([k, g]) => [k.slice(EXTRA.length), g]);

const nombreAlimento = (id: string) => {
  const n = POR_ID.get(id)?.n.replace(/\s*\(.*\)\s*$/, "") ?? id;
  return n.charAt(0).toLowerCase() + n.slice(1);
};

const FRAC_INI: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
/** La porción del alimento en unidad simple: "¼ pieza" (30 g) → 1 pieza = 120 g; "taza" (158 g) → igual. */
function unidadDe(id: string): { t: string; g: number } | null {
  const p = POR_ID.get(id)?.por[0];
  if (!p?.g) return null;
  const m = p.t.match(/^(\d+(?:\.\d+)?)?([½¼¾])?\s+(.+)$/);
  const v = m && (m[1] || m[2]) ? (m[1] ? Number(m[1]) : 0) + (m[2] ? FRAC_INI[m[2]] : 0) : 1;
  return { t: m && (m[1] || m[2]) ? m[3] : p.t, g: p.g / v };
}
const contable = (t: string) => esPieza(t.split(/\s/)[0]);

/** Paso de − y + de un extra: piezas enteras de una en una; lo demás de 10 g (5 g si la porción es chica). */
export function pasoExtra(id: string): number {
  // Solo si la porción es una pieza entera (huevo, rebanada); "¼ pieza" de cebolla va por gramos
  const p = POR_ID.get(id)?.por[0];
  if (p?.g && contable(p.t)) return p.g;
  return p?.g && p.g < 20 ? 5 : 10;
}

/** Cuánto se pone al agregarlo: una porción común (una pieza, ½ taza, ¼ de cebolla…). */
export const gramosAlAgregar = (id: string) => Math.round(POR_ID.get(id)?.por[0]?.g || 50);

/** Tope de un extra: 6 piezas o 4 porciones (mínimo 300 g). */
export const topeExtra = (id: string) => {
  const p = POR_ID.get(id)?.por[0];
  return p?.g && contable(p.t) ? p.g * 6 : Math.max(300, gramosAlAgregar(id) * 4);
};

/**
 * Texto del extra en la base de la receta (÷ porción) para que al escalar salga exacto: "1 pieza de huevo entero",
 * "½ taza de arroz"; si no cae en una medida redonda (o serían piezas partidas), en gramos: "20 g de cebolla".
 */
function ingredienteExtra(id: string, g: number, factor: number): Ingrediente {
  const u = unidadDe(id);
  const n = u ? g / u.g : 0;
  const base = +(g / factor).toFixed(3);
  const redondo = u && n > 0 && (contable(u.t)
    ? Math.abs(n - Math.round(n)) < 0.01
    : Math.abs((n < 1 ? n * 4 : n * 2) - Math.round(n < 1 ? n * 4 : n * 2)) < 0.01);
  if (u && redondo) {
    const unidad = n > 1 && !/\s/.test(u.t) ? (/[aeiou]$/.test(u.t) ? `${u.t}s` : `${u.t.replace(/ó/g, "o")}es`) : u.t;
    return [id, base, `${+(n / factor).toFixed(3)} ${unidad} de ${nombreAlimento(id)}`];
  }
  return [id, base, `${base} g de ${nombreAlimento(id)}`];
}

/**
 * La receta con los ingredientes ajustados (sin lechuga, doble pollo…) y los extras agregados al final.
 * Lo quitado queda con 0 g para que no cuente en calorías, súper ni despensa.
 * factor: la porción con la que se va a escalar (los extras ya vienen en gramos del plato y no deben crecer).
 */
export function aplicarAjustes(r: Receta, ajustes?: Record<string, number>, factor = 1): Receta {
  if (!ajustes || !Object.keys(ajustes).length) return r;
  return {
    ...r,
    ing: [
      ...r.ing.map((ing, i) => {
        const m = ajustes[i];
        if (m === undefined || m === 1 || !ing[1]) return ing;
        if (m === 0) return [ing[0], 0, ing[2]] as Ingrediente;
        const e = ajustarIngrediente(ing[1], ing[2], m);
        return [ing[0], e.g, e.t] as Ingrediente;
      }),
      ...extrasDe(ajustes).filter(([id]) => POR_ID.has(id)).map(([id, g]) => ingredienteExtra(id, g, factor)),
    ],
  };
}

/** "Sin lechuga · doble pollo · con aguacate" (para mostrar en la tarjeta del menú). */
export function resumenAjustes(r: Receta, ajustes?: Record<string, number>): string {
  if (!ajustes) return "";
  const nombre = (i: number) => (POR_ID.get(r.ing[i]?.[0])?.n ?? r.ing[i]?.[2] ?? "").replace(/ \(.*\)|,.*$/g, "").toLowerCase();
  const partes = Object.entries(ajustes).filter(([k, m]) => !k.startsWith(EXTRA) && m !== 1).map(([k, m]) => {
    const n = nombre(Number(k));
    return m === 0 ? `sin ${n}` : m < 1 ? `menos ${n}` : m === 2 ? `doble ${n}` : `más ${n}`;
  });
  for (const [id] of extrasDe(ajustes)) if (POR_ID.has(id)) partes.push(`con ${nombreAlimento(id).replace(/,.*$/, "")}`);
  const t = partes.join(" · ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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
  // Pasos detallados (2026-11-21)
  .replace(/ con unas gotas de aceite \(pásalas con una servilleta\)/g, "")
  .replace(/ con unas gotas de aceite, /g, " antiadherente, ")
  .replace(/ con la cucharadita de aceite( de oliva)?, /g, " con ")
  .replace(/Sartén: calienta la cucharadita de aceite a fuego/g, "Sartén antiadherente a fuego")
  .replace(/Calienta (el|la mitad del) aceite en (un )?sartén/g, "Calienta un sartén antiadherente")
  .replace(/Calienta unas gotas de aceite en sartén/g, "Calienta un sartén antiadherente")
  .replace(/Calienta (unas gotas de|el) aceite a fuego/g, "Calienta un sartén antiadherente a fuego")
  .replace(/calienta la cucharadita de aceite a fuego/g, "calienta un sartén antiadherente a fuego")
  .replace(/Calienta el aceite y /g, "Calienta un sartén antiadherente y ")
  .replace(/, pon el resto del aceite y /g, " y ")
  .replace(/En un sartén con el aceite a fuego/g, "En un sartén antiadherente a fuego")
  .replace(/Sartén: unas gotas de aceite a fuego/g, "Sartén antiadherente a fuego")
  .replace(/ con (la cucharadita de|unas gotas de) aceite (a fuego|\d)/g, " antiadherente $2")
  .replace(/, un chorrito de aceite( de oliva)? y /g, " y ")
  .replace(/, sal y la cucharadita de aceite( de oliva)?/g, " y sal")
  .replace(/, con 1 cucharadita de aceite o sin aceite si es antiadherente/g, ", sin aceite (mejor en olla antiadherente)")
  .replace(/ en el aceite/g, " en sartén antiadherente")
  .replace(/ con unas gotas de aceite/g, " antiadherente, sin aceite")
  .replace(/, aceite( de oliva)? y /g, " y ")
  .replace(/ con aceite y /g, " con ")
  .replace(/ con aceite, /g, " con ")
  .replace(/aceite( de oliva)?, /g, "");
function sinAceite(r: Receta): Receta {
  if (!r.ing.some(([id, , t]) => id === "aceite" || (!id && /aceite/i.test(t))) && !r.pasos.some((p) => /aceite/i.test(p))) return r;
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
