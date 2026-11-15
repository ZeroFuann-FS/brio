/** Rutinas de inicio. Reps con "s" = segundos. */
import type { EjRutina, Rutina } from "../lib/entreno";

const e = (ej: string, series: number, reps: string, descanso = 90): EjRutina => ({ ej, series, reps, descanso });

export interface Plantilla { id: string; nombre: string; desc: string; nivel: string; lugar: string; dias: { nombre: string; ejercicios: EjRutina[] }[] }

export const PLANTILLAS: Plantilla[] = [
  {
    id: "full-gym", nombre: "Cuerpo completo · 3 días", nivel: "Principiante", lugar: "Gym",
    desc: "Todo el cuerpo en cada sesión. Ideal si vas 3 veces por semana (lunes, miércoles y viernes).",
    dias: [
      { nombre: "Día A", ejercicios: [e("sentadilla", 3, "8-10", 120), e("press-banca", 3, "8-10", 120), e("remo-polea", 3, "10-12"), e("press-hombro-sentado", 3, "10"), e("curl-femoral-acostado", 3, "12", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Día B", ejercicios: [e("peso-muerto-rumano", 3, "8-10", 120), e("press-inclinado", 3, "10"), e("jalon-pecho", 3, "10"), e("elevaciones-laterales", 3, "12-15", 60), e("prensa", 3, "12"), e("abdominales", 3, "15", 45)] },
      { nombre: "Día C", ejercicios: [e("sentadilla-goblet", 3, "12"), e("press-mancuernas", 3, "10"), e("remo-mancuerna", 3, "10"), e("hip-thrust", 3, "10"), e("curl-mancuernas", 3, "12", 60), e("triceps-polea", 3, "12", 60)] },
    ],
  },
  {
    id: "barrio", nombre: "Gym básico · 3 días", nivel: "Principiante", lugar: "Mancuernas y banco",
    desc: "Para gyms chicos con pocas máquinas: solo mancuernas, un banco y tu peso.",
    dias: [
      { nombre: "Día A", ejercicios: [e("sentadilla-goblet", 3, "12"), e("press-mancuernas", 3, "10"), e("remo-mancuerna", 3, "10"), e("press-hombro-sentado", 3, "10"), e("curl-martillo", 3, "12", 60), e("plancha", 3, "30s", 45)] },
      { nombre: "Día B", ejercicios: [e("peso-muerto-mancuernas", 3, "10"), e("press-inclinado", 3, "10"), e("desplantes-mancuernas", 3, "10"), e("elevaciones-laterales", 3, "12-15", 60), e("extension-triceps", 3, "12", 60), e("abdominales", 3, "15", 45)] },
      { nombre: "Día C", ejercicios: [e("sentadilla-mancuernas", 3, "12"), e("lagartijas", 3, "8-15"), e("pajaros", 3, "12", 60), e("subidas-banco", 3, "10"), e("curl-mancuernas", 3, "12", 60), e("fondos-banco", 3, "10-12", 60), e("giros-rusos", 3, "20", 45)] },
    ],
  },
  {
    id: "torso-pierna", nombre: "Torso / Pierna · 4 días", nivel: "Intermedio", lugar: "Gym",
    desc: "Cada músculo 2 veces por semana. Por ejemplo: lunes y jueves torso, martes y viernes pierna.",
    dias: [
      { nombre: "Torso A", ejercicios: [e("press-banca", 4, "6-8", 150), e("remo-barra", 4, "8", 120), e("press-militar", 3, "8", 120), e("jalon-pecho", 3, "10"), e("curl-barra", 2, "12", 60), e("triceps-cuerda", 2, "12", 60)] },
      { nombre: "Pierna A", ejercicios: [e("sentadilla", 4, "6-8", 150), e("peso-muerto-rumano", 3, "8", 120), e("prensa", 3, "12"), e("curl-femoral-sentado", 3, "12", 60), e("pantorrilla-de-pie", 4, "12", 60), e("abdominal-polea", 3, "15", 45)] },
      { nombre: "Torso B", ejercicios: [e("press-inclinado", 4, "8-10", 120), e("remo-polea", 4, "10"), e("press-hombro-sentado", 3, "10"), e("dominadas", 3, "6-10", 120), e("elevaciones-laterales", 3, "15", 60), e("curl-martillo", 2, "12", 60)] },
      { nombre: "Pierna B", ejercicios: [e("peso-muerto", 3, "5", 180), e("hack-squat", 3, "10", 120), e("desplantes-mancuernas", 3, "10"), e("hip-thrust", 3, "10"), e("pantorrilla-sentado", 3, "15", 60), e("elevacion-piernas", 3, "12", 60)] },
    ],
  },
  {
    id: "ppl", nombre: "Empuje / Jalón / Pierna · 3 días", nivel: "Intermedio", lugar: "Gym",
    desc: "Un día para empujar (pecho, hombro, tríceps), otro para jalar (espalda, bíceps) y otro de pierna. Repítelo para 6 días.",
    dias: [
      { nombre: "Empuje", ejercicios: [e("press-banca", 4, "6-8", 150), e("press-inclinado", 3, "10"), e("press-militar", 3, "8", 120), e("elevaciones-laterales", 3, "15", 60), e("triceps-cuerda", 3, "12", 60), e("extension-triceps", 2, "12", 60)] },
      { nombre: "Jalón", ejercicios: [e("dominadas", 4, "6-10", 120), e("remo-barra", 3, "8", 120), e("remo-polea", 3, "12"), e("face-pull", 3, "15", 60), e("curl-barra", 3, "10", 60), e("curl-martillo", 2, "12", 60)] },
      { nombre: "Pierna", ejercicios: [e("sentadilla", 4, "6-8", 150), e("peso-muerto-rumano", 3, "8", 120), e("prensa", 3, "12"), e("curl-femoral-acostado", 3, "12", 60), e("pantorrilla-de-pie", 4, "12", 60), e("plancha", 3, "45s", 45)] },
    ],
  },
  {
    id: "casa", nombre: "En casa sin equipo · 3 días", nivel: "Principiante", lugar: "Casa",
    desc: "Solo tu peso y una silla. Bueno para días que no puedes ir al gym o si llueve.",
    dias: [
      { nombre: "Casa A", ejercicios: [e("sentadilla-libre", 3, "15-20", 60), e("lagartijas", 3, "8-15", 60), e("puente-gluteo", 3, "15", 60), e("superman", 3, "12", 45), e("plancha", 3, "30-45s", 45), e("escaladores", 3, "30s", 45)] },
      { nombre: "Casa B", ejercicios: [e("desplantes-caminando", 3, "12", 60), e("fondos-banco", 3, "10-12", 60), e("sentadilla-dividida", 3, "10", 60), e("patadas-aleteo", 3, "20", 45), e("plancha-lateral", 3, "20-30s", 45), e("bicicleta", 3, "20", 45)] },
      { nombre: "Casa C", ejercicios: [e("sentadilla-libre", 4, "20", 60), e("lagartijas", 4, "10-15", 60), e("subidas-banco", 3, "12", 60), e("abdominales", 3, "20", 45), e("giros-rusos", 3, "20", 45), e("superman", 3, "12", 45)] },
    ],
  },
];

export function rutinaDePlantilla(p: Plantilla, uid: () => string): Rutina {
  return { id: uid(), nombre: p.nombre.split(" · ")[0], plantilla: p.id, dias: p.dias.map((d) => ({ id: uid(), nombre: d.nombre, ejercicios: d.ejercicios.map((x) => ({ ...x })) })) };
}
