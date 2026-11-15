import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { inputCls } from "../ui";

interface Stats {
  usuarios: number; nuevos7: number; nuevos30: number; activos7: number; activos30: number; conPerfil: number;
  diasRegistrados: number; comidas: number; pesos: number; entrenos: number; despensa: number; push: number; alimentosComunidad: number;
  comentarios: { total: number; nuevos: number; promedio: number | null };
  funciones: Record<string, number>;
  registrosPorDia: { fecha: string; n: number }[]; activosPorDia: { fecha: string; n: number }[];
}
interface Usuario { id: string; email: string; nombre: string | null; creado: string; ultimo_acceso: string | null; dias: number; ultimo_dia: string | null; entrenos: number; pesos: number; push: boolean }
interface Comentario { id: number; tipo: string; texto: string; calificacion: number | null; contacto: string | null; seccion: string | null; dispositivo: string | null; estado: string; nota: string | null; creado: string; user_id: string | null }

const NOMBRE_FUNCION: Record<string, string> = { menu: "Menú semanal", planNutriologo: "Plan de nutriólogo", rutinas: "Rutinas de gym", horario: "Horario del día", avisos: "Avisos", metas: "Metas", gustos: "Gustos de comida" };
const TIPO: Record<string, string> = { idea: "Idea", error: "Error", gusta: "Le gusta", otro: "Otro" };
const fecha = (f: string | null) => (f ? new Date(f.length === 10 ? `${f}T12:00:00` : f).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" }) : "—");
const hace = (f: string | null) => {
  if (!f) return "nunca";
  const d = Math.floor((Date.now() - new Date(f).getTime()) / 86400000);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};

function Kpi({ t, v, sub }: { t: string; v: number | string; sub?: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-3">
      <p className="lab">{t}</p>
      <p className="num mt-0.5 text-[30px] leading-none">{typeof v === "number" ? v.toLocaleString("es-MX") : v}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Barras({ datos, titulo }: { datos: { fecha: string; n: number }[]; titulo: string }) {
  const max = Math.max(1, ...datos.map((d) => d.n));
  const total = datos.reduce((a, d) => a + d.n, 0);
  return (
    <div className="rounded-[16px] border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between"><p className="lab">{titulo}</p><span className="lab">30 días · {total}</span></div>
      <div className="mt-3 flex h-28 items-end gap-[3px]">
        {datos.map((d) => (
          <div key={d.fecha} className="group relative flex-1" style={{ height: "100%" }}>
            <div className="absolute bottom-0 w-full rounded-t-[3px] bg-lime" style={{ height: `${(d.n / max) * 100}%`, minHeight: d.n ? 3 : 0 }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-bg group-hover:block">{fecha(d.fecha)}: {d.n}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between"><span className="lab !text-[10px]">{fecha(datos[0]?.fecha)}</span><span className="lab !text-[10px]">hoy</span></div>
    </div>
  );
}

export default function PanelAdmin() {
  const [vista, setVista] = useState<"resumen" | "usuarios" | "comentarios">("resumen");
  const [stats, setStats] = useState<Stats | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("nuevo");

  const cargar = useCallback(async () => {
    setError("");
    const [s, u, c] = await Promise.all([
      supabase.rpc("estadisticas_admin"),
      supabase.rpc("usuarios_admin"),
      supabase.from("comentarios").select("*").order("creado", { ascending: false }).limit(300),
    ]);
    if (s.error || u.error || c.error) { setError("No se pudo cargar el panel. ¿Sigues con sesión de administrador?"); return; }
    setStats(s.data as Stats); setUsuarios((u.data ?? []) as Usuario[]); setComentarios((c.data ?? []) as Comentario[]);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const emailDe = useMemo(() => new Map(usuarios.map((u) => [u.id, u.email])), [usuarios]);
  const cambiarComentario = async (id: number, cambio: Partial<Comentario>) => {
    setComentarios((l) => l.map((x) => (x.id === id ? { ...x, ...cambio } : x)));
    await supabase.from("comentarios").update(cambio).eq("id", id);
  };
  const exportar = () => {
    const filas = [["email", "nombre", "alta", "ultimo_acceso", "dias", "entrenos", "pesos", "push"], ...usuarios.map((u) => [u.email, u.nombre ?? "", u.creado, u.ultimo_acceso ?? "", u.dias, u.entrenos, u.pesos, u.push ? "si" : "no"])];
    const csv = filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `brio-usuarios-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (error) return <p className="text-sm text-ember">{error}</p>;
  if (!stats) return <p className="text-sm text-muted">Cargando…</p>;
  const usuariosFiltrados = usuarios.filter((u) => !q || `${u.email} ${u.nombre ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const comentariosFiltrados = comentarios.filter((c) => filtro === "todos" || c.estado === filtro);
  const maxFun = Math.max(1, stats.conPerfil);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-[13px] border border-line bg-surface p-1">
          {([["resumen", "Resumen"], ["usuarios", `Usuarios (${stats.usuarios})`], ["comentarios", `Comentarios${stats.comentarios.nuevos ? ` (${stats.comentarios.nuevos})` : ""}`]] as const).map(([id, t]) => (
            <button key={id} onClick={() => setVista(id)} aria-pressed={vista === id}
              className={`rounded-[10px] px-3 py-1.5 text-sm font-medium ${vista === id ? "bg-ink text-bg dark:bg-lime dark:text-on-lime" : "text-muted"}`}>{t}</button>
          ))}
        </div>
        <button onClick={cargar} className="lab ml-auto hover:underline">Actualizar</button>
      </div>

      {vista === "resumen" && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Kpi t="Usuarios" v={stats.usuarios} sub={`+${stats.nuevos7} en 7 días · +${stats.nuevos30} en 30`} />
            <Kpi t="Activos 7 días" v={stats.activos7} sub={`${stats.activos30} en 30 días`} />
            <Kpi t="Terminaron onboarding" v={stats.conPerfil} sub={stats.usuarios ? `${Math.round((stats.conPerfil / stats.usuarios) * 100)}% de los registrados` : ""} />
            <Kpi t="Avisos activos" v={stats.push} sub="usuarios con notificaciones" />
            <Kpi t="Comidas registradas" v={stats.comidas} sub={`${stats.diasRegistrados} días con datos`} />
            <Kpi t="Entrenos" v={stats.entrenos} />
            <Kpi t="Registros de peso" v={stats.pesos} />
            <Kpi t="Comentarios" v={stats.comentarios.total} sub={stats.comentarios.promedio ? `★ ${stats.comentarios.promedio} promedio` : "sin calificaciones"} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Barras datos={stats.registrosPorDia} titulo="Registros por día" />
            <Barras datos={stats.activosPorDia} titulo="Usuarios activos por día" />
          </div>
          <div className="rounded-[16px] border border-line bg-surface p-4">
            <p className="lab">Qué usan (de {stats.conPerfil} perfiles)</p>
            <ul className="mt-2 space-y-1.5">
              {Object.entries(stats.funciones).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                <li key={k} className="grid grid-cols-[150px_1fr_40px] items-center gap-2 text-sm">
                  <span>{NOMBRE_FUNCION[k] ?? k}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-track"><span className="block h-full rounded-full bg-lime" style={{ width: `${(n / maxFun) * 100}%` }} /></span>
                  <span className="num text-right">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Productos capturados por la comunidad: {stats.alimentosComunidad} · artículos en despensas: {stats.despensa}</p>
          </div>
        </div>
      )}

      {vista === "usuarios" && (
        <div className="mt-4">
          <div className="flex gap-2">
            <input className={`${inputCls} py-2.5`} placeholder="Buscar por correo o nombre" value={q} onChange={(e) => setQ(e.target.value)} />
            <button onClick={exportar} className="shrink-0 rounded-[14px] border border-line px-4 text-sm">Exportar CSV</button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-[14px] border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface"><tr className="lab">
                {["Usuario", "Alta", "Último acceso", "Días", "Entrenos", "Pesos", "Avisos"].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}
              </tr></thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-3 py-2"><b className="block font-medium">{u.nombre || "—"}</b><span className="text-xs text-muted">{u.email}</span></td>
                    <td className="px-3 py-2">{fecha(u.creado)}</td>
                    <td className="px-3 py-2">{hace(u.ultimo_acceso)}</td>
                    <td className="num px-3 py-2">{u.dias}<span className="block text-[11px] text-muted">{u.ultimo_dia ? `último ${fecha(u.ultimo_dia)}` : ""}</span></td>
                    <td className="num px-3 py-2">{u.entrenos}</td>
                    <td className="num px-3 py-2">{u.pesos}</td>
                    <td className="px-3 py-2">{u.push ? "Sí" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === "comentarios" && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {[["nuevo", "Nuevos"], ["visto", "Vistos"], ["hecho", "Hechos"], ["descartado", "Descartados"], ["todos", "Todos"]].map(([id, t]) => (
              <button key={id} onClick={() => setFiltro(id)} aria-pressed={filtro === id}
                className={`rounded-full border px-3 py-1 text-sm ${filtro === id ? "border-lime bg-lime text-on-lime" : "border-line bg-surface text-muted"}`}>{t}</button>
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {comentariosFiltrados.map((c) => (
              <li key={c.id} className="rounded-[16px] border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${c.tipo === "error" ? "bg-ember/20" : c.tipo === "gusta" ? "bg-lime/30" : "bg-t-habit"}`}>{TIPO[c.tipo]}</span>
                  {c.seccion && <span className="lab">{c.seccion}</span>}
                  {c.calificacion && <span className="text-sm text-lime-ink">{"★".repeat(c.calificacion)}</span>}
                  <span className="lab ml-auto">{fecha(c.creado)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[15px]">{c.texto}</p>
                <p className="mt-1.5 text-xs text-muted">{c.user_id ? emailDe.get(c.user_id) ?? "Usuario" : c.contacto || "Sin cuenta"}{c.dispositivo ? ` · ${c.dispositivo}` : ""}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select className="rounded-[10px] border border-line bg-bg px-2 py-1 text-sm" value={c.estado} onChange={(e) => cambiarComentario(c.id, { estado: e.target.value })} aria-label="Estado">
                    <option value="nuevo">Nuevo</option><option value="visto">Visto</option><option value="hecho">Hecho</option><option value="descartado">Descartado</option>
                  </select>
                  <input className="min-w-0 flex-1 rounded-[10px] border border-line bg-bg px-2 py-1 text-sm" placeholder="Nota para ti" defaultValue={c.nota ?? ""}
                    onBlur={(e) => e.target.value !== (c.nota ?? "") && cambiarComentario(c.id, { nota: e.target.value || null })} />
                </div>
              </li>
            ))}
            {!comentariosFiltrados.length && <p className="py-4 text-center text-sm text-muted">No hay comentarios aquí.</p>}
          </ul>
        </div>
      )}
    </div>
  );
}
