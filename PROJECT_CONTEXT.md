# PROJECT_CONTEXT.md — MH Photo Booth Studio

> **Documento principal de transferencia.** Cualquier sesión o IA nueva debe leer este archivo
> primero (junto con `CLAUDE.md`) para entender el proyecto completo y continuar sin perder contexto.
> Mantener siempre actualizado, claro y accionable.

---

## 1. Objetivo del proyecto

App de escritorio **Windows** que funciona como **software de cabina fotográfica (photo booth)** para
eventos sociales y corporativos (XV, bodas, bautizos, empresas).

- **Para quién:** owner **Miguel**; primer uso objetivo **Jardines Club Hípico** (el branding es
  configurable para revender a otros clientes/venues).
- **Problema que resuelve:** operar una cabina de fotos en evento real — crear evento, usar plantilla,
  guiar al invitado, capturar 2/3/4 fotos, componer la tira/diseño final, guardar, **imprimir al
  momento**, reimprimir, y QR opcional — **100% offline**.

---

## 2. Estado actual (honesto)

**Versión `1.0.0`. Producto funcional y empaquetado.** Fases 0–10 (MVP) + mejoras 11–14 completas.

**Qué funciona (verificado: typecheck 0, lint 0, 54 tests, build 0):**
- Flujo completo: Evento → Plantilla → Cámara → Countdown → Fotos → Composición → Guardado →
  Impresión → Reimpresión, todo offline.
- Eventos por carpeta, plantillas de foto universales con editor de slots, sesiones 2/3/4 fotos,
  composición en canvas, QR opcional, historial/reimpresión, diagnóstico, exportar/importar eventos.
- **Fase 11:** borrar plantilla (con confirmación).
- **Fase 12:** impresión compacta — empaca tiras en rejilla que llena la hoja (8 = 4×2; hasta 12/hoja).
- **Fase 13:** plantillas de impresión **por evento** (modos auto/manual/hoja completa) + editor + vista previa.
- **Fase 14:** vista al público en 2º monitor (espejo en vivo o modo automático con toque/botonera).
- Empaque: app armada manualmente + **instalador por usuario** (sin admin) instalado en
  `%LOCALAPPDATA%\Programs\MH Photo Booth Studio`.

**Qué está incompleto / limitado (no roto):**
- **Instalador NSIS `.exe` con asistente:** la config de electron-builder existe pero NO se puede
  generar en este entorno (privilegio de symlink de `winCodeSign`; ver DECISIONS DEC-019/020).
  Se entrega instalador por usuario + ZIP portable en su lugar.
- **Hardware real (cámara/impresora):** vía adaptadores. En el entorno actual la cámara real funciona
  (getUserMedia) y se detecta impresora POS-58; sin DSLR ni impresora de sublimación confirmadas.
- **Vista al público:** abre su propia cámara (mismo dispositivo). Si el SO no permite 2 lecturas
  simultáneas, cae a cámara simulada pero los overlays de estado siguen (DEC-021).

**Qué está roto:** nada conocido. No hay bugs critical/high abiertos (ver `docs/BUGS_PENDING.md`).

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Desktop shell | **Electron 33** (+ `electron-vite 2`, Vite 5) |
| UI | **React 18 + TypeScript 5.6** (strict), React Router 6 (HashRouter) |
| Empaque módulos | **CommonJS** (no `"type":"module"`; main/preload son CJS; configs `.mjs`) |
| Base local | **SQLite** vía `better-sqlite3` (main). Tests usan `node:sqlite` por ABI |
| Composición | **Canvas** del renderer (sin Sharp) |
| Imagen (main) | `image-size` (dimensiones), `adm-zip` (export/import), `qrcode` (QR) |
| Iconos UI | `lucide-react` |
| Lint/Test | ESLint 9 (flat config), typescript-eslint 8, **Vitest 2** |
| Empaque dist | electron-builder (config lista, bloqueada en este entorno) → ensamblado manual + instalador PS1 |

Fuentes locales: `@fontsource/{cinzel,inter,pinyon-script}` (offline). Sin nube obligatoria, sin
credenciales en el repo, sin rutas absolutas en código.

---

## 4. Arquitectura general

Tres procesos Electron con **aislamiento estricto** (ver `docs/ARCHITECTURE.md` para detalle):

- **Main** (`src/main/`): ciclo de vida, ventanas, protocolo `app://` (producción, CSP estricta),
  seguridad (contextIsolation on, nodeIntegration off, sandbox, nav-guard, permisos solo media),
  bootstrap de servicios, IPC tipado, SQLite, ventana pública (2º monitor).
- **Preload** (`src/preload/index.ts`): única superficie expuesta `window.photoBooth` (objeto
  `PhotoBoothApi`), `contextBridge`. Nada de Node/ipcRenderer crudo al renderer.
- **Renderer** (`src/renderer/`): React. Pantallas + componentes UI skeuomórficos + hooks + libs de
  cámara/composición. Toda llamada al sistema pasa por `window.photoBooth.<area>.<método>`.

**IPC:** constantes `IPC_CHANNELS` (18 áreas) + wrapper `handle(channel, module, fn)` que SIEMPRE
devuelve `Result<T>` (`{ok:true,data}` | `{ok:false,error:AppError}`) y loguea errores. El renderer
nunca recibe excepciones crudas.

**Flujo principal:** Evento (activo, con plantilla) → Sesión (captura por countdown) → Composición
(canvas con slots) → Guardado (originales + final + thumbnail) → Impresión (hoja por
`computePrintCells`/`buildSheet`) → Historial/Reimpresión.

---

## 5. Módulos principales (pantallas / rutas)

Dentro del AppShell (sidebar + topbar):
| Ruta | Pantalla | Función |
|---|---|---|
| `/` | DashboardScreen | Bienvenida, evento activo, accesos rápidos, "Modo evento" |
| `/eventos` | EventsScreen | CRUD de eventos, seleccionar activo, importar evento, plantilla por evento |
| `/plantillas` | TemplatesScreen | Importar/editar/duplicar/exportar/**borrar** plantillas de foto |
| `/sesion` | SessionScreen | Captura (countdown, poses, flash) + **Vista al público** + **Modo automático** |
| `/historial` | HistoryScreen | Sesiones pasadas, reimprimir, exportar, archivar |
| `/impresion` | PrintScreen | Imprimir hoja, copias, tiras/hoja, **plantillas de impresión por evento** |
| `/configuracion` | SettingsScreen | Ajustes, cámara, branding, "Acerca de", licencia, data root |
| `/diagnostico` | DiagnosticsScreen | Chequeos pre-evento (almacenamiento, disco, cámara, impresora, QR) |
| `/galeria-ui` | GalleryScreen | Galería del sistema de diseño (componentes) |

Fuera del AppShell (pantalla completa, sin controles admin):
| `/evento` | EventModeScreen | Modo evento operador (abre la vista pública) |
| `/publico` | PublicViewScreen | Vista al público (2º monitor): espejo en vivo / interactivo |

---

## 6. Entidades y base de datos

SQLite local (un archivo por data root: `<dataRoot>/database/app.sqlite`). Versión de schema **3**
(migraciones 001–003). Detalle completo en `docs/DATABASE.md`. Tablas:

`events`, `templates`, `template_slots`, `sessions`, `session_photos`, `session_outputs`,
`print_jobs`, `print_templates`, `print_template_slots`, `settings`, `pose_packs`, `poses`,
`qr_links`, `schema_migrations`.

Entidades TS en `src/shared/types/entities.ts`: `EventRecord`, `TemplateRecord`, `TemplateSlotRecord`,
`PrintTemplateRecord`, `PrintTemplateSlotRecord`, `SessionRecord`, `SessionPhotoRecord`,
`SessionOutputRecord`, `PrintJobRecord`, `PosePackRecord`, `PoseRecord`, `QrLinkRecord`, `SettingRecord`.

Reglas de datos clave:
- **Plantillas de foto = universales** (cualquier evento puede usarlas). **Plantillas de impresión =
  por evento** (`print_templates.event_id` FK CASCADE).
- Evento activo = setting `active_event_id`.
- `print_template_slots` usa coords **normalizadas 0..1** (independientes del tamaño de papel).
- `template_slots`/`print_template_slots` y outputs se borran en CASCADE con su padre.
- Borrar una plantilla de foto limpia `events.template_id` (no rompe sesiones pasadas; sus outputs
  ya son imágenes guardadas).

---

## 7. Mapeo de archivos importantes

Resumen — mapa completo y detallado en `docs/FILE_MAP.md`.

- `src/main/index.ts` — ciclo de vida, hook smoke (`PBS_SMOKE_*`), single-instance.
- `src/main/bootstrap.ts` — arma servicios + contexto; data root; migraciones con backup.
- `src/main/context.ts` — contenedor de servicios (`AppContext`).
- `src/main/window.ts` / `src/main/publicWindow.ts` — ventana principal / ventana pública (2º monitor).
- `src/main/appProtocol.ts` — protocolo `app://` + CSP de producción. **No romper** (BUG-008).
- `src/main/security.ts` — permisos (solo media) + nav-guard.
- `src/main/services/database/` — `betterSqlite.ts`, `migrate.ts`, `migrations/`, `BaseRepository.ts`, `repositories/`.
- `src/main/services/<área>/` — `events`, `templates`, `printTemplates`, `sessions`, `qr`, `print`, `diagnostics`, `backup`, `storage`, `settings`, `logging`.
- `src/main/ipc/*.handlers.ts` + `handle.ts` + `index.ts` — handlers IPC tipados.
- `src/preload/index.ts` — bridge `window.photoBooth`.
- `src/shared/constants/ipc.ts` — `IPC_CHANNELS` (contrato canal). **Mantener sincronizado** con preload + api.ts.
- `src/shared/types/{api,entities,...}.ts` — contratos de tipos.
- `src/shared/lib/{fit,sheet,printLayout}.ts` — matemática pura unit-testeada (fit, rejilla, layout de impresión).
- `src/renderer/lib/composition/{composeSession,buildSheet,loadImage}.ts` — composición en canvas.
- `src/renderer/lib/camera/` + `hooks/useCamera.ts` — adaptadores de cámara (Webcam/Mock).
- `src/renderer/screens/*.tsx` — pantallas (ver §5).
- `src/renderer/components/` — UI (`ui/` kit skeuomórfico + `events/templates/print/settings/layout`).
- `src/renderer/styles/tokens.css` — **tokens de diseño** (cero hex sueltos fuera de aquí).
- `release/Install.ps1` + `release/MH Photo Booth Studio-win32-x64/` — instalador por usuario + app empaquetada.

---

## 8. Flujos críticos

1. **Crear evento + plantilla:** `/eventos` → crear evento (tipo, fotos/sesión, copias, QR) →
   seleccionar plantilla de foto (universal); opcional crear **plantilla de impresión** en `/impresion`.
2. **Sesión de fotos (operador):** `/sesion` → "Iniciar sesión" → por cada foto: pose + countdown +
   flash + `camera.capture()` → `sessions.savePhoto` (guarda original al instante) → al terminar
   `sessions.complete` → `composeSession` (canvas + slots + QR + textos) → `sessions.saveComposition`
   (guarda final PNG/JPG + thumbnail) → pantalla de review.
3. **Vista al público (Fase 14):** "Vista al público" o "Modo evento" abre ventana `/publico` en 2º
   monitor. El operador publica estado en vivo (`live:state`); la pública lo refleja. En **modo
   automático** la pública envía comandos (`live:command`: start/print/finalize) que el operador
   ejecuta. Botonera = teclado (Enter/Espacio/P).
4. **Imprimir:** `/impresion` → elegir sesiones + (opcional) plantilla de impresión del evento →
   `computePrintCells` resuelve celdas (grid/custom/full) → `buildSheet` arma la hoja en canvas →
   `print.print` (guarda hoja, registra `print_jobs`, envía al adaptador). **Siempre guarda antes de
   imprimir.**
5. **Reimprimir:** `/historial` → reimprimir genera un nuevo `print_jobs` desde el final guardado.
6. **Exportar/Importar evento:** `BackupService` (.zip con remapeo de ids).
7. **Diagnóstico pre-evento:** `/diagnostico` corre chequeos reales (data root, disco, cámara, impresoras, QR).

---

## 9. Decisiones tomadas

Registro completo en `docs/DECISIONS.md` (DEC-001…DEC-021). Las más críticas para continuar:

- **DEC-014:** migraciones embebidas como strings TS (no archivos .sql sueltos) → cargan dentro del asar.
- **DEC-018 / BUG-008:** renderer de producción se sirve por **`app://`** (no `file://`) para que la
  CSP estricta funcione. No volver a `file://`.
- **DEC-019:** instalador NSIS bloqueado por privilegio de symlink de `winCodeSign` en este entorno.
- **DEC-020:** empaque por **ensamblado directo** desde `node_modules/electron/dist` + **instalador por
  usuario** (`release/Install.ps1`, sin admin). Así se entrega y verifica el producto.
- **DEC-021:** vista al público = cliente de presentación/entrada; **un solo motor de captura** (el
  operador). La pública refleja estado vía IPC y envía comandos en modo automático.

---

## 10. Bugs pendientes

**Ninguno critical/high abierto.** Detalle e histórico en `docs/BUGS_PENDING.md` (live) y `docs/BUGS.md`
(histórico BUG-001…008, todos resueltos). Limitaciones conocidas (no bugs): instalador NSIS por entorno
(DEC-019), cámara dual en vista pública (DEC-021).

---

## 11. Riesgos

- **Empaque firmable:** generar el `.exe` NSIS firmado requiere una máquina con admin/Modo
  desarrollador + red la primera vez. Riesgo para distribución masiva fuera de este entorno.
- **Hardware no confirmado:** modelo exacto de cámara (¿DSLR?) e impresora (¿sublimación?) sin definir.
  Mantener **adaptadores**; no acoplar a un modelo.
- **Cámara simultánea (vista pública):** dos `getUserMedia` del mismo dispositivo puede fallar en
  ciertos drivers → fallback a simulada. Validar con el hardware real del evento.
- **Deuda menor:** algunos docs antiguos de diseño (`TECH_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`,
  `BUGS.md`) coexisten con los docs de transferencia nuevos; los nuevos (`ARCHITECTURE.md`,
  `DATABASE.md`, `BUGS_PENDING.md`) son la **fuente viva**.

---

## 12. Próximos pasos

Detalle priorizado en `docs/NEXT_STEPS.md`. Resumen:
- **Urgente:** ninguno (producto estable). Probar en evento real con hardware definitivo.
- **Importante:** generar instalador NSIS firmado en máquina con admin; validar impresora/sublimación real y tamaños de hoja; probar vista pública en 2 monitores físicos.
- **Después:** vincular "crear plantilla de impresión" al alta de evento; QR por sesión; galería online opcional.
- **Ideas futuras:** IA de poses, subida a nube, filtros, editor avanzado, multi-idioma (todo post-base, ver CLAUDE.md "No hacer en la primera etapa").

---

## 13. Prompts útiles

Ver `docs/PROMPTS.md`. Clave: cómo arrancar una sesión nueva, cómo reconstruir+reinstalar para ver
cambios, y cómo verificar headless con `PBS_SMOKE_*` / `PBS_DATA_ROOT`.

---

## 14. Cosas que NO se deben romper

- **Offline-first:** capturar, componer, guardar, imprimir y reimprimir SIN internet.
- **Guardar SIEMPRE antes de imprimir.**
- **Seguridad Electron:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, IPC
  tipado por `handle()` → `Result<T>`, nav-guard, permisos solo media. Toda ventana nueva (p. ej.
  pública) usa el mismo `webPreferences`.
- **Renderer de producción por `app://`** (no `file://`) — CSP estricta (DEC-018/BUG-008).
- **Cámara e impresora por adaptadores** (mock si falta hardware). No acoplar a un modelo.
- **Rutas relativas al data root**; sin rutas absolutas en código; sin credenciales; **sin PII** en
  código/logs/commits/seeds.
- **Cero hex sueltos:** todo color por tokens de `src/renderer/styles/tokens.css`.
- **Vista invitado sin controles de admin**; modo evento sin pantallas técnicas.
- **Contrato IPC sincronizado:** `ipc.ts` ↔ `preload/index.ts` ↔ `shared/types/api.ts` ↔ handler.
- **Migraciones:** nunca editar una migración aplicada; agregar una nueva versionada.

---

## 15. Última actualización

**2026-07-01 (Fase 19)** — Descargas reales en la página (?download=1 → attachment). FIX raíz del "video no sale en el evento": índice write-once en la web (list() por prefijo, inmune al caché CDN) — verificado MH-YGU7 3/3 medios al instante. Historial del software: fotos + videos en orden cronológico, clic o botón "QR / Folio" abre modal con QR + folio (copiar/abrir página).

**2026-07-01 (Fase 18)** — Vista pública en review SIN imagen final (solo QR centrado + folio, ambos modos; finalUrl eliminado del estado en vivo). FIX videos grandes: subida DIRECTA a Vercel Blob con token de cliente (web /api/blob-token + /api/register-media; dep @vercel/blob en el software) — verificado 9 MB desde Electron (folio MH-UQH4-0002). Superposición dentro del video: lienzo con el formato REAL de la cámara (sin letterbox), imágenes con aspecto natural, y preview en vivo del overlay en Videos.

**2026-07-01 (Fase 17)** — Build mayor: **modo Videos** (grabación con superposición quemada, cámaras USB/Bluetooth/WiFi, importar video), **publicación a la página web** con **folio + QR** por foto/video (cola offline con reintento, migración 004/v4: videos, web_uploads, video_templates + flags en events), **wizard de evento** (fotos y/o videos, plantilla de video, subir-a-web → folio maestro), **QR en vista pública** (esquina inf. izq. en manual; pantalla "¡Escanea tu foto!" + Siguiente + auto-reset 20 s en automático con el nuevo toggle), **plantillas de video** (editor 16:9 logo/texto) y **sección "Página web"** (conexión, folio del evento con QR, publicaciones, detalle admin con originales locales). Navegación condicional por modos del evento. Verificado E2E contra la web en vivo (folio MH-UQH4-0001, qr=true). Gate: 59 tests, build 0; reinstalado.

**2026-06-30 (3)** — Ajuste fino de la **vista al público**: se **quitó el mensaje central** (pose) y
la **guía de encuadre** pasó a ser **exacta e "imaginaria"** — sin borde, solo atenuando lo de afuera;
el tamaño se calcula del recorte real (cámara `contain` + `frameAspect`/`slotAspect`/`stageAspect`), de
modo que la guía coincide pixel-a-pixel con lo que conserva la foto (verificado: guía 356×711 para
cámara 16:9 + slot 0.5). Archivos: `PublicViewScreen.tsx`, `publicview.css`. Gate verde; reinstalado.

**2026-06-30 (2)** — Rediseño de la **vista al público** (Fase 15) y arreglos del **editor de plantilla
de impresión** (Fase 16). Vista pública: contador en esquina superior derecha (aparece/desaparece),
"¡Listo!" grande centrado, **marco dorado alrededor**, **guía de encuadre por foto** (aspecto real del
slot, exterior atenuado), y **fix del modo automático** (estado en vivo cacheado en main y reenviado a
la ventana pública al abrir → indica "Toca para empezar" y el toque inicia). Editor de impresión: sin
"espacio extra" (la tira llena su caja), redimensionado con proporción bloqueada, y **botón Duplicar**
por tira. Archivos: `PublicViewScreen.tsx`/`publicview.css`, `publicWindow.ts`,
`liveDisplay.handlers.ts`, `PrintTemplateEditor.tsx`/`printTemplates.css`. Gate: typecheck 0, lint 0,
54 tests, build 0. Paquete reensamblado + reinstalado; verificado por capturas.

**2026-06-30 (1)** — Documentación de transferencia (creación de `PROJECT_CONTEXT.md` + docs vivos +
`CLAUDE.md`). Sin cambios de código.
