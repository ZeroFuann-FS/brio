/**
 * Sincronización local-first con Supabase.
 *
 * - La app siempre lee y escribe en el store local (funciona sin internet).
 * - Cada cambio marca su "clave" como pendiente (perfil, dia:2026-11-14, peso:…, medida:…, despensa:id).
 * - Las pendientes se suben en lote (debounce) y se reintentan al volver la conexión.
 * - Al iniciar sesión o volver a la app se baja lo remoto y se mezcla:
 *   lo pendiente local gana; lo demás se toma de la nube.
 */
import { create } from "zustand";
import { supabase } from "./supabase";
import { useBrio, type Dia, type ItemDespensa, type RegistroMedidas } from "./store";
import type { Perfil } from "./calc";

type Estado = "sin-cuenta" | "sincronizando" | "ok" | "pendiente" | "error";
export const useSync = create<{ estado: Estado; ultima: number | null }>(() => ({ estado: "sin-cuenta", ultima: null }));

const K_PEND = "brio:pendientes";
const K_USUARIO = "brio:sync-usuario";

const leer = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sin storage */ }
};

let pendientes = new Set<string>(JSON.parse(leer(K_PEND) ?? "[]") as string[]);
const guardarPendientes = () => escribir(K_PEND, JSON.stringify([...pendientes]));

type Snap = Map<string, unknown>;

function snapshot(s = useBrio.getState()): Snap {
  const m: Snap = new Map();
  if (s.perfil) m.set("perfil", s.perfil);
  for (const [f, d] of Object.entries(s.dias)) m.set(`dia:${f}`, d);
  for (const p of s.pesos) m.set(`peso:${p.fecha}`, p.kg);
  for (const r of s.medidas) m.set(`medida:${r.fecha}`, r);
  for (const i of s.despensa) m.set(`despensa:${i.id}`, i);
  return m;
}

function aplicar(m: Snap) {
  const dias: Record<string, Dia> = {};
  const pesos: { fecha: string; kg: number }[] = [];
  const medidas: RegistroMedidas[] = [];
  const despensa: ItemDespensa[] = [];
  let perfil: Perfil | null = null;
  for (const [k, v] of m) {
    const [tipo, id] = [k.slice(0, k.indexOf(":") === -1 ? k.length : k.indexOf(":")), k.slice(k.indexOf(":") + 1)];
    if (k === "perfil") perfil = v as Perfil;
    else if (tipo === "dia") dias[id] = v as Dia;
    else if (tipo === "peso") pesos.push({ fecha: id, kg: v as number });
    else if (tipo === "medida") medidas.push(v as RegistroMedidas);
    else if (tipo === "despensa") despensa.push(v as ItemDespensa);
  }
  pesos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  medidas.sort((a, b) => a.fecha.localeCompare(b.fecha));
  aplicandoRemoto = true;
  useBrio.setState({ perfil, dias, pesos, medidas, despensa });
  aplicandoRemoto = false;
}

async function bajar(): Promise<Snap> {
  const [pf, ds, ps, ms, de] = await Promise.all([
    supabase.from("perfiles").select("datos"),
    supabase.from("dias").select("fecha, comidas, agua_ml, habitos"),
    supabase.from("pesos").select("fecha, kg"),
    supabase.from("medidas").select("fecha, valores"),
    supabase.from("despensa").select("id, nombre, cantidad, unidad"),
  ]);
  const err = pf.error ?? ds.error ?? ps.error ?? ms.error ?? de.error;
  if (err) throw err;
  const m: Snap = new Map();
  if (pf.data?.[0]) m.set("perfil", pf.data[0].datos);
  for (const d of ds.data ?? []) m.set(`dia:${d.fecha}`, { comidas: d.comidas, aguaMl: d.agua_ml, habitos: d.habitos });
  for (const p of ps.data ?? []) m.set(`peso:${p.fecha}`, Number(p.kg));
  for (const r of ms.data ?? []) m.set(`medida:${r.fecha}`, { fecha: r.fecha, ...(r.valores as object) });
  for (const i of de.data ?? []) m.set(`despensa:${i.id}`, { id: i.id, nombre: i.nombre, cantidad: Number(i.cantidad), unidad: i.unidad });
  return m;
}

async function subir(uid: string) {
  if (!pendientes.size) return;
  const lote = [...pendientes];
  const local = snapshot();
  const ahora = new Date().toISOString();
  const up: Record<string, object[]> = { perfiles: [], dias: [], pesos: [], medidas: [], despensa: [] };
  const del: Record<string, string[]> = { perfiles: [], dias: [], pesos: [], medidas: [], despensa: [] };

  for (const k of lote) {
    const v = local.get(k);
    const tipo = k === "perfil" ? "perfil" : k.slice(0, k.indexOf(":"));
    const id = k.slice(k.indexOf(":") + 1);
    if (tipo === "perfil") v ? up.perfiles.push({ user_id: uid, datos: v, actualizado: ahora }) : del.perfiles.push(uid);
    else if (tipo === "dia") {
      const d = v as Dia | undefined;
      d ? up.dias.push({ user_id: uid, fecha: id, comidas: d.comidas, agua_ml: d.aguaMl, habitos: d.habitos, actualizado: ahora }) : del.dias.push(id);
    } else if (tipo === "peso") v != null ? up.pesos.push({ user_id: uid, fecha: id, kg: v, actualizado: ahora }) : del.pesos.push(id);
    else if (tipo === "medida") {
      if (v) { const { fecha: _f, ...valores } = v as RegistroMedidas; up.medidas.push({ user_id: uid, fecha: id, valores, actualizado: ahora }); }
      else del.medidas.push(id);
    } else if (tipo === "despensa") {
      const i = v as ItemDespensa | undefined;
      i ? up.despensa.push({ user_id: uid, id, nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad, actualizado: ahora }) : del.despensa.push(id);
    }
  }

  const ops: PromiseLike<{ error: unknown }>[] = [];
  const pk: Record<string, string> = { perfiles: "user_id", dias: "user_id,fecha", pesos: "user_id,fecha", medidas: "user_id,fecha", despensa: "user_id,id" };
  for (const t of Object.keys(up)) if (up[t].length) ops.push(supabase.from(t).upsert(up[t], { onConflict: pk[t] }));
  if (del.perfiles.length) ops.push(supabase.from("perfiles").delete().eq("user_id", uid));
  for (const t of ["dias", "pesos", "medidas"]) if (del[t].length) ops.push(supabase.from(t).delete().eq("user_id", uid).in("fecha", del[t]));
  if (del.despensa.length) ops.push(supabase.from("despensa").delete().eq("user_id", uid).in("id", del.despensa));

  const res = await Promise.all(ops);
  const fallo = res.find((r) => r.error);
  if (fallo) throw fallo.error;
  for (const k of lote) pendientes.delete(k);
  guardarPendientes();
}

let aplicandoRemoto = false;
let usuario: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let ocupado = false;

async function flush() {
  if (!usuario || ocupado) return;
  if (!pendientes.size) { useSync.setState({ estado: "ok" }); return; }
  if (!navigator.onLine) { useSync.setState({ estado: "pendiente" }); return; }
  ocupado = true;
  useSync.setState({ estado: "sincronizando" });
  try {
    await subir(usuario);
    useSync.setState({ estado: pendientes.size ? "pendiente" : "ok", ultima: Date.now() });
  } catch {
    useSync.setState({ estado: "error" });
  } finally {
    ocupado = false;
  }
}

const programar = (ms = 900) => { if (timer) clearTimeout(timer); timer = setTimeout(flush, ms); };

/** Baja de la nube y mezcla con lo local. */
async function bajarYMezclar(uid: string) {
  const remoto = await bajar();
  const local = snapshot();
  const primeraVez = leer(K_USUARIO) !== uid;
  const final: Snap = new Map();

  if (primeraVez) {
    // Primera vez en este dispositivo: se conserva lo local que la nube no tiene (y se sube).
    for (const [k, v] of remoto) final.set(k, v);
    for (const [k, v] of local) if (!remoto.has(k)) { final.set(k, v); pendientes.add(k); }
  } else {
    for (const [k, v] of remoto) final.set(k, pendientes.has(k) ? local.get(k) : v);
    for (const [k, v] of local) if (!remoto.has(k) && pendientes.has(k)) final.set(k, v);
    for (const k of pendientes) if (!local.has(k)) final.delete(k); // borrado local pendiente
  }
  guardarPendientes();
  aplicar(final);
  escribir(K_USUARIO, uid);
}

let desuscribir: (() => void) | null = null;

export async function iniciarSync(uid: string) {
  detenerSync();
  usuario = uid;
  useSync.setState({ estado: "sincronizando" });
  try {
    await bajarYMezclar(uid);
    useSync.setState({ estado: "ok", ultima: Date.now() });
  } catch {
    useSync.setState({ estado: "error" });
  }

  const unsub = useBrio.subscribe((s, prev) => {
    if (aplicandoRemoto) return;
    const a = snapshot(prev), b = snapshot(s);
    let cambio = false;
    for (const [k, v] of b) if (JSON.stringify(a.get(k)) !== JSON.stringify(v)) { pendientes.add(k); cambio = true; }
    for (const k of a.keys()) if (!b.has(k)) { pendientes.add(k); cambio = true; }
    if (cambio) { guardarPendientes(); useSync.setState({ estado: "pendiente" }); programar(); }
  });

  const alVolver = async () => {
    if (document.visibilityState !== "visible" || !usuario || ocupado) return;
    await flush();
    try { await bajarYMezclar(usuario); useSync.setState({ estado: pendientes.size ? "pendiente" : "ok", ultima: Date.now() }); } catch { /* sin red */ }
  };
  const enLinea = () => programar(100);
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("online", enLinea);
  desuscribir = () => { unsub(); document.removeEventListener("visibilitychange", alVolver); window.removeEventListener("online", enLinea); };

  programar(100);
}

export function detenerSync() {
  desuscribir?.();
  desuscribir = null;
  usuario = null;
  if (timer) clearTimeout(timer);
}

function limpiarDispositivo() {
  pendientes = new Set();
  guardarPendientes();
  escribir(K_USUARIO, null);
  aplicandoRemoto = true;
  useBrio.getState().reset();
  aplicandoRemoto = false;
  useSync.setState({ estado: "sin-cuenta", ultima: null });
}

/** Elimina la cuenta y todos sus datos de la nube, y limpia este dispositivo. */
export async function eliminarCuenta() {
  detenerSync();
  const { error } = await supabase.rpc("eliminar_mi_cuenta");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  limpiarDispositivo();
}

/** Sube lo pendiente, cierra sesión y limpia este dispositivo (los datos quedan en la nube). */
export async function cerrarSesion() {
  try { await flush(); } catch { /* lo intentamos */ }
  detenerSync();
  await supabase.auth.signOut();
  limpiarDispositivo();
}
