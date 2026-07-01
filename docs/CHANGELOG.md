# CHANGELOG.md — Historial de Cambios

Formato recomendado basado en Keep a Changelog. Bitácora de sesiones al inicio; notas por versión abajo.

---

## 2026-07-01 — Fase 19: descargas reales, folio de evento al día, Historial con videos + QR

### Cambios realizados
- **FIX "Descargar no descarga":** el atributo `download` se ignora en enlaces cross-origin (el medio
  vive en Blob). Ahora el botón usa `?download=1` de Vercel Blob → `Content-Disposition: attachment`
  → descarga real también en teléfonos. Verificado: header `attachment; filename=...`.
- **FIX "el video no sale en el folio del evento":** causa raíz — el índice del evento era un JSON
  que se SOBREESCRIBÍA en el mismo pathname y el CDN de Blob servía la versión **cacheada vieja**
  (por eso ni reiniciando aparecía; el QR individual sí funcionaba porque su JSON es único).
  **Rediseño write-once (web v0.2):** cada medio escribe `index/media/<FOLIO>.json` (pathname único,
  nunca reescrito) y el listado del evento se deriva con `list()` por prefijo (llamada API en vivo,
  sin caché). Los medios "perdidos" reaparecieron al instante (MH-YGU7 ahora lista 3/3) y toda subida
  nueva aparece de inmediato. Compatible con eventos ya creados.
- **Historial completo del evento (software):** ahora mezcla **sesiones de fotos y videos en orden
  cronológico**; cada tarjeta tiene botón **"QR / Folio"** y **hacer clic en la foto/video abre el
  modal con su QR + folio** (publica si aún no estaba publicado; copiar folio / abrir página).
  Acciones de sesión intactas (Ver foto, Reimprimir, Originales, Exportar, Archivar).

### Verificación
- E2E web en vivo: evento MH-YGU7 lista 3 medios (incl. video nuevo MH-YGU7-0003 al instante);
  descarga con header attachment. Gate software: typecheck 0 · lint 0 · **59 tests** · build 0.
- Captura Historial: video (Grabado) + sesión con sus botones QR/Folio, orden cronológico.
- Paquete sincronizado por robocopy a release/ + instalación; ZIP regenerado. Web repo pushed.

### Próximo paso
- Probar en tu teléfono: escanear QR → Descargar (debe guardar el archivo), y folio de evento con todo.

---

## 2026-07-01 — Fase 18: QR sin foto, videos grandes, overlay dentro del video

### Cambios realizados
- **Vista pública (review) SIN imagen final:** en ambos modos ya no se muestra la foto — solo la
  **pantalla de QR centrada** ("¡Escanea tu foto!" + folio) sobre la cámara en vivo; sin QR/folio se
  muestra "¡Tu foto está lista!". Se eliminó `finalUrl` del estado en vivo (ya no viaja el base64
  pesado por IPC) y el CSS muerto (final/qrcorner).
- **FIX videos que no subían (causa raíz):** Vercel limita cada request a ~4.5 MB → los videos
  fallaban. Solución: **subida directa a Vercel Blob** con token de cliente — la web emite el token
  (`/api/blob-token`, clave validada, máx 500 MB) y el software sube DIRECTO al storage (multipart
  interno >8 MB), luego registra el medio (`/api/register-media`) para su folio. Archivos ≤3.5 MB
  siguen por `/api/upload`. Se descartó el proxy por partes (Blob exige partes ≥5 MB > límite 4.5 MB).
  Dep nueva del software: `@vercel/blob` (client). Verificado E2E: **video de 9 MB subido desde
  Electron → folio MH-UQH4-0002 + HEAD 200 (9,437,184 bytes)**.
- **Superposición DENTRO del video:** el lienzo de grabación ahora usa el **formato real de la
  cámara** (detectado del stream, tope 1920 px, sin letterbox) — el logo/texto siempre cae dentro del
  video, con el **aspecto natural de la imagen** (sin distorsión). Además, **preview en vivo** del
  overlay sobre la cámara en la sección Videos (posicionado sobre el rect real del video, unidades
  de container `cqh`).

### Verificación
- Gate: typecheck 0 · lint 0 · **59 tests** · build 0. Web `next build` OK + redeploy READY.
- E2E: 9 MB por client-upload desde Node y desde Electron (`VIDEO_OK`); vista pública instalada
  `qrscreen=true finalimg=false`.
- App **reinstalada** (robocopy /MIR; la carpeta release/ quedó bloqueada por el Explorador — el
  build fresco vive en dist-packager/ y en la instalación; el swap de release/ queda pendiente de
  cerrar la ventana del Explorador).

### Próximo paso
- Grabar un video real con plantilla de superposición y confirmar posición + subida en el evento.

---

## 2026-07-01 — Fase 17: Videos + Folios/QR + Web conectada (build mayor)

### Cambios realizados
- **Migración 004 (schema v4):** events += `enable_photos/enable_videos/web_upload_enabled/web_event_folio/video_template_id`;
  tablas nuevas `videos`, `web_uploads` (cola de publicación offline-tolerante), `video_templates`.
- **WebService (main):** config (URL + API key en settings), `ensureEventFolio`, `publishSessionFinal`
  (con `force` para retakes), `publishVideo` (límite ~95 MB), `listUploads`, `retryPending`,
  `testConnection`, QR por `qrcode`. Cola en `web_uploads` con reintento.
- **VideoService + VideoTemplateService (main):** grabar (bytes del renderer) / importar MP4-WEBM-MOV
  a `events/event_x/videos/`, listar/borrar/dataUrl; plantillas de video (config JSON) con CRUD y
  limpieza de referencia en eventos al borrar.
- **IPC/preload/api:** áreas nuevas `web`, `videos`, `videoTemplates` (typed, Result<T>).
- **Wizard de evento (EventForm):** toggles "Sesión de fotos"/"Videos (cámara 360)", plantilla de
  video, "Subir a la página web"; al guardar crea el **folio maestro** del evento (toast). Valida ≥1 modo.
- **SessionScreen:** al componer, si el evento publica → sube la final SIEMPRE (haya impresora o no)
  → panel en review con **QR + folio + Copiar + Abrir página** + reintento; toggle **"QR al terminar
  (en vez de imprimir)"** (visible solo con modo automático); auto-reset a los 20 s; guard "solo videos".
- **Vista pública:** QR **grande en esquina inferior izquierda** al terminar (modo manual o auto
  normal); **pantalla completa de QR** ("¡Escanea tu foto!" + folio + botón **Siguiente**) en auto+QR;
  toque = siguiente en ese modo.
- **VideosScreen (nueva):** selector de cámara (USB/Bluetooth/WiFi), grabación con **superposición
  quemada en vivo** (canvas 1280×720 + captureStream + MediaRecorder webm), importar video, lista con
  estado de publicación, modal de **folio + QR** al subir.
- **VideoTemplateEditor (nueva, en Plantillas):** lienzo 16:9, agregar logo/imagen (PNG/JPG/WebP) y
  textos (Cinzel/Pinyon/Inter, colores de marca), arrastrar/redimensionar; se graba encima del video.
- **WebScreen "Página web" (nueva):** conexión (URL + clave + probar + abrir), **folio del evento con
  QR** (copiar/ver galería), lista de publicaciones (estado, detalle con final + abrir originales,
  reintentar pendientes). El público solo ve finales; originales = solo admin (locales).
- **Navegación condicional:** evento solo-fotos oculta Videos; solo-videos oculta Sesión/Impresión.
- **Web (Vercel):** Blob v1 (`head()` + `allowOverwrite`), `/api/upload` respeta extensión real,
  `UPLOAD_API_KEY` + `NEXT_PUBLIC_SITE_URL` configurados; redeploy.

### Verificación (auditada)
- Gate: typecheck 0 · lint 0 · **59 tests** (12 archivos; +5 Fase 17) · build 0.
- **E2E web en vivo (curl):** crear evento → `MH-YGU7` → subir foto → `MH-YGU7-0001` → página 200 →
  folio de evento lista todo.
- **E2E software→web (smoke):** `publishSessionFinal` desde Electron → `PUBLISH_OK folio=MH-UQH4-0001 qr=true`.
- **Capturas:** VideosScreen (cámara real), WebScreen (folio MH-UQH4 + publicación "Publicado"),
  pantalla pública de QR con folio + Siguiente.
- Paquete reensamblado + **reinstalado**; app instalada confirma `/videos` + API web.

### Entidades/BD afectadas
- Migración **004** (v4): 3 tablas nuevas + 5 columnas en events. Backup automático al migrar.

### Bugs nuevos detectados
- Ninguno abierto. Nota: la clave API se muestra enmascarada en la UI; viaja solo a la web configurada.

### Próximo paso
- Configurar URL + clave en la app instalada (sección "Página web") y probar con la cámara 360 real.

---

## 2026-06-30 — Fix sesiones infinitas + web con almacenamiento

### Cambios realizados (software — local, sin subir al repo del software)
- **Bug de sesiones infinitas ARREGLADO:** `finalize()` ahora resetea TODO el estado
  (session/captures/composed/errores/currentIndex/countdown/flashing/poseText/working). En modo
  automático, `start` funciona también desde `review` (el siguiente invitado inicia de inmediato);
  botón "Listo" → "Nueva sesión" con `stopPropagation` para no disparar comandos en conflicto.
- `eslint.config.mjs`: ignora `website/**`, `dist-packager/**`, `**/node_modules/**`.

### Cambios realizados (web — desplegados)
- **Vercel Blob store** `mh-photo-media` (público) creado y **enlazado** al proyecto → `BLOB_READ_WRITE_TOKEN`.
- `NEXT_PUBLIC_SITE_URL` configurado; **redeploy** OK. La web queda lista para recibir subidas.

### Gate
- Software: typecheck 0 · lint 0 · **54 tests** · build 0. Web: deploy READY.

### Pendiente (siguiente build de software — grande, por fases; NO subir repo software hasta OK)
- Subida foto/video → folio + QR (por evento); **QR en vista pública** (auto OFF: esquina inf. izq.
  grande al terminar; auto ON: pantalla de QR + nuevo toggle "QR en vez de imprimir" + "Siguiente" +
  auto-reset ~15 s). Config web (URL + API key) en Ajustes; **siempre** sube la foto final si el
  evento tiene subida activada (haya o no impresora).
- **Modo Videos** (cámara Bluetooth/WiFi + subir archivo de video) por evento.
- **Wizard al crear evento** (fotos y/o video, plantillas, QR-en-foto, subir-a-web → crea folio de evento).
- **Plantillas de video** (superposición imagen/logo/texto) + **sección admin web** en el software
  (ver por evento la foto final + originales; público solo ve la final).

---

## 2026-06-30 — GitHub + fundación de la página web

### Cambios realizados
- **Software subido a GitHub (público):** repo `mh-photo-booth-studio`
  (https://github.com/M1gu3hb/mh-photo-booth-studio). `git init` + `.gitignore` (excluye
  node_modules/build/paquete/ZIP). Esta es la "nube" del software; se actualiza bajo pedido.
- **Página web (fundación) creada** en `website/` (Next.js 14 + TS + Tailwind, `next build` OK):
  home (ingresar folio), `/f/[folio]` (galería + descarga; folio de evento = todo, individual = uno),
  `/admin` (panel básico), API `POST /api/event`, `POST /api/upload` (x-api-key), `GET /api/media/[folio]`,
  almacenamiento `lib/storage` (local ↔ Vercel Blob), índice de folios `lib/db` (JSON sobre storage).
  **MDs propios** de la web (`website/CONTEXT.md`, `README.md`, `.env.example`).
- **Repo separado de la web (público):** `mh-photo-booth-web`
  (https://github.com/M1gu3hb/mh-photo-booth-web), root = contenido de `website/` (subtree push).

### Archivos modificados
- Nuevos: `.gitignore` (raíz, ajustado), `website/**` (proyecto Next.js completo).
- La web también vive en el repo del software (commit local en `website/`); se despliega desde su propio repo.

### Pendiente / próximo (NO subir al repo del software hasta que el owner lo pida)
- **Deploy a Vercel:** requiere login de Vercel del owner (CLI no autenticado aquí). Pasos en `website/README.md`.
- **Modo Videos (cámara 360°)** en el software + **folios + QR** por foto/video + subida a la web por API.
- **Plantillas de video** (superposición de imagen/texto) en la sección Plantillas.
- **Sección "Página web" (admin)** dentro del software.
- **Fix bug modo automático:** al dar "Listo" no deja iniciar otra sesión (sesiones deben ser infinitas).

### Gate
- Software: typecheck/lint/54 tests/build 0 (sin cambios de código esta sesión salvo `.gitignore`).
  Web: `next build` OK.

---

## 2026-06-30 — Vista pública: guía exacta + sin mensaje

### Cambios realizados
- **Se quitó el mensaje central** (pose "¡Sonrían!"/etc.) de la vista pública: no siempre aplica.
- **Guía de encuadre ahora EXACTA y "imaginaria":** sin borde visible; solo se **atenúa** (sutil) lo
  que queda fuera de la región que la foto realmente conserva. El tamaño se calcula del recorte real:
  la captura toma el **cuadro completo** de la cámara y la composición lo mete al slot con `cover`, así
  que la región conservada = recorte centrado del cuadro al **aspecto del slot** de la foto actual.
  La cámara pública pasó a `object-fit: contain` (se ve el cuadro completo) y la guía se mapea con
  `frameAspect` (cámara), `slotAspect` (plantilla) y `stageAspect` (pantalla). Verificado numéricamente
  (cámara 1920×1080 + slot 0.5 + pantalla 1264×793 → guía 356×711 px = recorte exacto).

### Archivos modificados
- `src/renderer/screens/PublicViewScreen.tsx` (cálculo exacto de la guía, quitado el pose, `frameAspect`/`stageAspect`).
- `src/renderer/screens/publicview.css` (cámara `contain`; guía sin borde, solo dim; quitado `.pb-public__pose`).

### Bugs resueltos
- La guía no respetaba el slot (mostraba de más). Ahora coincide exactamente con lo que sale en la foto.
- Sensación de "recuadro muy marcado/limitado": se quitó el borde; queda solo la atenuación sutil.

### Próximo paso
- Validar con hardware real: poner el dedo en el límite de la guía y confirmar que en la foto queda al límite.

### Gate
- typecheck 0 · lint 0 · 54 tests · build 0. Reensamblado + reinstalado; verificado (guía 356×711, sin pose).

---

## 2026-06-30 — Vista pública (rediseño) + editor de impresión

### Cambios realizados
- **Vista al público (Fase 15):**
  - Contador grande en la **esquina superior derecha** con animación aparecer/desaparecer (ya no
    empuja el layout ni sale del lateral). "¡Listo!" grande centrado en el flash.
  - **Marco dorado (latón) alrededor de toda la pantalla** como detalle.
  - **Guía de encuadre por foto:** recuadro dorado con el **aspecto real del slot** de la plantilla
    (leído del template activo, mismo orden que la composición) + recuadro interior sutil; el exterior
    se **atenúa** para que el invitado vea exactamente qué se capturará (cada foto puede tener otro tamaño).
  - Cámara pública en `object-fit: cover`.
  - **Fix modo automático:** el estado en vivo se **cachea en main y se reenvía** a la ventana pública
    al abrir (`did-finish-load`), así ya indica "Toca para empezar" y el toque inicia (antes mostraba
    el texto de modo manual porque abría después del broadcast).
- **Editor de plantilla de impresión (Fase 16):**
  - Se eliminó el "espacio extra": la tira **llena su caja** (`object-fit: cover`, caja = aspecto de la tira).
  - Redimensionar **mantiene la proporción** de la tira (arrastrar esquina escala proporcional).
  - **Botón Duplicar** por tira (copia al mismo tamaño); "Agregar tira" crea una tira con el aspecto correcto.

### Archivos modificados
- `src/renderer/screens/PublicViewScreen.tsx` + `publicview.css`; `src/renderer/screens/publicview.css`.
- `src/main/publicWindow.ts` (cache + replay de estado), `src/main/ipc/liveDisplay.handlers.ts` (rememberLiveState).
- `src/renderer/components/print/PrintTemplateEditor.tsx` + `printTemplates.css`.
- `src/renderer/styles/tokens.css` (ya tenía `--paper-white`).

### Entidades/base de datos afectadas
- Ninguna (solo UI + IPC de estado en vivo).

### Bugs resueltos
- Vista pública no indicaba modo automático / el toque no iniciaba (cache-replay de estado).
- Contador salía del lateral y movía la pantalla (ahora esquina superior derecha, absoluto).
- "Espacio extra" en los slots del editor de impresión (ahora la tira llena su caja, proporción bloqueada).

### Bugs nuevos detectados
- Ninguno. Persiste LIM-2 (cámara dual en vista pública) en `docs/BUGS_PENDING.md`.

### Decisiones tomadas
- La guía de encuadre usa el aspecto del slot y atenúa el exterior (dim) en vez de blur real, por
  robustez (un blur con "hueco" exige duplicar el stream de cámara).

### Próximo paso
- Verificar con hardware real: cámara dual en 2 monitores + impresión de la plantilla manual.

### Gate
- typecheck 0 · lint 0 · 54 tests · build 0. Paquete reensamblado + reinstalado; verificado por capturas.

---

## 2026-06-30 — Documentación de transferencia

### Cambios realizados
- Se creó el **set de transferencia** para que cualquier sesión/IA continúe sin perder contexto.
- Sin cambios de código. Estado del producto sin cambios: v1.0.0, 54 tests, build 0, instalado por usuario.

### Archivos modificados
- Nuevos: `PROJECT_CONTEXT.md` (raíz), `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/FILE_MAP.md`,
  `docs/BUGS_PENDING.md`, `docs/NEXT_STEPS.md`, `docs/PROMPTS.md`.
- Actualizados: `CLAUDE.md` (protocolo de transferencia + reglas vivas + reading list), `docs/CHANGELOG.md`.

### Entidades/base de datos afectadas
- Ninguna (documentación; el esquema sigue en versión 3).

### Bugs resueltos
- Ninguno (sesión de documentación).

### Bugs nuevos detectados
- Ninguno. Se documentaron limitaciones conocidas en `docs/BUGS_PENDING.md` (LIM-1 instalador NSIS,
  LIM-2 cámara dual en vista pública).

### Decisiones tomadas
- `PROJECT_CONTEXT.md` + `CLAUDE.md` son la fuente de transferencia; los docs de diseño antiguos
  (`TECH_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `BUGS.md`) quedan como referencia histórica.

### Próximo paso
- Validar en evento real con hardware definitivo (cámara/impresora) — ver `docs/NEXT_STEPS.md`.

---

## [Sin publicar] — Mejoras post-1.0

### Added

- **Borrar plantilla (Fase 11):** acción "Borrar" con confirmación en la sección Plantillas
  (`TemplateService.delete` + IPC `templates:delete`). Borra slots, registro y carpeta en disco;
  quita la referencia de los eventos que la tenían y avisa cuántos quedaron sin plantilla. Las
  fotos/resultados de eventos pasados se conservan. `StorageService.removeDir` (borrado seguro
  dentro del data root). Tests: borrado completo + limpieza de referencia en eventos.
- **Impresión compacta (Fase 12):** nuevo `computeStripGrid` empaca las tiras en la rejilla
  rows×cols que más llena la hoja según el aspecto de la tira (ej. 8 = 4×2), con márgenes/gaps
  reducidos — se acabó el papel desperdiciado de la fila única. `buildSheet` deriva el aspecto de
  la tira y usa la rejilla; `SHEET_LAYOUTS` ahora llega a 12 por hoja. Tests: 8→4×2, límites dentro
  de la hoja, tiras anchas se apilan, y la rejilla da tiras más grandes que la fila única.

- **Plantillas de impresión por evento (Fase 13 — backend):** nueva entidad `print_templates`
  (+ `print_template_slots`, coords normalizadas 0..1) ligada a un evento vía migración 003 con
  borrado en cascada. `PrintTemplateService` (list/get/create/save/delete por evento),
  `computePrintCells` (modos `grid` auto, `custom` por slots, `full` hoja completa), IPC
  `printTemplates:*` + preload + tipos. Tests: layout (4) + servicio (4) + migración v3.
- **Plantillas de impresión — UI (Fase 13):** en la sección Impresión, tarjeta para
  crear/seleccionar/borrar la plantilla de impresión del evento; `PrintTemplateEditor` con modos
  **Auto (rejilla)**, **Manual** (arrastrar/redimensionar tiras) y **Hoja completa**, eligiendo
  formato de hoja y qué plantilla de foto usa. Al elegir una plantilla, la hoja se compone con su
  acomodo (vista previa en vivo) y los controles manuales se bloquean.
- **Vista al público + modo automático (Fase 14):** ventana secundaria de Electron en el 2º monitor
  (`/publico`, sin controles de admin) que refleja la cámara en vivo y el estado de la sesión
  (conteo/flash/foto final). Botones **"Vista al público"** y toggle **"Modo automático"** debajo de
  "Iniciar sesión" (sin alterar el flujo del operador). "Modo evento" abre la ventana pública.
  **Automático apagado:** la pública es espejo en vivo del operador. **Automático encendido:** el
  público inicia e imprime desde la pantalla (toque o botonera por teclado: Enter/Espacio/P). Canal
  IPC operador↔público (`live:*`) + gestión de ventana (`display:*`).

### Changed

- `SHEET_LAYOUTS` pasó de `[1,2,3,4]` a `[1,2,3,4,6,8,10,12]` (más tiras por hoja).
- `buildSheet` acepta el modo de la plantilla de impresión (rejilla/manual/hoja completa).
- Empaque reconstruido y reinstalado (instalador por usuario) con todas las mejoras Fase 11–14.

### Added

- **Branding configurable** (Jardines por defecto): nombre, venue, bienvenida y logo editables
  desde Configuración; `ThemeProvider` los carga vía IPC y se reflejan en toda la UI.
- Pantalla **"Acerca de"** (versión 1.0.0, ambiente, plataforma, ruta de datos, licencia).
- **Licencia local NO bloqueante** (informativa).
- **Export/Import de eventos** (`.zip`, con remapeo de ids) + plantillas (Fase 4).
- **Migraciones al iniciar con backup** previo de la base de datos.
- **electron-builder** configurado (NSIS + portable + icono + asarUnpack de better-sqlite3).
- **App empaquetada verificada** por ensamblado directo desde el runtime de Electron (DEC-020):
  carpeta `release/MH Photo Booth Studio-win32-x64/` con `MH Photo Booth Studio.exe` ejecutable.
- **Instalador por usuario sin admin** (`Install.ps1` / `Instalar.bat`): instala en
  `%LOCALAPPDATA%\Programs`, crea accesos directos (Menú Inicio + Escritorio), registra
  desinstalación en `HKCU` y deja `Uninstall.ps1` (DEC-020).
- **Distribuible**: `release/MH-Photo-Booth-Studio-1.0.0-win-x64-Installer.zip` (~130 MB) +
  `release/LEEME-INSTALACION.txt`.
- Documentación de usuario (`docs/USER_GUIDE.md`).

### Fixed

- **BUG-008 (critical):** la CSP estricta sobre `file://` dejaba el renderer empaquetado en
  blanco. Corregido sirviendo el renderer por protocolo **`app://`** con CSP en sus respuestas (DEC-018).

### Notes

- **Empaque e instalación entregados y verificados** (DEC-020): el `.exe` arranca standalone a
  v1.0.0 con DB operativa, y la app instalada corre en `environment: production` (Electron 33.4.11)
  con Diagnóstico detectando hardware real (2 impresoras, disco) bajo CSP `app://`.
- El instalador clásico `.exe` con asistente (NSIS) queda disponible vía `npm run package` en una
  máquina con admin/Modo desarrollador + red la primera vez (config lista; bloqueo de entorno por
  privilegio de symlink de `winCodeSign`, DEC-019). No es un bloqueo del producto.

### Release 1.0.0

Primer release estable: flujo completo Evento → Plantilla → Cámara → Countdown → Fotos →
Composición → Guardado → Impresión → Reimpresión → Historial, offline-first, estética
skeuomórfica Jardines. 40 tests verdes; 30 sesiones simuladas sin pérdida de datos.

## [0.10.0] — Fase 9: Modo Evento Real & Offline Hardening

### Added

- **Modo Evento** fullscreen (`/evento`, fuera del shell admin): vista operador + invitado,
  sin sidebar ni controles de admin; salida con confirmación (config bloqueada).
- IPC `app.setFullscreen`; Dashboard con CTA "Modo evento (pantalla completa)".
- Dashboard "Iniciar sesión"/"Modo evento" habilitados con evento+plantilla (la cámara se
  resuelve dentro de la sesión).

### Verified

- Simulación **30 sesiones** offline: 30 compuestas + 5 reimpresiones; tras reinicio 30 sesiones/5 jobs intactos.
- Archivos en disco = DB (30 finales, 60 originales, 5 hojas). Cero pérdida. Sin red en toda la app.

## [0.9.0] — Fase 8: Historial, Diagnóstico & Sistema de Errores

### Added

- **Historial**: sesiones por evento con miniaturas; abrir final/originales (shell), reimprimir
  (nuevo print_job), exportar sesión `.zip`, archivar con confirmación.
- **DiagnosticsService**: tablero de estado (almacenamiento, disco, cámara, impresora, evento, QR),
  versión/plataforma/rutas, últimos errores; export `diagnostics_<date>.zip` (logs + json, sin fotos).
- **Sistema de logs** por módulo (`app/errors/print/camera.log`); el wrapper IPC registra cada
  error con `{code,module,severity,...}` sin PII; nunca stack traces en UI.
- **Marcar evento listo** (Diagnóstico) → badge "Listo" en el Dashboard.
- Badge de conectividad no alarmante (navigator.onLine).
- IPC `history.*`, `diagnostics.run/export`, `events.markReady/isReady`, `sessions.listForEvent/getThumbnail/getFinal`.

### Verified

- Live: reprint crea nuevo job (1→2); markReady→isReady=true; error forzado registrado en errors.log; diagnostics recoge 6 checks + errores.

## [0.8.0] — Fase 7: Impresión & Print Sheet Builder

### Added

- **migration_002**: `print_jobs` + `method`, `layout`, `orientation`, `sheet_sessions`.
- **PrintService** + adaptadores (`image`/`pdf`/`windows`, inyectables): listar/probar impresora,
  imprimir, reintentar, listar cola. **Guarda la hoja antes de imprimir**; un fallo no borra nada.
- **PrintSheetBuilder** (`buildSheet` + `computeSheetCells` puro): 1–4 tiras/hoja, varias copias,
  varias sesiones por hoja, márgenes/separación, orientación.
- Pantalla **Impresión**: sesiones del evento, preview de hoja real, configuración completa,
  cola con estados + reintento. "Imprimir" rápido en el review de la sesión (usa copias del evento).
- IPC `print.listPrinters/test/print/retry/listJobs`; `sessions.listForEvent/getThumbnail/getFinal`.

### Verified

- 39 tests (PrintService: opciones registradas, fallo conserva archivos, reintento, reimpresión).
- Live: impresión 'image' → job completed con todas las opciones; hoja guardada + export; migración v1→v2 sobre DB existente.

## [0.7.0] — Fase 6: Template Engine (Composición)

### Added

- **Composición en Canvas** (`composeSession`, renderer): base + fotos por slot (fit
  cover/contain/stretch vía `computeDrawRect` puro) + QR + textos dinámicos → PNG/JPG/miniatura.
- **QRService** (main, qrcode): validar link, generar QR offline, guardar en `qr/event_qr.png`
  + `qr_links`; insertado solo si evento QR-on + slot QR + link válido.
- **Textos dinámicos**: slots de texto en el editor (nombre/fecha/tipo del evento) renderizados.
- `sessions.saveComposition` (main): guarda final.png/jpg + thumbnail.jpg + `session_outputs`
  + `sessions.final_output_path/thumbnail_path`, **antes de imprimir**.
- Sesión: "Preparando tu foto…" + review con el resultado final; `SLOT_COUNT_MISMATCH` con acción.

### Verified

- 32 tests (+computeDrawRect); live: composición real con 2 fotos + QR escaneable; mismatch con mensaje; archivos guardados.

## [0.6.0] — Fase 5: Cámara & Sesión de Captura

### Added

- **CameraAdapter** (renderer): WebcamAdapter (getUserMedia) + MockAdapter (sintético,
  etiquetado) + factory; `useCamera` hook con preview, estados y errores amigables.
- Selección/persistencia de cámara (settings camera_*) + tarjeta **Cámara** en Configuración
  (buscar dispositivos, elegir webcam/mock, probar en vivo).
- **SessionService** (main): start (poses por event_type), savePhoto (guardado inmediato +
  upsert en retake), complete, discard. IPC `sessions.*` y `camera.getConfig/setConfig`.
- **SessionScreen**: setup operador, captura invitado (pose, countdown gigante, flash,
  shutter), review con miniaturas + repetir foto/sesión + finalizar.
- Sonido (beep/shutter respetan setting) y permiso de cámara 'media' restringido.

### Verified

- 28 tests; live: secuencia real de 3 fotos guarda originales al instante; 30 capturas estables; cámara ausente no rompe la app.

## [0.5.0] — Fase 4: Plantillas V1 (Import + Editor de Slots)

### Added

- **TemplateService**: importar PNG/JPG (dimensiones con image-size), guardar metadatos +
  slots + `template.json`, duplicar, exportar/importar `.zip` (adm-zip), data URL de imagen.
- **Validación** de plantilla (nombre, ≥2 slots de foto, tamaños, dentro del lienzo, claves únicas).
- **Editor de slots skeuo**: lienzo en latón, crear slot foto/QR, mover/redimensionar (mouse),
  nudge por teclado (Shift=10px), grid, zoom, z-index (frente/atrás), duplicar/eliminar,
  propiedades numéricas, fit cover/contain/stretch, **Vista previa** con demo (fit visible).
- Pantalla **Plantillas**: lista con preview de imagen base + crear/importar/duplicar/exportar/editar.
- IPC `templates.create/list/get/getImage/save/validate/duplicate/export/import`.
- EventForm ahora asigna plantilla real (cierra el flujo evento→plantilla).

### Verified

- 22 tests (validación + round-trip export/import + duplicar + dims).
- Live: editor renderiza slots sobre la imagen base; "Guardar" escribe template.json; list persiste.

### Fixed

- BUG-005: id de carpeta/imagen desalineado con el id del registro en create/duplicate/import.

## [0.4.0] — Fase 3: Eventos & Almacenamiento por Evento

### Added

- **EventService**: crear/editar/archivar/listar/evento activo + validación (nombre, tipo,
  fotos 2/3/4, copias 1-20, QR link válido).
- Al crear: carpeta `events/event_<id>/` con subcarpetas + `event.json` (escritura segura).
- **Evento activo** persistente (`settings.active_event_id`), visible en topbar y Dashboard.
- IPC `events.create/update/archive/list/getActive/setActive` (payloads validados).
- Pantalla **Eventos**: lista de cards + modal crear/editar (form con validación inline) + archivar con confirmación.
- Dashboard: card de evento activo real + "Iniciar sesión" deshabilitado con motivo (falta plantilla).
- Estado de eventos centralizado en `EventsProvider` (consumido por topbar/dashboard/eventos).

### Verified

- 17 tests verdes (+4 EventService: carpeta/json/activo, validación, update, archivar).
- Live: crear evento → carpeta+json+DB+activo; persiste tras reinicio; mostrado en 3 superficies.

### Fixed

- BUG-004: import CSS inválido en EventsScreen rompía el build de producción.

## [0.3.0] — Fase 2: Capa de datos (SQLite) & Settings

### Added

- **SQLite** vía better-sqlite3 (main process) tras una interfaz `Db` que permite testear
  con `node:sqlite` (DEC-015).
- **Migraciones versionadas** idempotentes (`PRAGMA user_version` + `schema_migrations`) que
  crean las 11 tablas de `docs/DATABASE_SCHEMA.md`.
- **Repositorios tipados** (BaseRepository genérico + Settings/PosePacks/Poses) con mapeo
  automático snake_case↔camelCase.
- **StorageService**: data root configurable, estructura de carpetas y escritura segura
  (temp→verify→rename).
- **SettingsService** + IPC `settings.get/update`, `storage.getDataRoot/pickDataRoot/setDataRoot`,
  `db.status`. Validación de inputs en IPC.
- **Seed** de 7 pose packs con poses (`docs/POSE_SYSTEM.md`), idempotente.
- Pantalla **Configuración** funcional: carpeta de datos (con diálogo nativo), sonido
  (+probar), cuenta regresiva por defecto, pantalla completa (aplica al instante), info del sistema.

### Verified

- 13 tests verdes (migración idempotente + 11 tablas + CRUD + settings + seed).
- Arranque real en Electron: DB creada, carpetas creadas, seed aplicado.
- Persistencia confirmada: settings sobreviven al reinicio (sound/countdown).

## [0.2.0] — Fase 1: Design System Skeuomórfico & App Shell

### Added

- Sistema de **tokens** "Esmeralda & Oro" (`styles/tokens.css`): color, latón/fieltro,
  tipografía, espaciado, radios, sombras (una fuente de luz), motion. Cero hex sueltos.
- **ThemeProvider** con branding configurable (Jardines por defecto) vía `data-theme`.
- **Fuentes locales** empaquetadas (Cinzel, Inter, Pinyon Script) — sin red en runtime.
- Librería de **18+ componentes skeuo** con estados táctiles: Button/Primary/Danger, Card,
  Modal, Toast, StatusBadge, EmptyState, ErrorState, Input, Select, Toggle, Stepper, Icon,
  CameraPreview, CountdownDisplay, PoseCard, TemplatePreview, PrintPreview, SessionThumbnail.
- **Layout** (sidebar de latón + topbar con evento activo honesto) y **router** (HashRouter)
  con las 8 pantallas navegables (EmptyState real) + **galería de componentes** interna.
- Smoke hook ampliado: screenshot del render (`PBS_SMOKE_SHOT`/`PBS_SMOKE_ROUTE`).

### Verified

- typecheck/lint/test/build verdes; navegación y estética verificadas por screenshot.

## [0.1.0] — Fase 0: Fundación & Tooling

### Added

- Scaffold **Electron + React + TypeScript** con **electron-vite** (Vite 5).
- Estructura de carpetas de `docs/TECH_ARCHITECTURE.md`: `src/{main,preload,renderer,shared}`.
- **Preload seguro** + puente **IPC tipado** `window.photoBooth.app.getInfo()` con respuesta
  `Result<T>` y manejo de errores estructurado (`AppError` / `toAppError`).
- Seguridad Electron: `contextIsolation`, `nodeIntegration:false`, `sandbox`, CSP de
  producción y bloqueo de navegación externa.
- Tooling: ESLint 9 (flat), `typescript-eslint`, Vitest, scripts `dev/build/typecheck/lint/test/package`.
- Shell vacío que muestra la versión real (`v0.1.0`) vía IPC en el footer.
- Hook de smoke-boot (`PBS_SMOKE_EXIT`) para verificación headless.

### Verified

- `typecheck`, `lint`, `test` (6) y `build` en verde.
- Arranque de Electron sin errores; versión renderizada por IPC confirmada.

## [0.0.0] — Planeación inicial

### Added

- Context pack inicial.
- Definición de producto.
- Roadmap por fases.
- PRD.
- Arquitectura propuesta.
- Documentación de módulos principales.

### Notes

Proyecto aún sin implementación de código.
