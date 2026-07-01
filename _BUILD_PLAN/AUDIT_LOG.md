# AUDIT_LOG.md — Bitácora de Auditorías por Fase

Agrega una entrada por cada Audit Gate ejecutado, usando la plantilla de
`AUDIT_PROTOCOL.md`. No se avanza de fase con bugs critical/high abiertos.

> (Vacío al inicio. Claude Code agrega aquí el reporte de cada gate, Fase 0 → Fase 10.)

---

## Audit Gate — Fase 0: Fundación & Tooling  (2026-06-28)

### Automático
- typecheck: PASS (node + web)
- lint: PASS (ESLint 9 flat, 0 errores)
- tests: PASS (6 passed, 1 file)
- build: PASS (electron-vite build → out/main, out/preload, out/renderer)

### Criterio de salida
- [x] `npm run dev` configurado; Electron arranca en Windows (smoke boot exit 0).
- [x] typecheck / lint / test pasan.
- [x] `build` de producción genera artefactos ejecutables (out/); instalador completo en Fase 10.
- [x] `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true` verificado en `window.ts`.
- [x] IPC de prueba viaja main→preload→renderer y la versión se ve en UI (`[smoke] footer version = v0.1.0`).

### Anti-huérfanos (contrato 4 preguntas)
- `app.getInfo()` (IPC): causa=montaje del shell (App.tsx useEffect); consumo=footer renderer;
  persiste=N/A (info runtime, no requiere DB); se ve en=footer `v0.1.0` + plataforma/entorno. → OK

### Placeholders muertos
- Búsqueda TODO/FIXME/not-implemented/onClick vacío/alert: NINGUNO en rutas alcanzables.
- (El hook `PBS_SMOKE_EXIT` es infraestructura de verificación env-gated, no UI; no es placeholder.)

### Visual + Accesibilidad
- N/A en Fase 0 (sin design system; el shell es intencionalmente vacío). Llega en Fase 1.

### Reglas duras
- offline: OK (no hay llamadas de red; carga archivos locales).
- save-before-print / adaptadores: N/A en esta fase.
- rutas: OK (sin rutas absolutas; `join(__dirname, ...)`).
- privacidad: OK (solo "Miguel" / "Jardines Club Hípico").
- seguridad Electron: OK (isolation/sandbox/CSP prod/nav-guard/window-open-handler/single-instance).

### Bugs encontrados
- BUG-001 (low, fixed): el binario de Electron no se descargó en `npm install` (cache de
  `@electron/get` no extraía). Resuelto extrayendo el zip cacheado v33.4.11 y fijando `path.txt`.
  Sin impacto en el código de la app.

### Veredicto
- AVANZAR a Fase 1.

---

## Audit Gate — Fase 1: Design System Skeuomórfico & App Shell  (2026-06-28)

### Automático
- typecheck: PASS (node + web)
- lint: PASS (0 errores)
- tests: PASS (6 passed)
- build: PASS (renderer 327 kB JS / 47.5 kB CSS; fuentes woff2/woff empaquetadas localmente)

### Criterio de salida
- [x] Se navega entre las 8 pantallas + galería con el layout skeuo (verificado por screenshot, títulos del topbar correctos).
- [x] ~18 componentes base con estados: Button(+Primary/Danger), Card, Modal, Toast, StatusBadge,
  EmptyState, ErrorState, Input, Select, Toggle, Stepper, Icon, CameraPreview, CountdownDisplay,
  PoseCard, TemplatePreview, PrintPreview, SessionThumbnail.
- [x] Galería de componentes muestra todos los estados (hover/active/disabled, tonos, modal/toast vivos).
- [x] DESIGN_BRAND §9: cero hex sueltos (BUG-002 corregido), fuentes locales, iconos+label, contraste AA.
- [x] Ningún botón muerto: pantallas pendientes usan EmptyState real; quick-links del Dashboard navegan; galería con interacciones reales.

### Anti-huérfanos (contrato 4 preguntas)
- Nav sidebar: causa=clic; consumo=router; persiste=N/A (estado de navegación); se ve=pantalla destino. OK
- Quick-links Dashboard / "Ir a Eventos": causa=clic; consumo=navigate(); se ve=pantalla destino. OK
- Galería (Modal/Toast/Toggle/Select): causa=clic/cambio; consumo=estado UI local; se ve=cambio inmediato en galería (herramienta dev). OK
- Branding/tema: ThemeProvider aplica `data-theme`; NO se expone aún selector de branding (se difiere a Fase 10), así que no hay control huérfano. OK

### Placeholders muertos
- Búsqueda TODO/FIXME/not-implemented/onClick vacío/alert: NINGUNO en rutas alcanzables.
- Pantallas vacías = EmptyState real (entregable explícito de Fase 1), sin datos quemados.

### Visual + Accesibilidad (principios de web-design-guidelines / accessibility-review aplicados)
- tokens: OK (cero hex fuera de tokens.css; única excepción `backgroundColor` de BrowserWindow en main, espejo de --green-900).
- skeuo: paneles de fieltro, botones de latón con press, una sola fuente de luz (sombras arriba-izquierda), máx 2 elevaciones. OK
- estados botón: hover (brillo), active (invierte gradiente + inset + translateY), disabled (mate). OK
- iconos+label: nav, botones, badges; íconos solos (cerrar) con aria-label. OK
- contraste: crema/oro sobre verde e ink sobre oro ≥ AA. OK
- teclado/foco: focus-visible con anillo dorado global; Modal cierra con Escape; roles dialog/alert/status/timer/switch. OK
- reduced-motion: respetado (media query desactiva animaciones).

### Reglas duras
- offline: OK (fuentes locales, sin Google Fonts en runtime; sin red).
- rutas: OK (sin rutas absolutas).
- privacidad: OK.
- seguridad Electron: intacta de Fase 0.

### Bugs encontrados
- BUG-002 (low, fixed): 6 valores hex sueltos en CSS de componentes (gradiente danger, texto de error).
  Resuelto añadiendo tokens `--danger-bright/-deep/-soft/-soft-dim` y reemplazando literales.

### Veredicto
- AVANZAR a Fase 2.

---

## Audit Gate — Fase 2: Capa de datos (SQLite) & Settings  (2026-06-28)

### Automático
- typecheck: PASS (node + web)
- lint: PASS (0 errores; BUG-003 corregido)
- tests: PASS (13 passed — 2 files)
- build: PASS

### Criterio de salida
- [x] DB se crea en el data root (verificado: `pbsdata/database/app.sqlite`).
- [x] Migración idempotente (test: corre 2x → v1; reinicio real re-corre sin error).
- [x] Las 11 tablas existen (test verifica todas).
- [x] Repos con tests unitarios verdes (CRUD, mapeo snake↔camel, settings, seed).
- [x] Settings se leen/escriben y persisten tras reiniciar (verificado live: sound=false, cd=5 sobreviven).
- [x] Data root cambiable; estructura de carpetas creada (6 carpetas + override PBS_DATA_ROOT).
- [x] Pose packs sembrados (7 packs; db.status los reporta).

### Anti-huérfanos (contrato 4 preguntas)
- Sonido on/off: causa=toggle Config; consumo="Probar sonido" ahora + sesión (F5); persiste=settings.sound_enabled; se ve=toggle reabre con su valor + beep. OK
- Countdown por defecto: causa=select Config; consumo=captura (F5); persiste=settings.default_countdown_seconds; se ve=select tras reinicio (=5 verificado). OK
- Pantalla completa: causa=toggle; consumo=ventana setFullScreen inmediato + default evento; persiste=settings.fullscreen_default; se ve=ventana + toggle. OK
- Data root: causa=botón "Cambiar carpeta…"+diálogo; consumo=todas las rutas/DB; persiste=app-config.json; se ve=campo data root + info sistema + carpetas creadas. OK
- Idioma: NO expuesto (DEC-013) — sin control huérfano.

### Placeholders muertos
- Búsqueda TODO/FIXME/not-implemented/onClick vacío/alert: NINGUNO en rutas alcanzables.

### Visual + Accesibilidad
- Configuración: formularios skeuo legibles, toggles con label, Select con label, Toast al guardar. OK
- Estados loading/error (EmptyState/ErrorState con reintento). OK

### Reglas duras
- offline: OK (todo local; sin red).
- save-before-print: N/A.
- rutas relativas: OK (StorageService.toRelative/toAbsolute; rutas relativas al data root; sin absolutas en código).
- privacidad: OK (sin datos personales; seed sin PII).
- seguridad Electron: IPC validado (validateUpdate, setDataRoot valida string); contextIsolation/sandbox intactos.

### Bugs encontrados
- BUG-003 (low, fixed): Vitest no resolvía `node:sqlite` (lo trataba como paquete `sqlite`).
  Resuelto cargándolo con `createRequire` en el helper de test.
- (lint) `import()` type en helper de test → reemplazado por tipo local. fixed.
- Entorno: better-sqlite3 sin prebuild Node 24; flujo install `--ignore-scripts` + `npm run rebuild`.

### Veredicto
- AVANZAR a Fase 3.

---

## Audit Gate — Fase 3: Eventos & Almacenamiento por Evento  (2026-06-28)

### Automático
- typecheck: PASS (node + web)
- lint: PASS
- tests: PASS (17 total; +4 EventService)
- build: PASS (clean `rm -rf out && build` tras corregir BUG-004)

### Criterio de salida
- [x] Crear evento → DB + carpeta `events/event_<id>/{originals,outputs,print_sheets,qr,exports}` + `event.json` (verificado live).
- [x] Aparece como activo en Dashboard + topbar y persiste tras reiniciar (getActive→"XV Demo Jardines" tras reinicio).
- [x] Editar y archivar funcionan (unit tests + UI; archive limpia activo).
- [x] Recientes listados ordenados (updated_at DESC).
- [x] Tests de EventService verdes.

### Anti-huérfanos (contrato 4 preguntas)
- Campos del evento (name/type/date/client/photoCount/copies/qr/qrLink): causa=form;
  consumo=EventService→repos; persiste=tabla events + event.json; se ve=card Eventos + Dashboard + topbar + reread al editar. OK
- templateId: persiste (null por ahora); consumo=F5/F6; se ve=razón "Asigna plantilla" en Dashboard. OK (selector = EmptyState honesto, no control muerto)
- Evento activo (setActive): causa=botón "Usar"; consumo=getActive; persiste=settings.active_event_id; se ve=topbar + Dashboard + "En uso". OK
- Archivar: causa=botón+confirm; consumo=list (filtra status); persiste=events.status='archived'; se ve=desaparece de la lista. OK
- "Iniciar sesión": deshabilitado con razón explícita (sin evento / sin plantilla). OK (no botón muerto)

### Placeholders muertos
- NINGUNO. Selector de plantilla = EmptyState real (las plantillas llegan en Fase 4).

### Visual + Accesibilidad
- Form skeuo con validación inline; Modal con foco/Escape; Toast al guardar; tipo con icono+label;
  estado activo = color+icono+texto (StatusBadge). OK

### Reglas duras
- offline: OK. rutas relativas (events/event_<id>): OK. privacidad (sin PII; datos demo etiquetados): OK.
  seguridad: IPC valida payloads (asEventInput + servicio revalida). OK.

### Bugs encontrados
- BUG-004 (high, fixed): `EventsScreen.tsx` importaba `./events.css` (ruta inexistente en screens/),
  rompiendo SOLO el build de producción (typecheck/lint/test no lo detectan). Corregido a
  `@renderer/components/events/events.css`. Lección: correr `npm run build` aislado en cada gate.

### Veredicto
- AVANZAR a Fase 4.

---

## Audit Gate — Fase 4: Plantillas V1 (Import + Editor de Slots)  (2026-06-28)

### Automático
- typecheck: PASS (node + web)
- lint: PASS
- tests: PASS (22 total; +6 validateTemplate/TemplateService incl. round-trip)
- build: PASS (exit 0 verificado; renderer 381 kB JS / 58 kB CSS)

### Criterio de salida
- [x] Subir PNG, marcar slots 2/3/4 + QR, guardar (editor verificado por screenshot; save escribe template.json + slots).
- [x] Reabrir y persiste con preview (list card con imagen base tras reinicio; editor recarga slots).
- [x] Validación impide guardar incompletas (test: save con <2 fotos rechaza).
- [x] Duplicar y export→import round-trip (test verde con QR).
- [x] fit_mode afecta el preview (object-fit por fitMode en modo Vista previa).

### Anti-huérfanos (contrato 4 preguntas)
- Crear/mover/redimensionar slot: causa=editor; consumo=TemplateService.save; persiste=template_slots + template.json; se ve=editor + preview + (engine F6). OK
- fit_mode: causa=Select propiedades; consumo=preview + engine F6; persiste=template_slots.fit_mode; se ve=Vista previa. OK
- Importar imagen: causa="Nueva plantilla"+diálogo; consumo=createFromImage (dims via image-size); persiste=templates + archivo; se ve=editor + list. OK
- Duplicar/Exportar/Importar: causa=botones; consumo=AdmZip; persiste=archivos reales; se ve=list/zip. OK (round-trip probado)
- Plantilla → evento: causa=Select en EventForm; persiste=events.template_id; consumo=Dashboard ("Iniciar sesión") + engine F6; se ve=razón en Dashboard. OK

### Placeholders muertos
- NINGUNO. Validación bloquea real; selector de plantilla en EventForm ya funcional.

### Visual + Accesibilidad
- Editor skeuo: lienzo en latón sobre fieltro, slots con asas doradas, grid, zoom, props panel.
  Foco en stage (tabIndex) + nudge teclado; labels en inputs; iconos+label. Screenshot OK.

### Reglas duras
- offline: OK (image-size + adm-zip puros JS, sin red). rutas relativas (templates/template_<id>): OK.
  escritura segura (safeWrite). privacidad OK. seguridad: IPC valida ids/payloads.

### Bugs encontrados
- BUG-005 (medium, fixed): createFromImage/duplicate/importTemplate dejaban que el repo generara
  un id distinto al de la carpeta/imagen (carpeta y record desalineados). Corregido pasando `id`
  explícito. Detectado por test.

### Veredicto
- AVANZAR a Fase 5.

---

## Audit Gate — Fase 5: Cámara & Sesión de Captura  (2026-06-28) [fase grande — verificación reforzada]

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (28; +6 SessionService) · build: PASS (exit 0)

### Criterio de salida
- [x] Sesión 2/3/4 fotos (3 verificado live; photoCount del evento respetado; service valida índices).
- [x] Originales guardados al instante en disco + DB (photo_01..03.jpg aparecen durante la captura).
- [x] Repetir foto (upsert, test) / Repetir sesión (discard, test) funcionan.
- [x] Cámara no disponible → preview "sin señal" + "Iniciar" deshabilitado + ErrorState; NO cierra la app.
- [x] 20 capturas estables → 30 capturas vía IPC, 0 fallos, exit 0.

### Anti-huérfanos (contrato 4 preguntas)
- Capturar foto: causa=secuencia/countdown; consumo=engine F6; persiste=archivo originals + session_photos; se ve=review + historial F8. OK
- Pose: causa=antes de cada foto; consumo=invitado; origen=pose pack del event_type (F3); se ve=overlay PoseCard. OK
- Setting sonido (F2): causa=Config; consumo=beep/shutter en captura (respetado); se ve/oye=sesión. OK (loop cerrado)
- Countdown por defecto (F2): consumo=duración del countdown en captura. OK
- Selección de cámara: causa=Config (CameraSettingsCard); persiste=settings camera_*; consumo=sesión; se ve=Config + Diagnóstico (F8). OK

### Placeholders muertos
- NINGUNO. Adaptadores WatchFolder/CaptureCard/DSLR NO expuestos (solo webcam + mock etiquetado). Copias mostradas read-only (su control vive en impresión F7).

### Visual + Accesibilidad
- Setup operador (botones grandes), captura invitado (pose grande, countdown gigante, flash), review con miniaturas.
  Marco de lente skeuo; estados color+icono+texto; sin texto técnico en captura. Verificado por 3 screenshots.

### Reglas duras
- offline: OK (captura/guardado sin red). guardar-antes-de-imprimir: originales guardados al instante. adaptadores+mock: OK.
  seguridad: permiso 'media' concedido solo a contenido local; IPC valida ids/índices/bytes. rutas relativas: OK.

### Segunda pasada (review)
- Secuencia asíncrona usa cancelledRef (sin setState tras desmontar). Preview espejado por CSS; captura en orientación real.
  savePhoto upsert evita duplicados en retake. Sin regresiones en fases previas (28 tests verdes, build OK).

### Bugs encontrados
- BUG-006 (low, fixed): `session.id` vs `session.session.id` en retake (typecheck lo detectó).

### Veredicto
- AVANZAR a Fase 6.

---

## Audit Gate — Fase 6: Template Engine (Composición)  (2026-06-28) [fase grande — verificación reforzada]

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (32; +4 computeDrawRect) · build: PASS (exit 0)

### Criterio de salida
- [x] Cada sesión genera final + miniatura guardadas y registradas (final.png/jpg + thumbnail.jpg + session_outputs + paths). Verificado live.
- [x] Composición correcta: 2 fotos en slots con fit; alineación/recorte razonables (screenshot).
- [x] QR insertado y escaneable cuando aplica (QR real en el resultado); omitido limpio cuando off.
- [x] Resultado guardado en outputs/ ANTES de imprimir (no hay impresión aún; se guarda al componer).
- [x] Tira vertical soportada (template vertical_strip); postal soportada por dims/outputType (motor agnóstico de tamaño).
- [x] SLOT_COUNT_MISMATCH con mensaje + acción (verificado: evento 3 fotos sobre plantilla 2 slots).

### Anti-huérfanos (contrato 4 preguntas)
- Slots (F4) + fotos (F5) → salida real: causa=fin de captura; consumo=impresión F7; persiste=final.png/jpg + session_outputs; se ve=review + historial F8. OK
- Toggle QR + link (F3): causa=config evento; consumo=QRService.ensureForEvent; persiste=qr/event_qr.png + qr_links; se ve=QR en la imagen final (escaneable). OK (loop cerrado)
- fit_mode (F4): consumo=computeDrawRect en composición; se ve=recorte en el resultado. OK
- Texto dinámico: editor crea slot texto (token) → engine lo renderiza → visible en composición. OK (loop cerrado)

### Placeholders muertos
- NINGUNO. Slots logo/decoration no expuestos (editor solo photo/qr/text). Sin sharp/dead native code.

### Visual + Accesibilidad
- "Preparando tu foto…" durante composición; resultado en marco premium; thumbnails + acciones claras. Verificado por screenshots.

### Reglas duras
- offline: OK (qrcode + canvas, sin red). guardar-antes-de-imprimir: final guardado al componer (verificado, incluso en mismatch se guardan originales). rutas relativas: OK. seguridad IPC: bytes/ids validados.

### Segunda pasada (review)
- composeSession usa capturesRef (no estado obsoleto). saveComposition reemplaza outputs previos (re-compose/retake). Fit puro y testeado. Composición determinista sin estado compartido → estable en repeticiones (1 éxito + 1 mismatch verificados; 30 capturas estables previas). Sin regresiones (32 tests, build OK).

### Bugs encontrados
- Ninguno nuevo (capturesRef previsto desde diseño para evitar estado obsoleto).

### Veredicto
- AVANZAR a Fase 7.

---

## Audit Gate — Fase 7: Impresión & Print Sheet Builder  (2026-06-28) [fase grande — verificación reforzada]

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (39; +PrintService +computeSheetCells) · build: PASS (exit 0)

### Criterio de salida
- [x] Imprimir 1/2/N copias (job copies=2 registrado y usado).
- [x] Hoja con varias tiras / sesiones (layout 1–4, multi-selección; computeSheetCells testeado).
- [x] Reimprimir = nuevo print_jobs (unit: 2 jobs por sesión).
- [x] Preview = salida (mismo buildSheet para preview y hoja enviada; verificado por screenshot).
- [x] Fallo NO borra + reintentar (unit: failed conserva sheet; retry → completed).
- [x] Job en print_jobs con copias/método/layout/status (verificado live + unit).

### Anti-huérfanos (CRÍTICO — contrato 4 preguntas)
- Impresora: causa=Select; consumo=adapter windows; persiste=print_jobs.printer_name; se ve=cola. OK
- Método/adapter: causa=Select; consumo=resolveAdapter; persiste=print_jobs.method; se ve=cola + export real. OK
- Copias: causa=Input (default=event.default_copies → loop cerrado); consumo=adapter copies/sheets; persiste=print_jobs.copies; se ve=cola. OK
- Layout multi-tira: causa=Select; consumo=computeSheetCells/buildSheet; persiste=print_jobs.layout; se ve=preview + hoja. OK
- Sesiones en hoja: causa=selección; consumo=buildSheet cells; persiste=print_jobs.sheet_sessions (JSON); se ve=preview. OK
- Imprimir/Reimprimir: causa=botón; consumo=PrintService; persiste=print_jobs.status (sent→completed/failed); se ve=cola + toast + reintento. OK

### Placeholders muertos
- NINGUNO. Sin impresora real, el método 'image' (export PNG) es funcional y por defecto.

### Visual + Accesibilidad
- Botón Imprimir de latón; preview de hoja real; cola con StatusBadge (color+texto) + Reintentar; iconos+label. Screenshots OK.

### Reglas duras
- guardar-antes-de-imprimir: la hoja se guarda en print_sheets/ ANTES del adaptador (verificado). fallo no borra (unit). offline: image/pdf sin red. rutas relativas. IPC validado.

### Segunda pasada (review)
- PrintService.print siempre resuelve a un job (éxito o failed), nunca lanza al renderer. Adaptadores inyectados → testeables. migration_002 idempotente sobre DB v1 existente (live → v2). Sin regresiones (39 tests, build OK).

### Bugs encontrados
- BUG-007 (test, fixed): tests de print usaban event_id inexistente (FK falló) + assert de versión de migración obsoleto (v1→v2). Corregidos.

### Veredicto
- AVANZAR a Fase 8.

---

## Audit Gate — Fase 8: Historial, Diagnóstico & Sistema de Errores  (2026-06-28)

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (39) · build: PASS (exit 0)

### Criterio de salida
- [x] Ver/abrir/reimprimir/exportar/archivar(confirm) sesiones (Historial verificado; reprint → job +1 = 2).
- [x] Persiste tras reiniciar (sesiones/jobs en DB; verificado en fases previas).
- [x] Export diagnóstico genera `.zip` (logs + diagnostics.json; logic = zip probado; gated por diálogo).
- [x] Errores muestran mensaje+acción y se registran (errors.log poblado: `MEDIUM storage/FILE_WRITE_FAILED`).
- [x] Offline total (sin red en toda la app; badge de conectividad no alarmante).

### Anti-huérfanos (contrato 4 preguntas)
- Reimprimir (historial): causa=botón; consumo=PrintService.print; persiste=nuevo print_jobs; se ve=cola (1→2). OK
- Abrir final/originales: causa=botón; consumo=shell.openPath; se ve=visor/Explorer del SO. OK
- Exportar sesión: causa=botón+diálogo; consumo=AdmZip; persiste=.zip; se ve=sistema de archivos. OK
- Archivar: causa=botón+confirm; consumo=list filtra; persiste=sessions.status='archived'; se ve=historial actualizado. OK
- Marcar evento listo: causa=Diagnóstico; consumo=Dashboard; persiste=settings event_ready:<id>; se ve=badge "Listo" (verificado ready=true). OK
- Diagnóstico: causa=run; consumo=tablero; lee disco/printers/camera/counts/errors reales; se ve=board + export. OK
- Conectividad: navigator.onLine; se ve=badge no alarmante. OK

### Placeholders muertos
- NINGUNO. Todas las acciones del historial operan sobre datos reales.

### Visual + Accesibilidad
- Historial tipo galería; Diagnóstico tipo tablero con luces verde/ámbar/rojo + texto + estado (color+icono+texto). ErrorState real. Screenshots OK.

### Reglas duras
- offline: OK. logs sin PII (code/module/message/timestamp; verificado). guardar-antes-de-imprimir intacto. rutas relativas. IPC validado.

### Bugs encontrados
- Ninguno nuevo.

### Veredicto
- AVANZAR a Fase 9.

---

## Audit Gate — Fase 9: Modo Evento Real & Offline Hardening  (2026-06-28) [fase grande — verificación reforzada]

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (39) · build: PASS (exit 0)

### Criterio de salida
- [x] Operador no técnico opera en fullscreen sin pantallas técnicas (Modo Evento sin sidebar; screenshot).
- [x] Vistas operador/invitado correctas; admin NO visible para invitado (event mode = sin sidebar/nav).
- [x] Todo offline; reiniciar a mitad no pierde datos (sim 30 sesiones → tras reinicio: 30 sesiones, 5 jobs; 30 final.png, 60 originales, 5 sheets).
- [x] Config protegida durante evento ("Salir del modo evento" con confirmación; sin escape a admin).
- [x] Flujo corto y estable (30 sesiones compuestas, 0 fallos).

### Simulación 30 sesiones (mock cámara/impresora)
- composed=30, sessions=30, reprints=5, jobs=5; persistencia tras reinicio = 30/5. Cero pérdida.
- Archivos en disco coinciden con DB (30 finales, 60 originales, 5 hojas).

### Anti-huérfanos (contrato 4 preguntas)
- "Modo evento": causa=Dashboard (habilitado si evento+plantilla); consumo=fullscreen + shell sin admin; se ve=/evento. OK
- "Salir del modo evento": causa=botón+confirm; consumo=setFullscreen(false)+navigate('/'); se ve=vuelve a admin. OK
- "Siguiente"/Finalizar/Repetir: encadenan limpio a la siguiente sesión (review→setup). OK
- "Más opciones" oculto en evento (no escape a admin). OK
- Fullscreen: setting fullscreenDefault (F2) + IPC app.setFullscreen (event mode). OK

### Placeholders muertos
- NINGUNO. Modo evento reutiliza SessionScreen real; sin controles inertes.

### Visual + Accesibilidad
- Invitado ceremonial (pose/countdown/flash); operador botones grandes; sin sidebar en evento. reduced-motion respetado (global.css). Screenshot OK.

### Reglas duras
- offline-first: sin llamadas de red en toda la app (verificado por diseño + sim 30 offline). guardar-antes-de-imprimir intacto. mocks (cámara/impresora) etiquetados. rutas relativas.

### Segunda pasada (review)
- Cadena continua evento→plantilla→cámara→engine→impresión→historial sin callejones. Event mode aísla admin. 30-sesiones estable + persistencia. Sin regresiones (39 tests, build OK).

### Bugs encontrados
- Ninguno nuevo. (Dashboard CTA actualizado: ya no bloquea por "cámara" placeholder; habilita con evento+plantilla.)

### Veredicto
- AVANZAR a Fase 10.

---

## Audit Gate — Fase 10: Empaque, Branding & Release 1.0  (2026-06-28) [FINAL — verificación reforzada]

### Automático
- typecheck: PASS · lint: PASS · tests: PASS (40; +BackupService round-trip) · build: PASS (exit 0)

### Criterio de salida
- [x] Branding configurable (Jardines default) reflejado en toda la UI (verificado: cambio de nombre/bienvenida → sidebar+Dashboard+about).
- [x] "Acerca de" con versión **1.0.0** + licencia no bloqueante (verificado por screenshot).
- [x] Export/Import de eventos (round-trip unit test) y plantillas (Fase 4).
- [x] Migraciones al iniciar con backup (backup previo si versión < latest; idempotencia testeada).
- [x] Licencia local NO bloqueante (About la muestra; nunca bloquea).
- [x] App corre sin entorno de desarrollo: bundle portable (Electron+app+node_modules nativos) arranca a v1.0.0 + crea DB (vía runtime Electron sobre su bundle).
- [~] Instalador NSIS/portable .exe: config + icono listos; **build bloqueado por privilegio de symlink (winCodeSign)** en esta cuenta sin admin (DEC-019). Construye normal en Windows con admin/Modo desarrollador.

### TESTING_CHECKLIST (verificado a lo largo de las fases)
- App abre / offline / evento+plantilla+fotos+copias+QR correctos: ✅ (F3-F6, F9)
- Cámara (preview, 2/3/4, retake, desconexión): ✅ (F5)
- Plantillas (import PNG/JPG, slots 2/3/4 + QR, persistencia, validación): ✅ (F4)
- Composición (fit, PNG/JPG, miniatura, QR, 20+): ✅ (F6)
- Impresión (copias, multi-hoja, reimpresión, fallo no borra): ✅ (F7)
- Historial (ver/abrir/reimprimir/exportar/persistencia): ✅ (F8)
- Evento simulado 30 sesiones offline + reinicio sin pérdida + reimpresión: ✅ (F9: 30 compuestas, 30/5 tras reinicio)
- Empaque: build ✅; instalador bloqueado por entorno (DEC-019)

### Anti-huérfanos (contrato 4 preguntas)
- Branding (nombre/venue/bienvenida/logo): causa=Config→Marca; consumo=ThemeProvider; persiste=settings branding_*; se ve=sidebar/Dashboard/EventMode/About. OK
- Logo: causa=pickLogo; persiste=branding/logo.png + settings; se ve=sidebar + About. OK
- Export/Import evento: causa=botones; consumo=BackupService; persiste=.zip / nuevas filas+archivos remapeados; se ve=lista de eventos. OK (round-trip test)
- Licencia: causa=ensureLicense (1er arranque); persiste=settings license_*; se ve=About. No bloquea nunca. OK
- "Acerca de": app.getInfo + license + dataRoot reales. OK

### Placeholders muertos
- NINGUNO. electron-updater (dep no usada) eliminada. Sin TODO/FIXME/onClick vacío en rutas alcanzables.

### Reglas duras
- offline-first: OK (toda la cadena sin red). seguridad Electron: contextIsolation/sandbox/nodeIntegration off + permiso media restringido + **CSP estricta funcional vía app://** (BUG-008 corregido) + nav-guard + single-instance. privacidad: sin PII. rutas relativas.

### Segunda pasada (review/security)
- BUG-008 (critical, fixed): CSP sobre file:// habría dejado el renderer empaquetado en blanco → corregido con protocolo app:// (DEC-018). Es el hallazgo más importante del empaque.
- Sin regresiones (40 tests, build OK). Logs sin secretos/PII. better-sqlite3 unpack configurado para el instalador.

### Bugs encontrados
- BUG-008 (critical, fixed): CSP/file:// → app://. 
- Bloqueo de entorno (DEC-019): winCodeSign symlink privilege impide generar el .exe del instalador aquí.

### Veredicto
- FASE 10 CERRADA. Producto **1.0.0** funcional, auditado y verificado. Único pendiente: generación
  del .exe del instalador, bloqueada por privilegio del entorno (config lista, documentada).
- **/goal cumplido** en lo construible: app 1.0.0 completa, sin funciones huérfanas ni placeholders.

---

## Post-release — Verificación de empaque e instalador (2026-06-29)

### Contexto
Resolución del único pendiente de Fase 10: producir un Electron empaquetado y un instalador
funcionales pese a los bloqueos de entorno (winCodeSign/symlink en electron-builder; streaming-unzip
del sandbox en @electron/packager). Vía adoptada: ensamblado directo + instalador por usuario (DEC-020).

### Resultado
- **App empaquetada**: `release/MH Photo Booth Studio-win32-x64/` (335 MB). El `.exe` renombrado
  arranca standalone → `[smoke] footer version = v1.0.0`, navega a `/eventos`, `events.list()` por
  IPC→SQLite = `{ok:true,data:[]}` (DB operativa). UI skeuomorphic verde/oro renderiza bajo CSP `app://`.
- **Instalador por usuario** (sin admin): `Install.ps1` instala en `%LOCALAPPDATA%\Programs`, crea
  accesos directos (Menú Inicio + Escritorio) y entrada de desinstalación en `HKCU`. Verificado:
  exe/lnk/lnk/reg = True; tamaño instalado 324 MB.
- **App instalada** arranca en `environment: production` (Electron 33.4.11, Chrome 130); Diagnóstico
  detecta hardware real (2 impresoras, 18.5 GB libres, ruta de almacenamiento) — todos los checks OK.
- **Distribuible**: `release/MH-Photo-Booth-Studio-1.0.0-win-x64-Installer.zip` (~130 MB, 5039 archivos)
  con `Instalar.bat` + scripts + `LEEME-INSTALACION.txt` + la app.

### Gate automático
- typecheck PASS · lint PASS · 40 tests PASS · build exit 0 (sin cambios en `src/`; solo empaque y docs).

### Veredicto
- Criterio "1.0.0 instalable en Windows" **CUMPLIDO Y VERIFICADO** por instalador por usuario + portable.
- Instalador NSIS clásico (asistente) sigue disponible vía `npm run package` con admin/red (DEC-019).

---

## Mejoras post-1.0 — Fases 11–14 (2026-06-29)

### Alcance
Borrar plantilla (11), impresión compacta (12), plantillas de impresión por evento (13), vista al
público + modo automático (14). Pedido del owner; auditado en cada paso.

### Gate automático (final)
- typecheck PASS · lint PASS · **54 tests PASS** (11 archivos; +14 casos: borrado, rejilla, layout, print-templates) · build exit 0.

### Verificación funcional (capturas, smoke harness)
- **Borrar plantilla:** botón "Borrar" + modal de confirmación visible en la tarjeta de plantilla.
- **Impresión 8-up:** `computeStripGrid` empaca 8 = 4×2 (tests) + comparación visual antes/ahora.
- **Plantillas de impresión:** tarjeta gestor (crear/seleccionar/borrar) + editor (auto/manual/hoja
  completa) renderizan; POS-58 detectada.
- **Vista al público:** `/publico` renderiza reflejo de cámara en vivo + venue + hint; `.pb-public`
  presente en la app **instalada** (confirma código nuevo empaquetado).
- **Sesión:** botones "Vista al público" + toggle "Modo automático" debajo de "Iniciar sesión",
  sin alterar el flujo existente.
- Verificación en data root aislado (`PBS_DATA_ROOT`) para no tocar los datos reales del owner.

### Reglas duras
- offline-first intacto; seguridad Electron mantenida en la ventana pública (contextIsolation/sandbox,
  sin nodeIntegration; nav-guard); rutas relativas; sin PII; cero hex sueltos (tokens en el CSS nuevo).
- Anti-huérfanos: cada control nuevo tiene causa→consecuencia registrada (IPC tipado + DB o broadcast).

### Empaque
- Paquete reensamblado desde build fresco y **reinstalado** (instalador por usuario). La app instalada
  arranca con todo el código nuevo (verificado). Distribuible ZIP regenerado.

### Veredicto
- **Fases 11–14 CERRADAS Y VERIFICADAS.** Sin pendientes, sin errores en el gate. Producto funcional.
