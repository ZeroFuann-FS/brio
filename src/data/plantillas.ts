/** Rutinas de inicio. Reps con "s" = segundos. */
import { asignarSemana, semanaSugerida, type EjRutina, type Lugar, type Rutina } from "../lib/entreno";

const e = (ej: string, series: number, reps: string, descanso = 90): EjRutina => ({ ej, series, reps, descanso });

export interface Plantilla {
  id: string; nombre: string; desc: string; nivel: "Principiante" | "Intermedio"; lugar: Lugar; enfoque: string;
  dias: { nombre: string; ejercicios: EjRutina[] }[];
}
export const NOMBRE_LUGAR: Record<Lugar, string> = { gym: "Gym completo", basico: "Gym básico", casa: "En casa" };

export const PLANTILLAS: Plantilla[] = [
  {
    id: "full-2", nombre: "Cuerpo completo · 2 días", nivel: "Principiante", lugar: "gym", enfoque: "Empezar",
    desc: "Lo mínimo para avanzar si tienes poco tiempo: dos sesiones a la semana de todo el cuerpo.",
    dias: [
      { nombre: "Cuerpo completo A", ejercicios: [e("sentadilla-goblet", 3, "10-12"), e("press-mancuernas", 3, "8-12"), e("jalon-pecho", 3, "10-12"), e("peso-muerto-mancuernas", 3, "10"), e("elevaciones-laterales", 2, "12-15", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Cuerpo completo B", ejercicios: [e("prensa", 3, "10-12"), e("press-hombro-sentado", 3, "8-12"), e("remo-polea", 3, "10-12"), e("hip-thrust", 3, "10"), e("curl-mancuernas", 2, "12", 60), e("triceps-cuerda", 2, "12", 60)] },
    ],
  },
  {
    id: "full-gym", nombre: "Cuerpo completo · 3 días", nivel: "Principiante", lugar: "gym", enfoque: "Fuerza general",
    desc: "Todo el cuerpo en cada sesión. La mejor forma de empezar si vas 3 veces por semana.",
    dias: [
      { nombre: "Cuerpo completo A", ejercicios: [e("sentadilla", 3, "8-10", 120), e("press-banca", 3, "8-10", 120), e("remo-polea", 3, "10-12"), e("press-hombro-sentado", 3, "10"), e("curl-femoral-acostado", 3, "12", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Cuerpo completo B", ejercicios: [e("peso-muerto-rumano", 3, "8-10", 120), e("press-inclinado", 3, "10"), e("jalon-pecho", 3, "10"), e("elevaciones-laterales", 3, "12-15", 60), e("prensa", 3, "12"), e("abdominales", 3, "15", 45)] },
      { nombre: "Cuerpo completo C", ejercicios: [e("sentadilla-goblet", 3, "12"), e("press-mancuernas", 3, "10"), e("remo-mancuerna", 3, "10"), e("hip-thrust", 3, "10"), e("curl-mancuernas", 3, "12", 60), e("triceps-polea", 3, "12", 60)] },
    ],
  },
  {
    id: "barrio", nombre: "Gym básico · 3 días", nivel: "Principiante", lugar: "basico", enfoque: "Pocas máquinas",
    desc: "Para gyms chicos: solo mancuernas, un banco, barra de dominadas y tu peso.",
    dias: [
      { nombre: "Cuerpo completo A", ejercicios: [e("sentadilla-goblet", 3, "12"), e("press-mancuernas", 3, "10"), e("remo-mancuerna", 3, "10"), e("press-hombro-sentado", 3, "10"), e("curl-martillo", 3, "12", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Cuerpo completo B", ejercicios: [e("peso-muerto-mancuernas", 3, "10"), e("press-inclinado", 3, "10"), e("desplantes-mancuernas", 3, "10"), e("elevaciones-laterales", 3, "12-15", 60), e("extension-triceps", 3, "12", 60), e("abdominales", 3, "15", 45)] },
      { nombre: "Cuerpo completo C", ejercicios: [e("sentadilla-mancuernas", 3, "12"), e("lagartijas", 3, "8-15"), e("remo-dos-mancuernas", 3, "10"), e("subidas-banco", 3, "10"), e("pajaros", 3, "12", 60), e("curl-mancuernas", 3, "12", 60), e("fondos-banco", 3, "10-12", 60)] },
    ],
  },
  {
    id: "torso-pierna", nombre: "Torso / Pierna · 4 días", nivel: "Intermedio", lugar: "gym", enfoque: "Músculo",
    desc: "Cada músculo 2 veces por semana: dos días de torso y dos de pierna.",
    dias: [
      { nombre: "Torso A", ejercicios: [e("press-banca", 4, "6-8", 150), e("remo-barra", 4, "8", 120), e("press-militar", 3, "8", 120), e("jalon-pecho", 3, "10"), e("curl-barra", 2, "12", 60), e("triceps-cuerda", 2, "12", 60)] },
      { nombre: "Pierna A", ejercicios: [e("sentadilla", 4, "6-8", 150), e("peso-muerto-rumano", 3, "8", 120), e("prensa", 3, "12"), e("curl-femoral-sentado", 3, "12", 60), e("pantorrilla-de-pie", 4, "12", 60), e("abdominal-polea", 3, "15", 45)] },
      { nombre: "Torso B", ejercicios: [e("press-inclinado", 4, "8-10", 120), e("remo-polea", 4, "10"), e("press-hombro-sentado", 3, "10"), e("dominadas", 3, "6-10", 120), e("elevaciones-laterales", 3, "15", 60), e("curl-martillo", 2, "12", 60)] },
      { nombre: "Pierna B", ejercicios: [e("peso-muerto", 3, "5", 180), e("hack-squat", 3, "10", 120), e("desplantes-mancuernas", 3, "10"), e("hip-thrust", 3, "10"), e("pantorrilla-sentado", 3, "15", 60), e("elevacion-piernas", 3, "12", 60)] },
    ],
  },
  {
    id: "gluteo-pierna", nombre: "Glúteo y pierna · 4 días", nivel: "Intermedio", lugar: "gym", enfoque: "Glúteo",
    desc: "Más volumen para glúteo y pierna, sin dejar de lado el torso.",
    dias: [
      { nombre: "Glúteo", ejercicios: [e("hip-thrust", 4, "8-12", 120), e("peso-muerto-rumano", 3, "10", 120), e("patada-polea", 3, "12-15", 60), e("abductor-maquina", 3, "15", 60), e("puente-gluteo", 2, "15", 45)] },
      { nombre: "Torso", ejercicios: [e("jalon-pecho", 3, "10-12"), e("press-mancuernas", 3, "10"), e("remo-polea", 3, "12"), e("press-hombro-sentado", 3, "10"), e("elevaciones-laterales", 3, "15", 60), e("triceps-cuerda", 2, "12", 60)] },
      { nombre: "Pierna", ejercicios: [e("sentadilla", 4, "8-10", 150), e("prensa", 3, "12"), e("desplante-atras", 3, "10"), e("curl-femoral-acostado", 3, "12", 60), e("extension-pierna", 3, "15", 60), e("pantorrilla-de-pie", 3, "15", 60)] },
      { nombre: "Glúteo y core", ejercicios: [e("sentadilla-sumo-mancuerna", 3, "12"), e("subidas-banco", 3, "10"), e("pull-through", 3, "12"), e("caminata-monstruo", 3, "20", 45), e("plancha", 3, "40s", 45), e("bicho-muerto", 3, "12", 45)] },
    ],
  },
  {
    id: "ppl", nombre: "Empuje / Jalón / Pierna", nivel: "Intermedio", lugar: "gym", enfoque: "Músculo",
    desc: "Un día para empujar (pecho, hombro, tríceps), otro para jalar (espalda, bíceps) y otro de pierna. Hazlo 3 o 6 días.",
    dias: [
      { nombre: "Empuje", ejercicios: [e("press-banca", 4, "6-8", 150), e("press-inclinado", 3, "10"), e("press-militar", 3, "8", 120), e("elevaciones-laterales", 3, "15", 60), e("triceps-cuerda", 3, "12", 60), e("extension-triceps", 2, "12", 60)] },
      { nombre: "Jalón", ejercicios: [e("dominadas", 4, "6-10", 120), e("remo-barra", 3, "8", 120), e("remo-polea", 3, "12"), e("face-pull", 3, "15", 60), e("curl-barra", 3, "10", 60), e("curl-martillo", 2, "12", 60)] },
      { nombre: "Pierna", ejercicios: [e("sentadilla", 4, "6-8", 150), e("peso-muerto-rumano", 3, "8", 120), e("prensa", 3, "12"), e("curl-femoral-acostado", 3, "12", 60), e("pantorrilla-de-pie", 4, "12", 60), e("plancha", 3, "45s", 45)] },
    ],
  },
  {
    id: "torso-pierna-5", nombre: "Torso / Pierna + brazos · 5 días", nivel: "Intermedio", lugar: "gym", enfoque: "Músculo",
    desc: "Torso y pierna dos veces, más un día para hombro y brazos.",
    dias: [
      { nombre: "Torso A", ejercicios: [e("press-banca", 4, "6-8", 150), e("remo-barra", 4, "8", 120), e("press-hombro-sentado", 3, "10"), e("jalon-pecho", 3, "10")] },
      { nombre: "Pierna A", ejercicios: [e("sentadilla", 4, "6-8", 150), e("peso-muerto-rumano", 3, "8", 120), e("extension-pierna", 3, "12", 60), e("pantorrilla-de-pie", 4, "12", 60)] },
      { nombre: "Torso B", ejercicios: [e("press-inclinado", 4, "8-10", 120), e("remo-polea", 4, "10"), e("aperturas", 3, "12", 60), e("jalon-cerrado", 3, "10")] },
      { nombre: "Pierna B", ejercicios: [e("prensa", 4, "10", 120), e("hip-thrust", 3, "10"), e("curl-femoral-sentado", 3, "12", 60), e("desplantes-mancuernas", 3, "10")] },
      { nombre: "Hombro y brazos", ejercicios: [e("press-arnold", 3, "10"), e("elevaciones-laterales", 4, "15", 60), e("pajaros-polea", 3, "15", 60), e("curl-barra-z", 3, "10", 60), e("rompecraneos", 3, "10", 60), e("curl-martillo", 3, "12", 60), e("triceps-cuerda", 3, "12", 60)] },
    ],
  },
  {
    id: "casa", nombre: "En casa sin equipo · 3 días", nivel: "Principiante", lugar: "casa", enfoque: "Sin equipo",
    desc: "Solo tu peso y una silla. Para días que no puedes ir al gym o si llueve.",
    dias: [
      { nombre: "En casa A", ejercicios: [e("sentadilla-libre", 3, "15-20", 60), e("lagartijas", 3, "8-15", 60), e("puente-gluteo", 3, "15", 60), e("superman", 3, "12", 45), e("plancha", 3, "30-45s", 45), e("escaladores", 3, "30s", 45)] },
      { nombre: "En casa B", ejercicios: [e("desplantes-caminando", 3, "12", 60), e("fondos-banco", 3, "10-12", 60), e("sentadilla-dividida", 3, "10", 60), e("patadas-aleteo", 3, "20", 45), e("plancha-lateral", 3, "20-30s", 45), e("bicicleta", 3, "20", 45)] },
      { nombre: "En casa C", ejercicios: [e("sentadilla-silla", 3, "15", 60), e("lagartijas-inclinadas", 3, "12", 60), e("patada-gluteo", 3, "15", 45), e("crunch-inverso", 3, "15", 45), e("saltos-estrella", 3, "30s", 45), e("bicho-muerto", 3, "12", 45)] },
    ],
  },
  {
    id: "casa-mancuernas", nombre: "En casa con mancuernas · 3 días", nivel: "Principiante", lugar: "casa", enfoque: "Mancuernas",
    desc: "Si tienes un par de mancuernas en casa: todo el cuerpo sin ir al gym.",
    dias: [
      { nombre: "Cuerpo completo A", ejercicios: [e("sentadilla-goblet", 3, "12"), e("press-mancuernas", 3, "10"), e("remo-mancuerna", 3, "10"), e("press-hombro-pie", 3, "10"), e("curl-alterno", 3, "12", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Cuerpo completo B", ejercicios: [e("peso-muerto-mancuernas", 3, "10"), e("lagartijas", 3, "10-15"), e("desplante-atras", 3, "10"), e("elevaciones-laterales", 3, "15", 60), e("extension-triceps", 3, "12", 60), e("giros-rusos", 3, "20", 45)] },
      { nombre: "Cuerpo completo C", ejercicios: [e("sentadilla-sumo-mancuerna", 3, "12"), e("remo-dos-mancuernas", 3, "10"), e("sentadilla-dividida-mancuernas", 3, "10"), e("pajaros", 3, "12", 60), e("curl-martillo", 3, "12", 60), e("bicho-muerto", 3, "12", 45)] },
    ],
  },
];

export function rutinaDePlantilla(p: Plantilla, uid: () => string, semana?: number[]): Rutina {
  const r: Rutina = { id: uid(), nombre: p.nombre.split(" · ")[0], plantilla: p.id, dias: p.dias.map((d) => ({ id: uid(), nombre: d.nombre, ejercicios: d.ejercicios.map((x) => ({ ...x })) })) };
  return asignarSemana(r, semana ?? semanaSugerida(p.dias.length));
}

/** Qué tan bien encaja una plantilla con lo que contestó (más alto = mejor). */
export function encaje(p: Plantilla, lugar: Lugar, dias: number, nivel: string) {
  let s = 0;
  if (p.lugar === lugar) s += 10; else if (lugar === "gym" && p.lugar === "basico") s += 4; else if (lugar === "basico" && p.lugar === "casa") s += 2; else s -= 10;
  const n = p.dias.length;
  s -= Math.abs(n - dias) * 3;
  if (p.id === "ppl" && dias === 6) s += 6;
  if (p.nivel === nivel) s += 3;
  return s;
}
