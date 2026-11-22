/**
 * Guiones de los videos de Brío. Cada paso:
 *  { portada } | { capitulo, titulo, sub, antes: [pasos] } | { final }
 *  { texto: "subtítulo con <b>resaltado</b>" | null }  { tab: "Comida" }  { tocar: "Texto" | ["Texto", "Alternativa"] }
 *  { tocarSel: "css", n }  { escribir: "volovan", en: "css" }  { bajar: 400 }  { irA: "Título" }  { arriba: true }  { cerrar: true }  { esperar: ms }
 */
const BUSCAR = "[role=dialog] input[placeholder^='Busca']";

const hoy = [
  { capitulo: "01", titulo: "Tu día de un vistazo", sub: "Calorías, agua, hábitos y racha.", antes: [{ tab: "Hoy", esperar: 300 }] },
  { texto: "Tus <b>calorías y macros</b>, calculadas para tu meta", esperar: 2200 },
  { tocar: "+250 ml", texto: "Suma tu agua con un toque", esperar: 900 },
  { tocar: "+250 ml", esperar: 1200 },
  { irA: "Hábitos", texto: "Palomea tus hábitos y cuida tu <b>racha</b>", esperar: 1300 },
  { tocar: "Caminar 10,000 pasos", esperar: 900 },
  { tocar: "Leer 15 minutos", texto: "Completa tu día y se enciende la llama", esperar: 4200 },
];
const comida = [
  { capitulo: "02", titulo: "Registra lo que comes", sub: "Más de 250 alimentos con foto, marcas y escáner.", antes: [{ tab: "Comida", esperar: 300 }] },
  { tocar: "+ Registrar comida", texto: "Busca lo que comiste: hasta <b>volovanes</b>", esperar: 900 },
  { escribir: "volovan", en: BUSCAR, esperar: 1100 },
  { tocar: "Volován de jamón con queso", texto: "Elige la porción y ve sus macros", esperar: 1500 },
  { tocar: "Agregar al plato", esperar: 900 },
  { tocar: "Registrar plato", texto: "Y si lo tienes en tu despensa, <b>se descuenta solo</b>", esperar: 2000 },
];
const menu = [
  { capitulo: "03", titulo: "Tu menú y tu súper", sub: "Brío arma tu semana con tus gustos y tu meta.", antes: [{ tab: "Comida", esperar: 200 }, { tocar: "Menú", esperar: 500 }] },
  { texto: "Tu menú de la semana, con <b>porciones a tu meta</b>", esperar: 1800 },
  { tocar: "Mar", esperar: 1200 },
  { tocarSel: "[data-tour=menu] li button", n: 0, texto: "¿No usaste algo? <b>Quítalo</b> y se recalcula", esperar: 1400 },
  { bajar: 380, esperar: 900 },
  { tocarSel: "button[aria-label^='Menos']", n: 1, esperar: 700 },
  { tocarSel: "button[aria-label^='Menos']", n: 1, esperar: 1600 },
  { cerrar: true, esperar: 700 },
  { tocar: "Cambiar", texto: "Cámbialo por otro con un buscador", esperar: 1500 },
  { bajar: 400, esperar: 1300 },
  { cerrar: true, esperar: 600 },
  { irA: "Lista del súper", texto: "Y tu <b>lista del súper</b> con precios aproximados", esperar: 1400 },
  { bajar: 500, esperar: 1600 },
];
const recetas = [
  { capitulo: "04", titulo: "129 recetas mexicanas", sub: "Con foto, calorías, precio y pasos detallados.", antes: [{ tab: "Comida", esperar: 200 }, { tocar: "Recetas", esperar: 500 }] },
  { bajar: 420, texto: "Económicas, rápidas y <b>sin refri</b> si lo necesitas", esperar: 1600 },
  { tocarSel: "button.group", n: 2, esperar: 1500 },
  { bajar: 650, texto: "Paso a paso, con tiempos y tips", esperar: 1600 },
  { bajar: 650, esperar: 1600 },
  { cerrar: true, esperar: 600 },
];
const entreno = [
  { capitulo: "05", titulo: "Tu rutina de gym", sub: "Series, pesos, descansos y récords.", antes: [{ tab: "Entreno", esperar: 300 }] },
  { texto: "Brío te dice <b>qué te toca hoy</b>", esperar: 2000 },
  { tocar: ["Empezar entreno", "Entrenar de todos modos"], esperar: 1500 },
  { tocarSel: "button[aria-label='Serie 1 hecha']", texto: "Marca cada serie y arranca tu descanso", esperar: 2600 },
  { tocar: "Saltar", esperar: 500 },
  { tocarSel: "button[aria-label='Serie 2 hecha']", esperar: 1400 },
  { tocar: "Saltar", esperar: 500 },
  { tocarSel: "button[aria-label='Serie 3 hecha']", texto: "Terminas un ejercicio y lo festeja contigo", esperar: 2800 },
  { tocar: "Saltar", esperar: 600 },
];
const progreso = [
  { capitulo: "06", titulo: "Tu semana y tus metas", sub: "Cuerpo, gym, dinero y aprendizaje.", antes: [{ tab: "Progreso", esperar: 300 }] },
  { texto: "Cómo te fue en la semana y qué mejorar", esperar: 1800 },
  { bajar: 420, esperar: 1500 },
  { tocar: "Metas", texto: "Metas de <b>dinero, aprendizaje y salud</b>", esperar: 1800 },
  { tocar: "Cuerpo", texto: "Tu peso con proyección a tu meta", esperar: 1600 },
  { bajar: 450, esperar: 1800 },
];
const dia = [
  { capitulo: "07", titulo: "Organiza tu día", sub: "Gym, cocina, baño y tiempo para ti, sin choques.", antes: [{ tab: "Hoy", esperar: 300 }, { irA: "Tu día", esperar: 600 }] },
  { tocar: "Ver mi día →", texto: "Brío arma tu día con tu horario", esperar: 1600 },
  { bajar: 420, esperar: 1500 },
  { tocar: "Editar horario", texto: "Antes del gym, súper semanal, <b>tiempo para ti</b>…", esperar: 1300 },
  { bajar: 900, esperar: 1300 },
  { bajar: 900, esperar: 1300 },
  { cerrar: true, esperar: 500 },
];

export const GUIONES = {
  celular: {
    viewport: { width: 360, height: 640 }, escala: 2, video: { width: 720, height: 1280 }, tactil: true, portadaEn: 11.5,
    pasos: [
      { portada: true },
      { texto: "Tu comida, tu gym y tus metas. <b>En una sola app.</b>", esperar: 2200 },
      ...hoy, ...comida, ...menu, ...recetas, ...entreno, ...progreso, ...dia,
      { final: true },
    ],
  },
  computadora: {
    viewport: { width: 1280, height: 720 }, escala: 1, video: { width: 1280, height: 720 }, oscuro: true, portadaEn: 13.5,
    pasos: [
      { portada: true },
      { texto: "También en tu computadora, con <b>modo oscuro</b>", esperar: 2400 },
      ...hoy, ...menu, ...recetas.slice(0, 4), { cerrar: true }, ...entreno, ...progreso.slice(0, 4), ...dia.slice(0, 3), { cerrar: true },
      { final: true },
    ],
  },
  corto: {
    viewport: { width: 360, height: 640 }, escala: 1.5, video: { width: 540, height: 960 }, tactil: true, musica: false, portadaEn: 5,
    pasos: [
      { portada: true, dur: 1600 },
      { texto: "Tu comida, tu gym y tus metas. <b>En una sola app.</b>", esperar: 2000 },
      { tocar: "Caminar 10,000 pasos", esperar: 700 },
      { tocar: "Leer 15 minutos", texto: "Cuida tu <b>racha</b> de días con brío", esperar: 4000 },
      { tab: "Comida", texto: null, esperar: 600 },
      { tocar: "Menú", texto: "Tu menú de la semana, a tu meta", esperar: 1800 },
      { tocar: "Recetas", texto: "129 recetas mexicanas con foto", esperar: 1200 },
      { bajar: 500, esperar: 1500 },
      { tab: "Entreno", texto: "Tu rutina de gym, serie por serie", esperar: 2200 },
      { tab: "Progreso", texto: "Tu semana y tus metas", esperar: 2200 },
      { final: true, dur: 2600 },
    ],
  },
};
