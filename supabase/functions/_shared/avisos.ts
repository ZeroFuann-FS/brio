/**
 * Qué avisos tocan en un minuto dado. Lógica pura compartida por la app (avisos con la app abierta)
 * y por la función `recordatorios` del servidor (push con la app cerrada). Sin imports.
 */
// deno-lint-ignore-file no-explicit-any
export interface EntradaAvisos {
  perfil: any;              // perfil de Brío (perfiles.datos)
  hoy: string;              // fecha local yyyy-mm-dd
  minuto: number;           // minuto local del día (0-1439)
  despensaBaja: string[];   // productos en o bajo su mínimo
  habitosHechos: number;
  aguaMl: number;
  pesoKg: number;
}
export interface Aviso { clave: string; titulo: string; cuerpo: string; url: string }

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const aMin = (h?: string) => { if (!h) return -1; const [a, b] = h.split(":").map(Number); return (a || 0) * 60 + (b || 0); };
const h12 = (m: number) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0"); return `${h % 12 || 12}:${mm} ${h < 12 ? "am" : "pm"}`; };
const sumarDias = (f: string, n: number) => { const d = new Date(`${f}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Fecha del próximo pago pendiente. */
export function proximoPagoISO(p: { dia: number; pagadoHasta?: string }, hoy: string): string {
  let [y, m] = hoy.split("-").map(Number);
  const mes = () => `${y}-${String(m).padStart(2, "0")}`;
  while (p.pagadoHasta && mes() <= p.pagadoHasta) { m++; if (m > 12) { m = 1; y++; } }
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${mes()}-${String(Math.min(p.dia, ultimo)).padStart(2, "0")}`;
}

/** Avisos cuyo momento cae en (minuto - ventana, minuto]. */
export function avisosDelMinuto(e: EntradaAvisos, ventana = 5): Aviso[] {
  const p = e.perfil ?? {}, r = p.recordatorios ?? {}, ag = p.agenda ?? {};
  const out: Aviso[] = [];
  const en = (m: number) => m >= 0 && m <= e.minuto && m > e.minuto - ventana;
  const wd = new Date(`${e.hoy}T12:00:00Z`).getUTCDay();

  // Pago del gym: un día antes, el día y dos días después si sigue pendiente
  if (r.pago?.activo && r.pago.dia) {
    const fecha = proximoPagoISO(r.pago, e.hoy), hora = aMin(r.pago.hora || "09:00");
    const monto = r.pago.monto ? ` de $${Number(r.pago.monto).toLocaleString("es-MX")}` : "";
    const casos: [string, string][] = [[sumarDias(fecha, -1), `Mañana te toca el pago del gym${monto}.`], [fecha, `Hoy es tu pago del gym${monto}. Cuando pagues, márcalo en Brío.`], [sumarDias(fecha, 2), `Tu pago del gym${monto} sigue pendiente desde el ${fecha.slice(8)}.`]];
    for (const [f, txt] of casos) if (f === e.hoy && en(hora)) out.push({ clave: `pago:${fecha}:${f}`, titulo: "Pago del gym", cuerpo: txt, url: "/" });
  }

  // Despensa
  if (r.despensa?.activo && e.despensaBaja.length && en(aMin(r.despensa.hora || "19:00"))) {
    const l = e.despensaBaja.slice(0, 4).join(", ") + (e.despensaBaja.length > 4 ? ` y ${e.despensaBaja.length - 4} más` : "");
    out.push({ clave: `despensa:${e.hoy}`, titulo: "Se te está acabando", cuerpo: `${l}. Agrégalo a tu lista del súper.`, url: "/?tab=comida" });
  }

  // Comidas (con el texto del plan del nutriólogo si existe)
  if (r.comidas?.activo) {
    const antes = Number(r.comidas.antes ?? 30);
    const plan = p.plan?.activo ? (p.plan.menu?.[p.plan.mismoMenu ? "todos" : DIAS[wd]] ?? {}) : {};
    const comidas = ag.comidas ?? { desayuno: "07:30", comida: "14:30", cena: "20:30" };
    for (const [k, nombre, pk] of [["desayuno", "desayuno", "desayuno"], ["comida", "comida", "comida"], ["cena", "cena", "cena"]] as const) {
      const m = aMin(comidas[k]) - antes;
      if (!en(m)) continue;
      const txt = plan[pk]?.trim();
      out.push({ clave: `comida:${e.hoy}:${k}`, titulo: antes ? `En ${antes} min: ${nombre}` : `Hora de tu ${nombre}`, cuerpo: txt ? `Te toca: ${txt}` : antes >= 20 ? "Buen momento para empezar a prepararla. Revisa tu menú en Brío." : "Registra lo que comas en Brío.", url: "/?tab=comida" });
    }
  }

  // Entreno (según los días de la rutina)
  if (r.entreno?.activo) {
    const rutinas: any[] = p.entreno?.rutinas ?? [];
    const rut = rutinas.find((x) => x.id === p.entreno?.activa) ?? rutinas[0];
    const dia = rut?.dias?.find((d: any) => (d.semana ?? []).includes(wd));
    const hora = aMin(ag.gym?.hora || "18:00");
    if (dia && en(hora - Number(r.entreno.antes ?? 60))) {
      out.push({ clave: `entreno:${e.hoy}`, titulo: `Hoy toca: ${dia.nombre}`, cuerpo: `Tu entreno es a las ${h12(hora)}. ${dia.ejercicios?.length ?? 0} ejercicios. ¡A darle con brío!`, url: "/?tab=entreno" });
    }
  }

  // Hábitos: aviso nocturno si falta poco para la racha
  if (r.habitos?.activo && en(aMin(r.habitos.hora || "21:00"))) {
    const total = (p.habitos?.length || 4) + 1;
    const minimo = Math.max(1, Math.ceil(total * 0.6));
    const faltan = minimo - e.habitosHechos;
    if (faltan > 0) out.push({ clave: `habitos:${e.hoy}`, titulo: "Tu racha de hoy", cuerpo: faltan === 1 ? "Te falta 1 hábito para que hoy sea un día con brío." : `Te faltan ${faltan} hábitos para que hoy sea un día con brío.`, url: "/" });
  }

  // Agua: 11 am, 3 pm y 6 pm si vas atrasado
  if (r.agua?.activo && e.pesoKg > 0) {
    const meta = Math.round((e.pesoKg * 35) / 250) * 250;
    for (const [hh, frac] of [[11, 0.35], [15, 0.6], [18, 0.8]] as const) {
      if (en(hh * 60) && e.aguaMl < meta * frac) {
        const faltan = Math.round((meta * frac - e.aguaMl) / 250);
        out.push({ clave: `agua:${e.hoy}:${hh}`, titulo: "Toma agua", cuerpo: `Vas ${(e.aguaMl / 1000).toFixed(1)} L de ${(meta / 1000).toFixed(1)} L. Unos ${Math.max(1, faltan)} vasos te ponen al día.`, url: "/" });
      }
    }
  }
  return out;
}
