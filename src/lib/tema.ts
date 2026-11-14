import { create } from "zustand";

export type Tema = "claro" | "oscuro" | "sistema";
const K = "brio:tema";

const leer = (): Tema => {
  try { const t = localStorage.getItem(K); return t === "claro" || t === "oscuro" ? t : "sistema"; } catch { return "sistema"; }
};
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function aplicar(t: Tema) {
  const oscuro = t === "oscuro" || (t === "sistema" && media().matches);
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
  return oscuro;
}

export const useTema = create<{ tema: Tema; oscuro: boolean; setTema: (t: Tema) => void; alternar: () => void }>((set, get) => ({
  tema: leer(),
  oscuro: typeof document !== "undefined" && document.documentElement.dataset.theme === "dark",
  setTema: (t) => {
    try { if (t === "sistema") localStorage.removeItem(K); else localStorage.setItem(K, t); } catch { /* sin storage */ }
    set({ tema: t, oscuro: aplicar(t) });
  },
  alternar: () => get().setTema(get().oscuro ? "claro" : "oscuro"),
}));

// Si el usuario dejó "sistema", seguir los cambios del teléfono o la compu
if (typeof window !== "undefined") {
  media().addEventListener("change", () => {
    const { tema } = useTema.getState();
    if (tema === "sistema") useTema.setState({ oscuro: aplicar("sistema") });
  });
}
