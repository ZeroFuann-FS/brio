/** Junta los datos de la app (rutina, menú, plan, hábitos) para armar la agenda de un día. */
import { recetaPorId } from "../data/recetas";
import { AGENDA_BASE, armarDia, type Agenda, type DatosDia } from "./agenda";
import { menuPlan, tienePlanMenu, type Perfil } from "./calc";
import { DIAS_SEMANA, diaDeSemana, minutosDia } from "./entreno";
import { habitosDe, type MenuGuardado } from "./store";

export const agendaDe = (p: Perfil | null): Agenda => ({ ...AGENDA_BASE, ...(p?.agenda ?? {}), comidas: { ...AGENDA_BASE.comidas, ...(p?.agenda?.comidas ?? {}) }, gym: { ...AGENDA_BASE.gym, ...(p?.agenda?.gym ?? {}) } });

export function datosDelDia(perfil: Perfil, menu: MenuGuardado | null, fecha: string): DatosDia {
  const f = new Date(`${fecha}T12:00:00`);
  const wd = f.getDay();
  const agenda = agendaDe(perfil);
  const rutinas = perfil.entreno?.rutinas ?? [];
  const r = rutinas.find((x) => x.id === perfil.entreno?.activa) ?? rutinas[0];
  const d = r ? diaDeSemana(r, wd) : undefined;
  const gym = d ? { nombre: d.nombre, min: minutosDia(d) } : null;

  // Comidas: menú del nutriólogo > menú semanal de Brío > comidas sin receta
  let comidas: DatosDia["comidas"] = [];
  const dm = menu && Array.isArray(menu.dias) ? menu.dias.find((x) => x.dia === DIAS_SEMANA[wd]) : undefined;
  if (tienePlanMenu(perfil.plan)) {
    const t = (k: Parameters<typeof menuPlan>[2]) => menuPlan(perfil.plan, f, k);
    comidas = ([["desayuno", "desayuno"], ["colacion1", "colacion"], ["comida", "comida"], ["colacion2", "colacion"], ["cena", "cena"]] as const)
      .filter(([k]) => t(k)).map(([k, tipo]) => ({ tipo, titulo: t(k)!, cocinar: tipo === "colacion" ? 5 : 20 }));
  } else if (dm) {
    comidas = dm.comidas.map((c) => {
      if (c.casa) return { tipo: c.tipo, titulo: "Lo que hagan en casa", cocinar: 0, casa: true };
      const rec = recetaPorId(c.receta);
      return { tipo: c.tipo, titulo: rec?.nombre ?? "", cocinar: rec?.min ?? 15 };
    });
  } else {
    const elegidas = perfil.prefsComida?.comidas?.length ? perfil.prefsComida.comidas : ["desayuno", "comida", "cena"];
    comidas = (["desayuno", "comida", "cena"] as const).filter((x) => elegidas.includes(x)).map((tipo) => ({ tipo, titulo: "", cocinar: 0 }));
  }
  return { agenda, wd, gym, comidas, habitos: habitosDe(perfil).map((h) => ({ id: h.id, titulo: h.t })) };
}

export const agendaDelDia = (perfil: Perfil, menu: MenuGuardado | null, fecha: string) => armarDia(datosDelDia(perfil, menu, fecha));
