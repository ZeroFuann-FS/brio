import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Escribe /precache.json con los archivos del build para que el service worker deje la app lista sin internet. */
function precache(): Plugin {
  return {
    name: "brio-precache",
    apply: "build",
    generateBundle(_, bundle) {
      const archivos = Object.keys(bundle).filter((f) => /\.(js|css|woff2?)$/.test(f)).map((f) => `/${f}`);
      this.emitFile({ type: "asset", fileName: "precache.json", source: JSON.stringify({ version: Date.now(), archivos }) });
    },
  };
}

export default defineConfig({ plugins: [react(), tailwindcss(), precache()] });
