import { useEffect, useMemo, useState } from "react";
import { configurarRecetas } from "./data/recetas";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "motion/react";
import Intro from "./components/Intro";
import Onboarding from "./components/Onboarding";
import Hoy from "./components/Hoy";
import Progreso from "./components/Progreso";
import Comida from "./components/Comida";
import Entreno from "./components/Entreno";
import { IcComida, IcEntreno, IcHoy, IcLuna, IcPerfil, IcProgreso, IcSol } from "./components/Iconos";
import { useTema } from "./lib/tema";
import Perfil from "./components/Perfil";
import Cuenta from "./components/Cuenta";
import Logo from "./components/Logo";
import { nubeDisponible, sesionGuardada, supabase } from "./lib/supabase";
import { iniciarSync, useSync } from "./lib/sync";
import { aplicarPlan, calcularMetas } from "./lib/calc";
import { useAvisosLocales } from "./lib/avisosLocales";
import { guardarSinRed } from "./lib/push";
import { fotosEjercicio } from "./data/ejercicios";
import Tour, { RECORRIDOS, marcarTutorial, reiniciarTutorial, tutorialVisto, type Recorrido } from "./components/Tour";
import { habitosDe, pesoActual, racha, useBrio } from "./lib/store";

const KEY = "brio:intro-visto-v3";
// limpia datos de versiones de prueba anteriores
try { ["brio:datos", "brio:intro-visto", "brio:datos-v2", "brio:intro-visto-v2"].forEach((k) => localStorage.removeItem(k)); } catch { /* sin storage */ }

const introVisto = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const K_SIN_CUENTA = "brio:sin-cuenta";
const sinCuenta = () => { try { return localStorage.getItem(K_SIN_CUENTA) === "1"; } catch { return false; } };

const TABS = [
  { id: "hoy", I: IcHoy, t: "Hoy" },
  { id: "comida", I: IcComida, t: "Comida" },
  { id: "entreno", I: IcEntreno, t: "Entreno" },
  { id: "progreso", I: IcProgreso, t: "Progreso" },
  { id: "perfil", I: IcPerfil, t: "Perfil" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const perfil = useBrio((s) => s.perfil);
  configurarRecetas({ sinAceite: perfil?.prefsComida?.sinAceite });   // antes de pintar recetas y menú
  const pesos = useBrio((s) => s.pesos);
  const setPerfil = useBrio((s) => s.setPerfil);
  const [intro, setIntro] = useState(!introVisto());
  const [splash, setSplash] = useState(introVisto()); // la animación del logo sale siempre al entrar
  const [editando, setEditando] = useState(false);
  const [tab, setTab] = useState<Tab>(() => {
    // Las notificaciones abren la app en la sección que corresponde (?tab=comida)
    try { const t = new URLSearchParams(location.search).get("tab"); if (t && ["hoy", "comida", "entreno", "progreso", "perfil"].includes(t)) { history.replaceState(null, "", "/"); return t as Tab; } } catch { /* sin URL */ }
    return "hoy";
  });
  const [session, setSession] = useState<Session | null>(null);
  const [authListo, setAuthListo] = useState(!nubeDisponible);
  const [syncListo, setSyncListo] = useState(true);
  const [omitio, setOmitio] = useState(sinCuenta());
  const [verCuenta, setVerCuenta] = useState(false);
  const estadoSync = useSync((s) => s.estado);
  const dias = useBrio((s) => s.dias);
  const { oscuro, alternar } = useTema();
  useAvisosLocales(!session);
  const [tour, setTour] = useState<Recorrido | null>(null);

  useEffect(() => {
    if (!nubeDisponible) return;
    // Sin red (o con señal mala en el gym) getSession puede tardar mucho al intentar renovar el token:
    // si no responde rápido, se entra con la sesión guardada en el dispositivo y se sigue local-first.
    let resuelto = false;
    const respaldo = setTimeout(() => {
      if (resuelto) return;
      resuelto = true;
      setSession(sesionGuardada());
      setAuthListo(true);
    }, 2500);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || !resuelto) setSession(data.session);
      resuelto = true; clearTimeout(respaldo); setAuthListo(true);
    }).catch(() => { if (!resuelto) { resuelto = true; clearTimeout(respaldo); setSession(sesionGuardada()); setAuthListo(true); } });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { clearTimeout(respaldo); data.subscription.unsubscribe(); };
  }, []);

  // Fotos de los ejercicios de tus rutinas guardadas para verlas en el gym sin internet
  const rutinas = useBrio((s) => s.perfil?.entreno?.rutinas);
  useEffect(() => {
    const ids = new Set((rutinas ?? []).flatMap((r) => r.dias.flatMap((d) => d.ejercicios.map((e) => e.ej))));
    const t = setTimeout(() => guardarSinRed([...ids].flatMap(fotosEjercicio)), 4000);
    return () => clearTimeout(t);
  }, [rutinas]);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) return;
    // Si ya hay datos en el dispositivo se muestran de inmediato y se sincroniza en segundo plano
    // (sin internet la app no debe quedarse en "cargando").
    if (!useBrio.getState().perfil) setSyncListo(false);
    setVerCuenta(false);
    iniciarSync(uid).finally(() => setSyncListo(true));
  }, [uid]);

  const omitir = () => {
    try { localStorage.setItem(K_SIN_CUENTA, "1"); } catch { /* sin storage */ }
    setOmitio(true);
    setVerCuenta(false);
  };

  const actual = perfil ? pesoActual(pesos, perfil.pesoInicial) : 0;
  const metas = useMemo(() => (perfil ? aplicarPlan(calcularMetas(perfil, actual), perfil) : null), [perfil, actual]);

  const terminarIntro = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* sin storage */ }
    setIntro(false);
  };

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), 2600);
    return () => clearTimeout(t);
  }, [splash]);

  const vista =
    splash ? "splash"
    : intro ? "intro"
    : !authListo || !syncListo ? "cargando"
    : verCuenta || (nubeDisponible && !session && !omitio) ? "cuenta"
    : !perfil || editando ? "onboarding"
    : "app";

  // Tutorial: la primera vez en cada sección (Hoy tiene el recorrido completo)
  useEffect(() => {
    if (vista !== "app" || tour || tab === "perfil" || tutorialVisto(tab)) return;
    const t = setTimeout(() => setTour(tab), 1100);
    return () => clearTimeout(t);
  }, [vista, tab, tour]);

  return (
    <>
    <AnimatePresence mode="wait">
      {vista === "splash" && (
        <motion.button key="splash" onClick={() => setSplash(false)} aria-label="Entrar"
          className="relative grid h-full w-full place-items-center overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.4 }}>
          <motion.div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(198,244,50,0.10) 0%, transparent 60%)" }}
            animate={{ scale: [0.9, 1.05, 1] }} transition={{ duration: 2.4 }} />
          <div className="flex flex-col items-center">
            <Logo className="text-[clamp(5rem,22vw,9rem)]" animate delay={0.15} />
            <motion.p className="mt-6 font-serif text-[clamp(20px,5vw,26px)] italic text-muted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
              Ponle brío a tu vida.
            </motion.p>
          </div>
        </motion.button>
      )}
      {vista === "intro" && <Intro key="intro" onDone={terminarIntro} />}
      {vista === "cargando" && (
        <motion.div key="cargando" className="grid h-full place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><Logo className="text-5xl" /></motion.div>
        </motion.div>
      )}
      {vista === "cuenta" && <Cuenta key="cuenta" onOmitir={omitir} />}
      {vista === "onboarding" && (
        <Onboarding key="onb" inicial={perfil} onDone={(p) => { setPerfil(p); setEditando(false); setTab("hoy"); }} />
      )}
      {vista === "app" && perfil && metas && (
        <motion.div key="app" className="min-h-full md:grid md:grid-cols-[232px_1fr]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Barra lateral (laptop) */}
          <aside data-tour="nav" className="sticky top-0 hidden h-screen flex-col gap-1 border-r border-line px-4 py-6 md:flex">
            <div className="px-3 pb-6"><Logo className="text-[30px]" /></div>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id}
                className={`flex items-center gap-3 rounded-[12px] border px-3 py-2.5 font-display text-[15px] font-semibold uppercase tracking-[0.1em] transition ${tab === t.id ? "border-line bg-surface text-ink [&_svg]:text-lime-ink" : "border-transparent text-muted hover:text-ink"}`}>
                <t.I />{t.t}
              </button>
            ))}
            <p className="mt-auto px-3 font-serif text-sm italic text-muted">Ponle brío a tu vida.</p>
          </aside>

          <div className="min-w-0">
            <main className="mx-auto max-w-[1100px] px-4 pb-28 pt-[max(env(safe-area-inset-top),1rem)] md:px-10 md:pb-12 md:pt-7">
              {/* Barra superior */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="md:hidden"><Logo className="text-[30px]" /></span>
                <span className="rounded-full bg-t-streak px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink md:order-first">
                  Racha · {racha(dias, metas.aguaMl, habitosDe(perfil))} días
                </span>
                <button onClick={alternar} aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink">
                  {oscuro ? <IcSol /> : <IcLuna />}
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                  {tab === "hoy" && <Hoy perfil={perfil} metas={metas} onIrComida={() => setTab("comida")} />}
                  {tab === "comida" && <Comida perfil={perfil} metas={metas} />}
                  {tab === "entreno" && <Entreno />}
                  {tab === "progreso" && <Progreso perfil={perfil} metas={metas} actual={actual} />}
                  {tab === "perfil" && (
                    <Perfil perfil={perfil} metas={metas} onEditar={() => setEditando(true)} onVerIntro={() => setIntro(true)} onVerTutorial={() => { reiniciarTutorial(); setTab("hoy"); window.scrollTo(0, 0); setTimeout(() => setTour("hoy"), 500); }}
                      email={session?.user.email ?? null} estadoSync={estadoSync} onCrearCuenta={() => setVerCuenta(true)} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Barra inferior (celular) */}
          <nav data-tour="nav" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur-lg md:hidden">
            <ul className="mx-auto grid max-w-md grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setTab(t.id)} aria-current={tab === t.id}
                    className={`flex w-full flex-col items-center gap-1 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.12em] ${tab === t.id ? "text-ink [&_svg]:text-lime-ink" : "text-muted"}`}>
                    <t.I />{t.t}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
    {vista === "app" && tour && <Tour key={`tour-${tour}`} pasos={RECORRIDOS[tour]} onFin={() => { marcarTutorial(tour); setTour(null); }} />}
    </>
  );
}
