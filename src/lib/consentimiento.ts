import { supabase } from "./supabase";

/** Versión del aviso de privacidad que la persona aceptó (la fecha de public/privacidad.html). */
export const VERSION_PRIVACIDAD = "2026-11-21";
const CLAVE = "brio-consentimiento";

/** Guarda en este dispositivo que la persona aceptó, antes de mandarla a iniciar sesión. */
export function guardarConsentimiento() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ version: VERSION_PRIVACIDAD, fecha: new Date().toISOString() }));
  } catch { /* sin storage: se vuelve a pedir la próxima vez */ }
}

/**
 * Ya con sesión, registra en la cuenta quién aceptó y cuándo (user_metadata).
 * Sirve igual para el link por correo y para Google, porque los dos regresan a la app.
 */
export async function registrarConsentimiento() {
  let local: { version: string; fecha: string } | null = null;
  try { local = JSON.parse(localStorage.getItem(CLAVE) ?? "null"); } catch { local = null; }
  if (!local) return;
  const { data } = await supabase.auth.getUser();
  const meta = data.user?.user_metadata ?? {};
  if (meta.privacidad_version === local.version) return;
  const { error } = await supabase.auth.updateUser({
    data: { privacidad_version: local.version, privacidad_aceptada: local.fecha },
  });
  if (!error) { try { localStorage.removeItem(CLAVE); } catch { /* nada */ } }
}
