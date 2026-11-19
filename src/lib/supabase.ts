import { createClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const nubeDisponible = Boolean(url && key);

export const supabase = createClient(url ?? "http://localhost", key ?? "sin-llave", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "brio:auth" },
});

// Solo en desarrollo: acceso para pruebas automatizadas
if (import.meta.env.DEV) (window as unknown as { __supabase: typeof supabase }).__supabase = supabase;

/** Sesión guardada en el dispositivo (para entrar sin internet cuando no se puede renovar el token). */
export function sesionGuardada(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem("brio:auth") ?? "null") as Session | null;
    return s?.user?.id ? s : null;
  } catch { return null; }
}
