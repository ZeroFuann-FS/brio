/** Resumen de una semana (lunes a domingo): hábitos, comida, entreno, peso, agua y metas. */
import { sumarDias, type Metas, type Perfil } from "./calc";
import { seriesHechas, volumen, type Sesion } from "./entreno";
import { sumaEntre, type Meta } from "./metas";
import { diaConBrio, habitosDe, puntosDia, type Dia, type Peso } from "./store";

export interface DiaResumen { fecha: string; brio: boolean; puntos: number; kcal: number; proteina: number; agua: number; registro: boolean; entreno: boolean }
export interface Resumen {
  desde: string; hasta: string; dias: DiaResumen[];
  diasBrio: number; habitosPct: number; diasRegistro: number; kcalProm: number; protProm: number; aguaProm: number;
  entrenos: number; series: number; volumen: number; records: number; metaEntrenos: number;
  pesoIni?: number; pesoFin?: number;
  aprenderMin: number; ahorro: number; pasosHechos: number;
  mejorDia?: DiaResumen; consejos: string[]; logros: string[];
}

export function resumenSemana(o: { perfil: Perfil; metas: Metas; dias: Record<string, Dia>; sesiones: Sesion[]; pesos: Peso[] }, lunes: string): Resumen {
  const { perfil, metas, dias, sesiones, pesos } = o;
  const hab = habitosDe(perfil);
  const hasta = sumarDias(lunes, 6);
  const lista: DiaResumen[] = Array.from({ length: 7 }, (_, i) => {
    const f = sumarDias(lunes, i), d = dias[f];
    const puntos = puntosDia(d, metas.aguaMl, hab);
    return {
      fecha: f, puntos, brio: diaConBrio(f, d, metas.aguaMl, hab),
      kcal: d?.comidas.reduce((a, c) => a + c.kcal, 0) ?? 0, proteina: d?.comidas.reduce((a, c) => a + c.proteina, 0) ?? 0,
      agua: d?.aguaMl ?? 0, registro: !!d?.comidas.length, entreno: sesiones.some((s) => s.fecha === f),
    };
  });
  const conRegistro = lista.filter((d) => d.registro);
  const prom = (l: DiaResumen[], k: "kcal" | "proteina" | "agua") => (l.length ? Math.round(l.reduce((a, d) => a + d[k], 0) / l.length) : 0);
  const ses = sesiones.filter((s) => s.fecha >= lunes && s.fecha <= hasta);
  const pesosSem = pesos.filter((p) => p.fecha >= lunes && p.fecha <= hasta);
  const antes = [...pesos].reverse().find((p) => p.fecha < lunes);
  const mts: Meta[] = perfil.metas ?? [];
  const r: Resumen = {
    desde: lunes, hasta, dias: lista,
    diasBrio: lista.filter((d) => d.brio).length,
    habitosPct: Math.round((lista.reduce((a, d) => a + d.puntos, 0) / (7 * (hab.length + 1))) * 100),
    diasRegistro: conRegistro.length, kcalProm: prom(conRegistro, "kcal"), protProm: prom(conRegistro, "proteina"), aguaProm: prom(lista, "agua"),
    entrenos: ses.length, series: ses.reduce((a, s) => a + seriesHechas(s), 0), volumen: ses.reduce((a, s) => a + volumen(s), 0), records: ses.reduce((a, s) => a + (s.records?.length ?? 0), 0),
    metaEntrenos: (() => {
      const rs = perfil.entreno?.rutinas ?? [], ru = rs.find((x) => x.id === perfil.entreno?.activa) ?? rs[0];
      const n = ru ? ru.dias.reduce((a, d) => a + (d.semana?.length ?? 0), 0) : 0;
      return n || perfil.diasEntreno || 3;
    })(),
    pesoIni: antes?.kg ?? pesosSem[0]?.kg, pesoFin: pesosSem.length ? pesosSem[pesosSem.length - 1].kg : undefined,
    aprenderMin: mts.filter((m) => m.tipo === "tiempo").reduce((a, m) => a + sumaEntre(m, lunes, hasta), 0),
    ahorro: mts.filter((m) => m.tipo === "monto").reduce((a, m) => a + sumaEntre(m, lunes, hasta), 0),
    pasosHechos: mts.reduce((a, m) => a + (m.pasos ?? []).filter((p) => p.hecho && p.hecho >= lunes && p.hecho <= hasta).length, 0),
    consejos: [], logros: [],
  };
  r.mejorDia = [...lista].sort((a, b) => b.puntos - a.puntos || Math.abs(a.kcal - metas.kcal) - Math.abs(b.kcal - metas.kcal))[0];
  if (!r.mejorDia?.puntos) r.mejorDia = undefined;

  // Logros
  if (r.diasBrio >= 5) r.logros.push(`${r.diasBrio} días con brío. ¡Semana sólida!`);
  if (r.entrenos >= r.metaEntrenos) r.logros.push(`Cumpliste tus ${r.metaEntrenos} entrenos.`);
  if (r.records) r.logros.push(`${r.records} ${r.records === 1 ? "récord nuevo" : "récords nuevos"} en el gym.`);
  if (r.pesoIni && r.pesoFin && r.pesoFin < r.pesoIni - 0.1) r.logros.push(`Bajaste ${(r.pesoIni - r.pesoFin).toFixed(1)} kg.`);
  if (r.ahorro > 0) r.logros.push(`Ahorraste $${r.ahorro.toLocaleString("es-MX")}.`);
  if (r.aprenderMin >= 60) { const h = (r.aprenderMin / 60).toFixed(1).replace(".0", ""); r.logros.push(`Estudiaste ${h} ${h === "1" ? "hora" : "horas"}.`); }

  // Consejos (máximo 3, del más importante al menos)
  if (r.diasRegistro < 4) r.consejos.push("Registra tus comidas al menos 4 días: sin datos es difícil saber qué ajustar.");
  else if (r.kcalProm > metas.kcal * 1.1) r.consejos.push(`Promediaste ${r.kcalProm.toLocaleString("es-MX")} kcal, arriba de tu meta (${metas.kcal.toLocaleString("es-MX")}). Revisa cenas y bebidas.`);
  else if (r.kcalProm < metas.kcal * 0.75) r.consejos.push("Comiste bastante menos de tu meta. Comer muy poco da más antojos; acércate a tu número.");
  if (r.diasRegistro >= 3 && r.protProm < metas.proteina * 0.8) r.consejos.push(`Tu proteína promedio fue ${r.protProm} g de ${metas.proteina} g. Suma huevo, atún, pollo o yogur griego.`);
  if (r.entrenos < r.metaEntrenos) r.consejos.push(`Entrenaste ${r.entrenos} de ${r.metaEntrenos} días. Agenda tus días de gym en "Tu día" para no saltártelos.`);
  if (r.aguaProm < metas.aguaMl * 0.7) r.consejos.push(`Tomaste ${(r.aguaProm / 1000).toFixed(1)} L al día en promedio; tu meta es ${(metas.aguaMl / 1000).toFixed(1)} L. Activa el aviso de agua.`);
  r.consejos = r.consejos.slice(0, 3);
  return r;
}
