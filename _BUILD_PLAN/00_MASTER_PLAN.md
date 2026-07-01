# 00_MASTER_PLAN.md — Plan Madre por Fases (MH Photo Booth Studio)

Este es el plan maestro. Define **todas las fases en orden**, su **objetivo**, **qué
hace**, **qué entrega**, **cómo debe terminar (criterio de salida)** y el **gate de
auditoría** que separa una fase de la siguiente.

- Construye **una fase a la vez, en orden estricto**.
- **No avanzas a la fase N+1** hasta que la fase N cumpla su criterio de salida y pase
  su Audit Gate (ver `AUDIT_PROTOCOL.md`) con **cero bugs critical/high**.
- Cada fase tiene su archivo detallado `PHASE_0X_*.md`: léelo al iniciar la fase.
- Alineado con `docs/ROADMAP.md` y `docs/TASKS.md`, pero más granular y auditable.

Leyenda: cada fase entrega un **slice vertical usable y probado**. Nada de módulos a
medias que no se puedan ejecutar.

---

## Mapa de fases

| # | Fase | Entrega un… |
|---|------|-------------|
| 0 | Fundación & Tooling | Shell Electron que arranca en Windows |
| 1 | Design System Skeuomórfico & App Shell | Navegación + librería de componentes Jardines |
| 2 | Capa de datos (SQLite) & Settings | DB con migraciones + configuración persistente |
| 3 | Eventos & Almacenamiento por evento | CRUD de eventos + carpeta por evento + evento activo |
| 4 | Plantillas V1 (import + editor de slots) | Crear plantilla real con slots y preview |
| 5 | Cámara & Sesión de captura | Sesión completa 2/3/4 fotos con originales guardados |
| 6 | Template Engine (composición) | Imagen final + miniatura por sesión, guardada |
| 7 | Impresión & Print Sheet Builder | Imprimir/reimprimir con copias y multi-tira |
| 8 | Historial, Diagnóstico & Errores | Historial + diagnóstico + sistema de errores |
| 9 | Modo Evento real & Offline hardening | Operación fullscreen operador/invitado, 30 sesiones |
| 10 | Empaque, Branding & Release 1.0 | Instalador/portable Windows, marca configurable |

> Fase 11+ (avanzado: galería online, QR por sesión, nube, IA poses, DSLR SDK) queda
> **fuera del /goal**; documéntala como backlog, no la construyas ahora.

---

## FASE 0 — Fundación & Tooling
**Objetivo:** base técnica que arranca en Windows, lista para crecer modularmente.
**Qué hace:** scaffold Electron + React + TS (Vite), estructura de carpetas de
`docs/TECH_ARCHITECTURE.md`, preload seguro + puente IPC tipado vacío, lint + typecheck
+ test runner, scripts dev/build, ventana que abre a un shell vacío.
**Entregables:** repo inicializado, `package.json` con scripts, config TS/lint/test,
`src/{main,preload,renderer,shared}`, IPC bridge base, app que abre ventana.
**Criterio de salida:** `npm run dev` abre la app en Windows; typecheck/lint/test pasan;
build de producción genera ejecutable de prueba; sin Node expuesto al renderer.
**Audit Gate 0:** build + typecheck + lint verdes; seguridad Electron (contextIsolation
on, nodeIntegration off) verificada.

---

## FASE 1 — Design System Skeuomórfico & App Shell
**Objetivo:** identidad visual Jardines y navegación, antes de lógica de negocio.
**Qué hace:** tokens de tema (`DESIGN_BRAND.md`), ThemeProvider (branding configurable,
Jardines por defecto), fuentes locales, librería de componentes base de
`docs/DESIGN_SYSTEM.md` (Button/Primary/Danger, Card, Modal, Toast, StatusBadge,
Stepper, Toggle, Input, Select, EmptyState, ErrorState, etc.), layout con sidebar y
las pantallas vacías navegables (Dashboard, Eventos, Plantillas, Sesión, Historial,
Impresión, Configuración, Diagnóstico), una **galería de componentes** interna.
**Entregables:** sistema de tokens, ~18 componentes skeuo con estados, navegación real
entre las 8 pantallas, Dashboard maquetado (con datos placeholder claramente marcados
como vacíos vía EmptyState — NO botones muertos).
**Criterio de salida:** se navega entre todas las pantallas; los componentes existen y
responden (hover/active/disabled); todo cumple el checklist de `DESIGN_BRAND.md §9`;
accesibilidad AA básica.
**Audit Gate 1:** conformidad visual + accesibilidad (skill `web-design-guidelines`,
`design:accessibility-review`); cero hex sueltos; cero placeholders interactivos sin estado.

---

## FASE 2 — Capa de datos (SQLite) & Settings
**Objetivo:** persistencia local sólida y configuración global.
**Qué hace:** integrar SQLite (better-sqlite3), migraciones versionadas
(`001_initial_schema`), TODAS las tablas de `docs/DATABASE_SCHEMA.md`, capa de
repositorios tipados, `StorageService` (data root configurable + estructura de
`docs/FILE_STORAGE.md` + escritura segura temp→verify→rename), `SettingsService` con
IPC, seed de `pose_packs`/`poses` por defecto (`docs/POSE_SYSTEM.md`).
**Entregables:** DB creada en data root, migraciones idempotentes, repos con tests
unitarios, pantalla Configuración funcional (data root, idioma, fullscreen, sonido),
settings que persisten al reabrir.
**Criterio de salida:** crear DB, correr migraciones dos veces sin romper, leer/escribir
settings que persisten tras reinicio; data root cambiable.
**Audit Gate 2:** tests de repos verdes; migración idempotente verificada; rutas relativas.

---

## FASE 3 — Eventos & Almacenamiento por evento
**Objetivo:** crear y administrar eventos reales.
**Qué hace:** `EventService` (crear/editar/archivar/seleccionar activo/recientes),
creación de carpeta `events/event_<id>/` con subcarpetas, configuración por evento
(nombre, tipo, fecha, conteo de fotos, copias por defecto, toggle+link QR, plantilla
asignada), pantalla Eventos (lista + form skeuo) y card de "evento activo" en Dashboard.
**Entregables:** flujo `docs/UI_FLOWS.md §crear evento` completo; evento persistente;
selector de evento activo siempre visible.
**Criterio de salida:** crear evento → se guarda en DB + se crea su carpeta → aparece
como activo en Dashboard → persiste tras reinicio; editar y archivar funcionan.
**Audit Gate 3:** anti-huérfano (cada campo del form se guarda y se relee y se muestra);
carpeta creada coincide con DB; tests de EventService.

---

## FASE 4 — Plantillas V1 (import + editor de slots)
**Objetivo:** plantillas personalizadas con slots configurables sobre PNG/JPG.
**Qué hace:** `TemplateService`, importar imagen base, tablas `templates`/
`template_slots`, **editor skeuo de slots** (crear/mover/redimensionar/eliminar/duplicar
slots de foto y QR; fit cover/contain/stretch; grid/zoom; nudge por teclado; medidas),
guardar `template.json` (`docs/TEMPLATE_ENGINE.md`), validación
(`docs/TEMPLATE_EDITOR.md §Validaciones`), preview con fotos demo, duplicar/exportar/
importar `.zip`.
**Entregables:** editor funcional; plantilla guardada que persiste; preview real;
validación que impide plantillas incompletas.
**Criterio de salida:** subir un PNG real, marcar slots de 2/3/4 fotos + QR, guardar,
reabrir app y la plantilla sigue ahí con preview correcto.
**Audit Gate 4:** validaciones probadas (no se guarda plantilla inválida); export→import
round-trip; anti-huérfano (slots guardados se usan en preview y luego en Fase 6).

---

## FASE 5 — Cámara & Sesión de captura
**Objetivo:** flujo de captura robusto y agnóstico de hardware.
**Qué hace:** `CameraService` + interfaz de adaptador; `WebcamAdapter` (USB/getUserMedia)
como primero, `WatchFolderAdapter` y stubs de `CaptureCard`/`DSLR` con interfaz lista
(`docs/CAMERA_CAPTURE.md`); listar/seleccionar/probar cámara; preview en vivo; countdown
configurable; poses por evento; capturar 2/3/4; **guardar cada original de inmediato**;
repetir foto/sesión; registrar `sessions` + `session_photos`; hooks de sonido (beep/
shutter, desactivables); manejo de errores de cámara con acción.
**Entregables:** sesión completa sin impresión; originales en disco + DB; retake; errores
(`CAMERA_NOT_FOUND`/`BUSY`/`CAPTURE_FAILED`) con mensaje+acción, sin cerrar la app.
**Criterio de salida:** completar sesiones de 2, 3 y 4 fotos; originales guardados al
instante; repetir foto/sesión; desconectar cámara no rompe la app.
**Audit Gate 5:** 20 capturas seguidas estables; anti-huérfano (cada foto guardada se
referencia en DB y alimenta la Fase 6); errores verificados con cámara desconectada/mock.

---

## FASE 6 — Template Engine (composición)
**Objetivo:** generar la imagen final profesional por sesión.
**Qué hace:** `TemplateEngine` (canvas/sharp) con pipeline de `docs/TEMPLATE_ENGINE.md`
(cargar base+JSON+fotos, fit cover/contain/stretch, fondo, slots por zIndex), `QRService`
(validar link, generar, guardar por evento, insertar solo si evento QR-on + slot QR +
link válido), textos dinámicos básicos (nombre/fecha del evento), export PNG/JPG alta
calidad, miniatura, `session_outputs`, escritura segura, **guardar antes de cualquier
impresión**.
**Entregables:** cada sesión → imagen final + miniatura guardadas + registradas; QR
legible cuando aplica; tira vertical y formato postal.
**Criterio de salida:** 20 composiciones seguidas correctas; recortes razonables; QR
escaneable; resultado guardado en `outputs/` antes de imprimir; miniatura para historial.
**Audit Gate 6:** calidad de salida verificada (resolución, alineación); anti-huérfano
(toggle/slot QR de fases previas realmente se reflejan en la imagen); sin pérdida de calidad.

---

## FASE 7 — Impresión & Print Sheet Builder
**Objetivo:** imprimir de forma controlada, con copias, multi-tira y reimpresión.
**Qué hace:** `PrintService` + adaptadores (`WindowsPrintAdapter`, `PdfExportAdapter`,
`ImageExportAdapter` — `docs/HARDWARE.md`); listar/seleccionar/probar impresora; tamaño
papel/orientación/márgenes/calidad/copias; `PrintSheetBuilder` (1–4 tiras/hoja, varias
copias de una sesión, varias sesiones en una hoja, separación/márgenes, preview);
preview de impresión; crear `print_jobs` (impresora, método/adapter, copies, layout,
status, error); reintento; modo lote vs inmediato; **guardar siempre antes de imprimir**.
**Entregables:** flujo `docs/PRINT_PIPELINE.md` completo; reimpresión generando nuevo
job; estados de cola; ahorro de papel.
**Criterio de salida:** imprimir 1/2/N copias; hoja multi-tira; reimprimir desde una
sesión; un fallo de impresora NO borra archivos; cada trabajo queda en `print_jobs` con
sus opciones (copias, método, layout, status).
**Audit Gate 7:** anti-huérfano CRÍTICO (toda opción elegida —copias, impresora, layout,
método— se registra en `print_jobs` y es visible/reusable); fallo de impresión probado
con mock; preview coincide con salida.

---

## FASE 8 — Historial, Diagnóstico & Sistema de Errores
**Objetivo:** trazabilidad, soporte y robustez operativa.
**Qué hace:** pantalla Historial (sesiones por evento, miniaturas, abrir final/originales,
reimprimir, exportar sesión `.zip`, borrar con confirmación/archivar — `docs/UI_FLOWS.md`);
`DiagnosticsService` (estado cámara/impresora/almacenamiento/disco/rutas/logs, export
`diagnostics_<date>.zip`); **sistema unificado de errores** de `docs/ERROR_HANDLING.md`
(error con code/userMessage/action/severity/module/logs app/errors/print/camera); flujo
de diagnóstico pre-evento + "marcar evento listo".
**Entregables:** historial completo + reimpresión desde ahí; diagnóstico exportable;
errores con mensaje+acción en toda la app; logs por módulo.
**Criterio de salida:** ver/reabrir/reimprimir/exportar sesiones; reiniciar app y todo
persiste; export de diagnóstico; errores amigables en cámara/plantilla/impresión/archivos.
**Audit Gate 8:** errores de `ERROR_HANDLING.md` verificados (forzados con mocks); offline
total verificado (sin falsos errores de red); anti-huérfano (cada acción de historial usa datos reales).

---

## FASE 9 — Modo Evento real & Offline hardening
**Objetivo:** dejar la app lista para operar en evento por personal no técnico.
**Qué hace:** modo fullscreen; **vista operador** (botones grandes, estados visibles) vs
**vista invitado** (countdown gigante, pose, flash, sonidos, sin admin); configuración
protegida/bloqueada durante evento; badge de conectividad no alarmante
(`docs/OFFLINE_MODE.md`); pulido de microinteracciones; **simulación de 30 sesiones**
end-to-end offline (`docs/TESTING_CHECKLIST.md §evento simulado`).
**Entregables:** experiencia de evento completa operador+invitado; bloqueo de admin;
flujo corto y a prueba de estrés.
**Criterio de salida:** un operador no técnico completa 30 sesiones seguidas en fullscreen
sin ver pantallas técnicas; todo offline; sin pérdida de datos al reiniciar a mitad.
**Audit Gate 9:** simulación 30 sesiones (con cámara/impresora mock) sin fallos críticos;
offline checklist verde; UX operador/invitado revisada (skills `impeccable`/`emil-design-eng`).

---

## FASE 10 — Empaque, Branding & Release 1.0
**Objetivo:** software distribuible e instalable.
**Qué hace:** `electron-builder` → instalador Windows + portable; pantalla "Acerca de"
(nombre/versión/build/fecha/ambiente/ruta de datos); **branding configurable** (tema
Jardines por defecto + logo/nombre/bienvenida); export/import de eventos y plantillas;
licencia local básica **no bloqueante** (`docs/SECURITY_AND_LICENSE.md`); migraciones al
iniciar con backup; docs de usuario (quick start); build checklist
(`docs/RELEASE_PACKAGING.md`); versión `1.0.0`.
**Entregables:** instalador + portable probados en Windows limpia; branding editable;
import/export; release notes + changelog.
**Criterio de salida:** instalar en una Windows limpia y operar sin entorno de desarrollo;
rutas de datos correctas; imprimir y trabajar offline; cumplir **Criterios para 1.0.0**.
**Audit Gate 10 (final):** build checklist completo; instalación limpia verificada;
`TESTING_CHECKLIST.md` aprobado; release `1.0.0` registrado en CHANGELOG y AUDIT_LOG.
**→ Aquí termina el /goal.**

---

## Regla entre fases (recordatorio)

Terminar fase → correr **Audit Gate** → corregir critical/high → actualizar CHANGELOG/
TASKS/DECISIONS/BUGS/AUDIT_LOG → **solo entonces** iniciar la siguiente. Ver `AUDIT_PROTOCOL.md`.
