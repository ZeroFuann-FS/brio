/**
 * "Trae tu propia IA": cada usuario puede usar su propia API key de Claude.
 * La key se guarda SOLO en este dispositivo (localStorage) y nunca se sube a la nube.
 */
import { create } from "zustand";

export const MODELOS = [
  { id: "claude-opus-5-5", t: "Claude Opus 5.5", d: "El más preciso (recomendado)", costo: "~$0.01 por comida · ~$0.20 por menú" },
  { id: "claude-sonnet-5-5", t: "Claude Sonnet 5.5", d: "Equilibrio entre precio y calidad", costo: "~$0.005 por comida · ~$0.10 por menú" },
  { id: "claude-haiku-5-5", t: "Claude Haiku 5.5", d: "El más económico", costo: "~$0.0003 por comida · ~$0.005 por menú" },
] as const;
export type ModeloId = (typeof MODELOS)[number]["id"];

const K_KEY = "brio:ia-key";
const K_MOD = "brio:ia-modelo";
const leer = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k: string, v: string | null) => { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* sin storage */ } };

export const useMiIA = create<{ key: string | null; modelo: ModeloId; guardar: (key: string, modelo: ModeloId) => void; borrar: () => void }>((set) => ({
  key: leer(K_KEY),
  modelo: (MODELOS.find((m) => m.id === leer(K_MOD))?.id ?? "claude-opus-5-5") as ModeloId,
  guardar: (key, modelo) => { escribir(K_KEY, key); escribir(K_MOD, modelo); set({ key, modelo }); },
  borrar: () => { escribir(K_KEY, null); set({ key: null }); },
}));

/** Comprueba que la key funciona (consulta el modelo, sin costo de generación). */
export async function probarKey(key: string, modelo: ModeloId): Promise<string | null> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  try {
    await client.models.retrieve(modelo);
    return null;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return "La key no es válida. Revisa que la copiaste completa.";
    if (e instanceof Anthropic.PermissionDeniedError) return "Tu key no tiene permiso para ese modelo.";
    if (e instanceof Anthropic.NotFoundError) return "Ese modelo no está disponible en tu cuenta.";
    if (e instanceof Anthropic.APIError) return `Claude respondió con un error (${e.status}). Intenta de nuevo.`;
    return "No se pudo conectar con Claude. Revisa tu internet.";
  }
}
