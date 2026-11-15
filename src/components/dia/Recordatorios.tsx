import { useEffect, useState } from "react";
import type { Recordatorios as TR } from "../../lib/agenda";
import type { Perfil } from "../../lib/calc";
import { activarPush, desactivarPush, esIOS, estadoPush, notificarLocal, type EstadoPush } from "../../lib/push";
import { useBrio } from "../../lib/store";
import { nubeDisponible, supabase } from "../../lib/supabase";
import { btnPrimario, btnSecundario, inputCls } from "../ui";
import { proximoPagoISO } from "../../../supabase/functions/_shared/avisos";

function Interruptor({ on, onCambio, label }: { on: boolean; onCambio: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onCambio(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-lime" : "bg-track"}`}>
      <i className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function Fila({ titulo, desc, on, onCambio, children }: { titulo: string; desc: string; on: boolean; onCambio: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1"><b className="block font-medium">{titulo}</b><span className="block text-xs text-muted">{desc}</span></span>
        <Interruptor on={on} onCambio={onCambio} label={titulo} />
      </div>
      {on && children && <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>}
    </li>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="lab mb-1 block !text-[10px]">{label}</span>{children}</label>;
}

export const TEXTO_ESTADO: Record<EstadoPush, string> = {
  activo: "Activados en este dispositivo",
  inactivo: "Desactivados",
  denegado: "Bloqueados en este navegador",
  "sin-soporte": "Este navegador no permite notificaciones",
  instalar: "Primero instala Brío en tu pantalla de inicio",
};

/** Al configurar el pago se asume que va al corriente: si su día de este mes ya pasó, este mes ya está pagado. */
function alCorriente(dia: number) {
  const h = new Date(), y = h.getFullYear(), m = h.getMonth() + 1;
  const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y;
  return h.getDate() >= dia ? `${y}-${String(m).padStart(2, "0")}` : `${py}-${String(pm).padStart(2, "0")}`;
}

export default function Recordatorios({ perfil }: { perfil: Perfil }) {
  const setRec = useBrio((s) => s.setRecordatorios);
  const r: TR = perfil.recordatorios ?? {};
  const [estado, setEstado] = useState<EstadoPush | null>(null);
  const [msg, setMsg] = useState("");
  const [cuenta, setCuenta] = useState(false);
  useEffect(() => { estadoPush().then(setEstado); if (nubeDisponible) supabase.auth.getSession().then(({ data }) => setCuenta(!!data.session)); }, []);
  const cambiar = (k: keyof TR, v: TR[keyof TR]) => setRec({ ...r, [k]: v });

  const activar = async () => {
    setMsg("");
    const res = await activarPush();
    setEstado(await estadoPush());
    if (res.ok) {
      await notificarLocal("¡Listo!", "Así te llegarán los avisos de Brío.", "prueba");
      setMsg(res.motivo === "sin-cuenta" ? "Activadas. Sin cuenta solo te avisamos mientras Brío esté abierta; crea tu cuenta para recibirlas con la app cerrada." : "Activadas. Te llegarán aunque la app esté cerrada.");
      if (!r.pago && !r.despensa && !r.comidas && !r.entreno && !r.habitos) setRec({ ...r, despensa: { activo: true, hora: "19:00" }, entreno: { activo: true, antes: 60 }, habitos: { activo: true, hora: "21:00" }, resumen: { activo: true, hora: "20:00" } });
    } else setMsg(res.motivo === "denegado" ? "Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador para este sitio." : res.motivo === "instalar" ? "" : res.motivo === "suscripcion" ? "Este navegador no pudo registrarse para recibir avisos. Prueba en Chrome, Edge o Safari (con Brío instalado)." : "No se pudieron activar. Intenta de nuevo.");
  };

  return (
    <div>
      <div className="rounded-[16px] border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <span><b className="block font-medium">Notificaciones</b><span className={`text-sm ${estado === "activo" ? "text-lime-ink" : "text-muted"}`}>{estado ? TEXTO_ESTADO[estado] : "…"}</span></span>
          {estado === "activo"
            ? <button onClick={async () => { await desactivarPush(); setEstado(await estadoPush()); }} className={`${btnSecundario} h-10 text-sm`}>Desactivar</button>
            : estado !== "instalar" && estado !== "sin-soporte" && <button onClick={activar} className={`${btnPrimario} h-10 px-4 text-sm`}>Activar</button>}
        </div>
        {estado === "instalar" && (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Abre mi-brio.vercel.app en <b className="text-ink">Safari</b>.</li>
            <li>Toca <b className="text-ink">Compartir</b> (el cuadro con la flecha hacia arriba).</li>
            <li>Elige <b className="text-ink">Agregar a pantalla de inicio</b>.</li>
            <li>Abre Brío desde el ícono y vuelve aquí para activar los avisos.</li>
          </ol>
        )}
        {estado === "denegado" && <p className="mt-2 text-sm text-muted">{esIOS() ? "Ve a Ajustes → Notificaciones → Brío y permítelas." : "Toca el candado junto a la dirección del sitio y permite las notificaciones."}</p>}
        {msg && <p className="mt-2 text-sm">{msg}</p>}
        {estado === "activo" && <button onClick={() => notificarLocal("Prueba de Brío", "Si ves esto, tus avisos funcionan.", "prueba")} className="lab mt-2 !text-lime-ink hover:underline">Enviar una prueba</button>}
        {estado === "activo" && !cuenta && <p className="mt-2 text-xs text-muted">Sin cuenta, los avisos solo llegan mientras Brío está abierta. Con cuenta llegan aunque la cierres.</p>}
      </div>

      <ul className="mt-3">
        <Fila titulo="Pago del gym" desc="Te aviso un día antes, el día del pago y si se te pasa." on={!!r.pago?.activo}
          onCambio={(v) => { const base = { dia: 1, monto: 0, hora: "09:00", ...r.pago, activo: v }; cambiar("pago", { ...base, pagadoHasta: base.pagadoHasta ?? alCorriente(base.dia) }); }}>
          <Campo label="Día del mes"><input className={`${inputCls} num py-2 text-lg`} inputMode="numeric" value={r.pago?.dia || ""} onChange={(e) => { const dia = Math.min(31, Number(e.target.value.replace(/\D/g, "")) || 0); cambiar("pago", { ...r.pago!, dia, pagadoHasta: dia ? alCorriente(dia) : r.pago?.pagadoHasta }); }} /></Campo>
          <Campo label="Monto ($)"><input className={`${inputCls} num py-2 text-lg`} inputMode="numeric" value={r.pago?.monto || ""} onChange={(e) => cambiar("pago", { ...r.pago!, monto: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></Campo>
          <Campo label="Hora"><input type="time" className={`${inputCls} campo-fecha py-2`} value={r.pago?.hora ?? "09:00"} onChange={(e) => cambiar("pago", { ...r.pago!, hora: e.target.value })} /></Campo>
          {r.pago?.dia ? <p className="col-span-full text-xs text-muted">Próximo pago: <b className="text-ink">{new Date(`${proximoPagoISO(r.pago, new Date().toISOString().slice(0, 10))}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}</b>. Cuando pagues, toca "Ya pagué" en Hoy.</p> : null}
        </Fila>
        <Fila titulo="Despensa" desc="Si algo llegó a su mínimo, te aviso para que lo compres." on={!!r.despensa?.activo} onCambio={(v) => cambiar("despensa", { hora: "19:00", ...r.despensa, activo: v })}>
          <Campo label="Hora"><input type="time" className={`${inputCls} campo-fecha py-2`} value={r.despensa?.hora ?? "19:00"} onChange={(e) => cambiar("despensa", { ...r.despensa!, hora: e.target.value })} /></Campo>
        </Fila>
        <Fila titulo="Comidas" desc="Antes de cada comida, con lo que te toca si sigues un menú." on={!!r.comidas?.activo} onCambio={(v) => cambiar("comidas", { antes: 30, ...r.comidas, activo: v })}>
          <Campo label="Minutos antes">
            <select className={`${inputCls} py-2`} value={r.comidas?.antes ?? 30} onChange={(e) => cambiar("comidas", { ...r.comidas!, antes: Number(e.target.value) })}>
              {[0, 15, 30, 45, 60].map((n) => <option key={n} value={n}>{n ? `${n} min` : "A la hora"}</option>)}
            </select>
          </Campo>
        </Fila>
        <Fila titulo="Entreno" desc="Los días de tu rutina, antes de tu hora de gym." on={!!r.entreno?.activo} onCambio={(v) => cambiar("entreno", { antes: 60, ...r.entreno, activo: v })}>
          <Campo label="Avisarme">
            <select className={`${inputCls} py-2`} value={r.entreno?.antes ?? 60} onChange={(e) => cambiar("entreno", { ...r.entreno!, antes: Number(e.target.value) })}>
              {[15, 30, 60, 90, 120].map((n) => <option key={n} value={n}>{n < 60 ? `${n} min antes` : `${n / 60} h antes`}</option>)}
            </select>
          </Campo>
        </Fila>
        <Fila titulo="Hábitos" desc="En la noche, si te falta poco para tu racha." on={!!r.habitos?.activo} onCambio={(v) => cambiar("habitos", { hora: "21:00", ...r.habitos, activo: v })}>
          <Campo label="Hora"><input type="time" className={`${inputCls} campo-fecha py-2`} value={r.habitos?.hora ?? "21:00"} onChange={(e) => cambiar("habitos", { ...r.habitos!, hora: e.target.value })} /></Campo>
        </Fila>
        <Fila titulo="Agua" desc="A las 11 am, 3 pm y 6 pm, solo si vas atrasado." on={!!r.agua?.activo} onCambio={(v) => cambiar("agua", { activo: v })} />
        <Fila titulo="Resumen semanal" desc="El domingo en la noche, para ver tu semana y planear la siguiente." on={!!r.resumen?.activo} onCambio={(v) => cambiar("resumen", { hora: "20:00", ...r.resumen, activo: v })}>
          <Campo label="Hora (domingo)"><input type="time" className={`${inputCls} campo-fecha py-2`} value={r.resumen?.hora ?? "20:00"} onChange={(e) => cambiar("resumen", { ...r.resumen!, hora: e.target.value })} /></Campo>
        </Fila>
      </ul>
      <p className="mt-2 text-xs text-muted">Las horas de comida y gym se toman de tu horario en "Tu día".</p>
    </div>
  );
}
