/**
 * Datos de demostración de Brío ("ZeroFuann"): TODO es inventado.
 * Sirven para capturas, la página /conoce y los videos. Las fechas son relativas a hoy,
 * así que la app siempre se ve "al día".
 *
 * Uso: npx tsx herramientas/demo/datos-demo.ts > demo.json
 * El JSON es el estado del store (lo que va en localStorage "brio:datos-v3").
 */
import { hoyISO, sumarDias, calcularMetas, type Perfil } from "../../src/lib/calc";
import { generarMenuReglas } from "../../src/lib/menu";
import { recetaPorId, nutricion, gramosIng } from "../../src/data/recetas";
import { equivalentesDe } from "../../src/data/equivalentes";
import { ejercicioPorId } from "../../src/data/ejercicios";
import { CATALOGO_HABITOS, type Dia, type ItemDespensa } from "../../src/lib/store";
import { recordsDe, type Rutina, type Sesion } from "../../src/lib/entreno";
import type { Meta } from "../../src/lib/metas";

// Números "aleatorios" pero siempre iguales (para que las capturas no cambien cada vez)
let semilla = 7;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

export function crearDemo(hoy = hoyISO()) {
  const dia = (n: number) => sumarDias(hoy, n);
  const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  const rutina: Rutina = {
    id: "demo-rutina", nombre: "Torso y pierna",
    dias: [
      { id: "t1", nombre: "Torso", semana: [1, 4], ejercicios: [
        { ej: "press-banca", series: 4, reps: "8-10", descanso: 120 },
        { ej: "jalon-pecho", series: 4, reps: "10-12", descanso: 90 },
        { ej: "press-hombro-sentado", series: 3, reps: "10-12", descanso: 90 },
        { ej: "remo-polea", series: 3, reps: "10-12", descanso: 90 },
        { ej: "curl-mancuernas", series: 3, reps: "10-12", descanso: 60 },
        { ej: "triceps-cuerda", series: 3, reps: "12-15", descanso: 60 },
        { ej: "plancha", series: 3, reps: "40 s", descanso: 45 },
      ] },
      { id: "p1", nombre: "Pierna", semana: [2, 5], ejercicios: [
        { ej: "sentadilla", series: 4, reps: "8-10", descanso: 150 },
        { ej: "peso-muerto-rumano", series: 3, reps: "10", descanso: 120 },
        { ej: "prensa", series: 3, reps: "12", descanso: 90 },
        { ej: "curl-femoral-acostado", series: 3, reps: "12", descanso: 60 },
        { ej: "hiperextensiones", series: 3, reps: "15", descanso: 60 },
        { ej: "pantorrilla-de-pie", series: 4, reps: "15", descanso: 45 },
        { ej: "crunch-inverso", series: 3, reps: "15", descanso: 45 },
      ] },
      { id: "c1", nombre: "Full body ligero", semana: [6], ejercicios: [
        { ej: "press-mancuernas", series: 3, reps: "12", descanso: 90 },
        { ej: "remo-mancuerna", series: 3, reps: "12", descanso: 90 },
        { ej: "sentadilla-goblet", series: 3, reps: "12", descanso: 90 },
        { ej: "elevaciones-laterales", series: 3, reps: "15", descanso: 60 },
        { ej: "caminar", series: 1, reps: "20 min", descanso: 0 },
      ] },
    ],
  };
  for (const d of rutina.dias) for (const x of d.ejercicios) if (!ejercicioPorId(x.ej)) throw new Error(`Ejercicio inexistente: ${x.ej}`);

  const habitos = CATALOGO_HABITOS.filter((h) => ["entreno", "pasos", "lectura", "sueno", "aprender", "verdura"].includes(h.id));

  const perfil: Perfil = {
    nombre: "ZeroFuann", sexo: "h", edad: 23, estatura: 175, pesoInicial: 84, pesoMeta: 74,
    diaADia: "sentado", diasEntreno: 5, ritmo: 0.75, creado: dia(-45),
    motivo: { titulo: "viaje a la playa", fecha: dia(120) },
    habitos,
    prefsComida: {
      presupuesto: 650, comidas: ["desayuno", "comida", "cena"], colaciones: 1,
      equipo: ["Estufa", "Microondas", "Air fryer", "Refrigerador"], preferencias: "", dias: DIAS,
      gustos: ["pechuga-cocida", "huevo", "atun-agua", "avena", "aguacate", "platano", "frijol-negro", "tortilla-maiz", "nopales", "papaya"],
      evitar: ["camaron", "sardina"],
      favoritas: ["tinga-tostadas", "huevos-mexicana", "avena-platano"],
    },
    entreno: { rutinas: [rutina], activa: rutina.id, lugar: "gym", pasoKg: 5 },
    agenda: {
      despertar: "06:00", dormir: "22:30",
      bloques: [
        { id: "ida", tipo: "traslado", titulo: "Camino al trabajo", inicio: "08:30", fin: "09:00", dias: [1, 2, 3, 4, 5] },
        { id: "trabajo", tipo: "trabajo", titulo: "Trabajo", inicio: "09:00", fin: "17:00", dias: [1, 2, 3, 4, 5] },
        { id: "vuelta", tipo: "traslado", titulo: "Regreso a casa", inicio: "17:00", fin: "17:30", dias: [1, 2, 3, 4, 5] },
      ],
      gym: { hora: "06:30", traslado: 10, extra: 20 },
      comidas: { desayuno: "08:00", comida: "14:00", cena: "20:00", colacion1: "11:00" },
      cocinaManana: ["desayuno", "comida"],
      bano: { min: 15, cuando: "gym" },
      llegada: 5,
      salida: { min: 10, pasos: ["Lonchera", "Mochila", "Llaves"] },
      compras: [{ id: "super", titulo: "Súper de la semana", dia: 0, min: 45 }],
      actividades: [
        { id: "leer", titulo: "Leer", min: 20, cuando: "noche", dias: [0, 1, 2, 3, 4, 5, 6] },
        { id: "curso", titulo: "Curso de programación", min: 45, cuando: "tarde", dias: [1, 2, 3, 4, 5] },
      ],
      habitos: { lectura: { hora: "21:30", min: 20 } },
    },
    recordatorios: { comidas: { activo: true, antes: 30 }, entreno: { activo: true, antes: 60 }, habitos: { activo: true, hora: "21:00" }, agua: { activo: true } },
    metas: [
      { id: "m1", area: "dinero", titulo: "Ahorrar para una laptop nueva", tipo: "monto", objetivo: 18000, creada: dia(-40), fecha: dia(150),
        registros: [{ fecha: dia(-35), v: 2500 }, { fecha: dia(-21), v: 2000 }, { fecha: dia(-7), v: 3000 }] },
      { id: "m2", area: "aprender", titulo: "Terminar el curso de inglés B1", tipo: "pasos", creada: dia(-30),
        pasos: [{ id: "a", t: "Unidad 1", hecho: dia(-25) }, { id: "b", t: "Unidad 2", hecho: dia(-12) }, { id: "c", t: "Unidad 3" }, { id: "d", t: "Examen final" }] },
      { id: "m3", area: "salud", titulo: "Correr 5 km sin parar", tipo: "tiempo", objetivo: 90, creada: dia(-20),
        registros: [{ fecha: dia(-6), v: 30 }, { fecha: dia(-4), v: 25 }, { fecha: dia(-2), v: 30 }] },
    ] as Meta[],
  };

  // Peso: de 84 a ~78.4 kg en 6 semanas, con altibajos normales
  const pesos = Array.from({ length: 13 }, (_, i) => {
    const f = dia(-42 + i * 3.5 | 0);
    return { fecha: f, kg: Math.round((84 - i * 0.47 + (azar() - 0.5) * 0.5) * 10) / 10 };
  });
  const actual = pesos[pesos.length - 1].kg;
  const metas = calcularMetas(perfil, actual);

  // Menú de la semana con las reglas de la app
  const menu = generarMenuReglas({
    dias: DIAS, comidas: ["desayuno", "comida", "cena"], colaciones: 1, kcal: metas.kcal, proteina: metas.proteina,
    presupuesto: 650, equipo: perfil.prefsComida!.equipo, gustos: perfil.prefsComida!.gustos!, evitar: perfil.prefsComida!.evitar!,
    favoritas: perfil.prefsComida!.favoritas!, despensa: [],
  });

  // Días: racha de 16 días, hoy a medias
  const dias: Record<string, Dia> = {};
  const metaAgua = metas.aguaMl;
  for (let n = -34; n <= 0; n++) {
    const f = dia(n);
    const enRacha = n >= -16 && n < 0;
    const hab: Record<string, boolean> = {};
    for (const h of habitos) hab[h.id] = enRacha ? azar() < 0.85 : azar() < 0.55;
    if (enRacha) { hab.entreno = true; hab.sueno = true; hab.pasos = true; hab.verdura = true; }
    dias[f] = { comidas: [], aguaMl: enRacha ? metaAgua : Math.round((metaAgua * (0.4 + azar() * 0.5)) / 250) * 250, habitos: hab };
  }
  // Hoy: desayuno y comida registrados, 1.5 L de agua y 3 hábitos
  const wd = (new Date(`${hoy}T12:00:00`).getDay() + 6) % 7;
  const deHoy = menu.dias.find((d) => d.dia === DIAS[wd]) ?? menu.dias[0];
  dias[hoy] = {
    aguaMl: 1500, habitos: { entreno: true, sueno: true, verdura: true },
    comidas: deHoy.comidas.filter((c) => c.tipo === "desayuno" || c.tipo === "comida").map((c, i) => {
      const r = recetaPorId(c.receta)!; const nu = nutricion(r, c.factor);
      return { id: `c${i}`, nombre: r.nombre, kcal: nu.kcal, proteina: nu.proteina, carbos: nu.carbos, grasa: nu.grasa, tipo: c.tipo as "desayuno" | "comida",
        eq: equivalentesDe(r.ing.map((ing) => [ing[0], gramosIng(ing, c.factor)])) };
    }),
  };

  // Entrenos de las últimas 4 semanas, subiendo peso poco a poco
  const base: Record<string, number> = { "press-banca": 50, "jalon-pecho": 45, "press-hombro-sentado": 14, "remo-polea": 45, "curl-mancuernas": 10,
    "triceps-cuerda": 20, sentadilla: 60, "peso-muerto-rumano": 50, prensa: 120, "curl-femoral-acostado": 30, hiperextensiones: 0,
    "pantorrilla-de-pie": 40, "press-mancuernas": 18, "remo-mancuerna": 20, "sentadilla-goblet": 20, "elevaciones-laterales": 6 };
  const sesiones: Sesion[] = [];
  for (let n = -28; n < 0; n++) {
    const f = dia(n); const w = new Date(`${f}T12:00:00`).getDay();
    const d = rutina.dias.find((x) => x.semana?.includes(w));
    if (!d) continue;
    const semana = Math.floor((n + 28) / 7);
    const inicio = new Date(`${f}T06:30:00`).getTime();
    const s: Sesion = {
      id: `s${f}`, fecha: f, inicio, fin: inicio + (55 + Math.round(azar() * 15)) * 60000, nombre: d.nombre, rutinaId: rutina.id, diaId: d.id,
      ejercicios: d.ejercicios.map((x) => {
        const cardio = ejercicioPorId(x.ej)?.cardio;
        const kg = (base[x.ej] ?? 0) + semana * (base[x.ej] >= 40 ? 5 : base[x.ej] ? 2 : 0);
        const reps = Number((x.reps.match(/\d+/g) ?? ["10"]).slice(-1)[0]) || 10;
        return { ej: x.ej, reps: x.reps, descanso: x.descanso, series: Array.from({ length: x.series }, () => (cardio ? { kg: 0, reps: 0, min: 20, hecha: true } : { kg, reps, hecha: true })) };
      }),
    };
    s.records = recordsDe(s, sesiones);
    sesiones.push(s);
  }

  const despensa: ItemDespensa[] = [
    { id: "d1", nombre: "Huevo", cantidad: 12, unidad: "pzas" },
    { id: "d2", nombre: "Atún en lata", cantidad: 4, unidad: "latas" },
    { id: "d3", nombre: "Avena", cantidad: 0.75, unidad: "kg" },
    { id: "d4", nombre: "Tortilla de maíz", cantidad: 0.5, unidad: "kg" },
    { id: "d5", nombre: "Frijol negro", cantidad: 1, unidad: "kg" },
    { id: "d6", nombre: "Plátano", cantidad: 2, unidad: "pzas", minimo: 3 },
    { id: "d7", nombre: "Aguacate", cantidad: 1, unidad: "pzas", minimo: 2 },
    { id: "d8", nombre: "Pan integral", cantidad: 14, unidad: "rebanadas" },
  ];
  const medidas = [
    { fecha: dia(-42), cintura: 94, cadera: 102, pecho: 104, brazo: 34 },
    { fecha: dia(-21), cintura: 91, cadera: 100, pecho: 103, brazo: 34.5 },
    { fecha: dia(-2), cintura: 88.5, cadera: 99, pecho: 103, brazo: 35 },
  ];

  return { perfil, dias, pesos, despensa, medidas, menu, sesiones, sesionActiva: null };
}

if (process.argv[1]?.endsWith("datos-demo.ts")) {
  process.stdout.write(JSON.stringify(crearDemo()));
}
