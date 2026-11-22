# Herramientas de Brío (capturas y videos)

Todo usa los **datos de demostración de "ZeroFuann"** (inventados, con fechas relativas a hoy), así que nunca salen datos reales.
Nada de esta carpeta se publica con la app.

## 1. Datos de demostración

```bash
npx tsx herramientas/demo/datos-demo.ts > /tmp/demo.json            # normal
npx tsx herramientas/demo/datos-demo.ts --sesion > /tmp/demo-sesion.json   # con un entreno a medias
```

Para cambiar al personaje (nombre, peso, rutina, metas, horario…), edita `demo/datos-demo.ts`.

## 2. Capturas (Firefox sin ventana)

```bash
npx vite --port 5199 &   # la app corriendo
node herramientas/capturas/capturar.mjs --datos /tmp/demo.json \
  --escenas herramientas/capturas/escenas-conoce-cel.json --salida /tmp/capturas \
  --ancho 390 --alto 844 --escala 2            # celular
# laptop: --ancho 1440 --alto 900 · modo oscuro: --oscuro · página completa: --completa
```

Cada escena es `{ "nombre", "tab", "pasos": [{ "clic": "Texto" }, { "bajar": 600 }, { "escribir": "…", "en": "css" }, { "js": "…" }] }`.
Las de la página /conoce se convierten a WebP: celular 600×1298, laptop 1600×1000.

## 3. Videos (Playwright + Chromium)

Una sola vez: `cd herramientas/videos && npm install && npx playwright install chromium`

```bash
npx vite --port 5199 &
node herramientas/videos/grabar.mjs celular /tmp/demo.json /tmp/videos       # 720×1280, ~3 min, con música
node herramientas/videos/grabar.mjs computadora /tmp/demo.json /tmp/videos   # 1280×720, modo oscuro
node herramientas/videos/grabar.mjs corto /tmp/demo.json /tmp/videos         # 540×960, ~30 s, sin audio
```

Los guiones están en `videos/guiones.mjs`: portada, capítulos (cortinillas), subtítulos con `<b>resaltado</b>`,
toques con el círculo lima, escribir, bajar y cerrar. Para un video nuevo (reel, tutorial de una función),
agrega una entrada en `GUIONES` con su tamaño (`viewport`, `escala`, `video`) y sus pasos.

Música: `videos/audio/musica.m4a` (libre de derechos, la misma de los videos anteriores).

## 4. Revisar una página completa

```bash
node herramientas/videos/capturar-pagina.mjs http://localhost:5199/conoce/index.html /tmp/capturas
```

Saca la página entera a 390 (claro y oscuro), 768 y 1440 px y avisa si algo se sale a lo ancho.
Grabación: los videos usan el screencast de Chromium (cuadros a resolución real con su hora exacta);
el `recordVideo` de Playwright ignora la escala y deja la app chiquita en una esquina.
