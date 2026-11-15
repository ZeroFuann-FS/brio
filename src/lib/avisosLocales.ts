/** Avisos mientras la app está abierta (para quien no tiene cuenta; con cuenta los manda el servidor). */
import { useEffect } from "react";
import { avisosDelMinuto } from "../../supabase/functions/_shared/avisos";
import { hoyISO } from "./calc";
import { notificarLocal } from "./push";
import { seAcaban, useBrio } from "./store";

const K = "brio:avisos-locales";

export function useAvisosLocales(activo: boolean) {
  useEffect(() => {
    if (!activo || typeof Notification === "undefined") return;
    const revisar = () => {
      if (Notification.permission !== "granted") return;
      const s = useBrio.getState();
      if (!s.perfil?.recordatorios) return;
      const hoy = hoyISO(), d = new Date(), minuto = d.getHours() * 60 + d.getMinutes();
      const dia = s.dias[hoy];
      const avisos = avisosDelMinuto({
        perfil: s.perfil, hoy, minuto,
        despensaBaja: seAcaban(s.despensa).map((i) => i.nombre),
        habitosHechos: Object.values(dia?.habitos ?? {}).filter(Boolean).length,
        aguaMl: dia?.aguaMl ?? 0,
        pesoKg: s.pesos.length ? s.pesos[s.pesos.length - 1].kg : s.perfil.pesoInicial,
      }, 2);
      if (!avisos.length) return;
      let vistos: string[] = [];
      try { vistos = JSON.parse(localStorage.getItem(K) ?? "[]"); } catch { /* sin storage */ }
      for (const a of avisos) {
        if (vistos.includes(a.clave)) continue;
        vistos.push(a.clave);
        notificarLocal(a.titulo, a.cuerpo, a.clave);
      }
      try { localStorage.setItem(K, JSON.stringify(vistos.slice(-60))); } catch { /* sin storage */ }
    };
    revisar();
    const t = setInterval(revisar, 60_000);
    return () => clearInterval(t);
  }, [activo]);
}
