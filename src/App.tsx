import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "motion/react";
import Intro from "./components/Intro";
import Onboarding from "./components/Onboarding";
import Hoy from "./components/Hoy";
import Peso from "./components/Peso";
import Despensa from "./components/Despensa";
import Perfil from "./components/Perfil";
import Cuenta from "./components/Cuenta";
import Logo from "./components/Logo";
import { nubeDisponible, supabase } from "./lib/supabase";
import { iniciarSync, useSync } from "./lib/sync";
import { calcularMetas } from "./lib/calc";
import { pesoActual, useBrio } from "./lib/store";

const KEY = "brio:intro-visto-v3";
// limpia datos de versiones de prueba anteriores
try { ["brio:datos", "brio:intro-visto", "brio:datos-v2", "brio:intro-visto-v2"].forEach((k) => localStorage.removeItem(k)); } catch { /* sin storage */ }

const introVisto = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const K_SIN_CUENTA = "brio:sin-cuenta";
const sinCuenta = () => { try { return localStorage.getItem(K_SIN_CUENTA) === "1"; } catch { return false; } };

const TABS = [
  { id: "hoy", e: "☀️", t: "Hoy" },
  { id: "peso", e: "⚖️", t: "Peso" },
  { id: "despensa", e: "🧺", t: "Despensa" },
  { id: "perfil", e: "👤", t: "Perfil" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function App() {
  const perfil = useBrio((s) => s.perfil);
  const pesos = useBrio((s) => s.pesos);
  const setPerfil = useBrio((s) => s.setPerfil);
  const [intro, setIntro] = useState(!introVisto());
  const [editando, setEditando] = useState(false);
  const [tab, setTab] = useState<Tab>("hoy");
  const [session, setSession] = useState<Session | null>(null);
  const [authListo, setAuthListo] = useState(!nubeDisponible);
  const [syncListo, setSyncListo] = useState(true);
  const [omitio, setOmitio] = useState(sinCuenta());
  const [verCuenta, setVerCuenta] = useState(false);
  const estadoSync = useSync((s) => s.estado);

  useEffect(() => {
    if (!nubeDisponible) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthListo(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) return;
    setSyncListo(false);
    setVerCuenta(false);
    iniciarSync(uid).finally(() => setSyncListo(true));
  }, [uid]);

  const omitir = () => {
    try { localStorage.setItem(K_SIN_CUENTA, "1"); } catch { /* sin storage */ }
    setOmitio(true);
    setVerCuenta(false);
  };

  const actual = perfil ? pesoActual(pesos, perfil.pesoInicial) : 0;
  const metas = useMemo(() => (perfil ? calcularMetas(perfil, actual) : null), [perfil, actual]);

  const terminarIntro = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* sin storage */ }
    setIntro(false);
  };

  const vista =
    intro ? "intro"
    : !authListo || !syncListo ? "cargando"
    : verCuenta || (nubeDisponible && !session && !omitio) ? "cuenta"
    : !perfil || editando ? "onboarding"
    : "app";

  return (
    <AnimatePresence mode="wait">
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
        <motion.div key="app" className="min-h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <main className="mx-auto max-w-md px-4 pb-28 pt-[max(env(safe-area-inset-top),1.25rem)]">
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                {tab === "hoy" && <Hoy perfil={perfil} metas={metas} />}
                {tab === "peso" && <Peso perfil={perfil} metas={metas} actual={actual} />}
                {tab === "despensa" && <Despensa />}
                {tab === "perfil" && (
                  <Perfil perfil={perfil} metas={metas} onEditar={() => setEditando(true)} onVerIntro={() => setIntro(true)}
                    email={session?.user.email ?? null} estadoSync={estadoSync} onCrearCuenta={() => setVerCuenta(true)} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-lg">
            <ul className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
              {TABS.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setTab(t.id)} className="relative flex w-full flex-col items-center gap-0.5 py-1.5" aria-current={tab === t.id}>
                    {tab === t.id && <motion.span layoutId="tab" className="absolute inset-x-3 inset-y-0 rounded-2xl bg-lime/10" />}
                    <span className="relative text-xl">{t.e}</span>
                    <span className={`relative text-[11px] font-medium ${tab === t.id ? "text-lime" : "text-muted"}`}>{t.t}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
