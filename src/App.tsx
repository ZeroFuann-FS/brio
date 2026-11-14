import { useState } from "react";
import { AnimatePresence } from "motion/react";
import Intro from "./components/Intro";
import Home from "./components/Home";

const KEY = "brio:intro-visto";

function introVisto() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export default function App() {
  const [vista, setVista] = useState<"intro" | "home">(introVisto() ? "home" : "intro");

  const terminarIntro = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* sin storage */ }
    setVista("home");
  };

  return (
    <AnimatePresence mode="wait">
      {vista === "intro"
        ? <Intro key="intro" onDone={terminarIntro} />
        : <Home key="home" onVerIntro={() => setVista("intro")} />}
    </AnimatePresence>
  );
}
