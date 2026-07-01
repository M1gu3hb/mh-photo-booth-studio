# TASKS.md — Tareas del Proyecto

## Estado inicial

Proyecto en fase de planeación. No asumir que ya existe código.

---

## Tareas inmediatas

### Fase 0 — Preparación

- [x] Crear repositorio.
- [x] Copiar `CLAUDE.md`.
- [x] Copiar carpeta `docs/`.
- [x] Confirmar stack final (DEC-011).
- [x] Confirmar estructura inicial del proyecto.
- [x] Crear app base Electron + React + TypeScript.
- [x] Configurar lint/typecheck/test (ESLint 9, tsc, Vitest).
- [x] Definir comando de desarrollo (`npm run dev`).
- [x] Definir comando de build (`npm run build`, `npm run package`).

---

## Fase 1 — App shell

- [x] Crear layout base (AppShell: sidebar + topbar + content).
- [x] Crear navegación principal (router + 8 pantallas + galería).
- [x] Crear dashboard (welcome + flujo + accesos rápidos navegables).
- [x] Crear pantalla de eventos (placeholder con EmptyState real).
- [x] Crear pantalla de plantillas (placeholder con EmptyState real).
- [x] Crear pantalla de sesión (placeholder con EmptyState real).
- [x] Crear pantalla de historial (placeholder con EmptyState real).
- [x] Crear pantalla de configuración (placeholder con EmptyState real).
- [x] Crear tema visual inicial (tokens Esmeralda & Oro + fuentes locales).
- [x] Crear componentes base (18+ componentes skeuo con estados).

---

## Fase 2 — Capa de datos & Settings

- [x] Configurar SQLite (better-sqlite3 + interfaz `Db`).
- [x] Crear servicio de base local (connection, migraciones, repos).
- [x] Crear las 11 tablas vía migración 001.
- [x] Crear modelos/tipos de entidades (shared/types/entities).
- [x] Repos tipados con CRUD genérico + tests.
- [x] StorageService (data root + estructura + escritura segura).
- [x] SettingsService + IPC + pantalla Configuración funcional.
- [x] Seed de pose packs/poses.

> Nota: el CRUD de eventos (crear/editar/seleccionar activo/carpeta por evento) se completó
> en la Fase 3 del MASTER_PLAN (EventService + pantalla Eventos + evento activo). ✅

---

## Fase 3 (MASTER_PLAN Fase 4) — Plantillas V1

- [x] Importar PNG/JPG.
- [x] Crear tabla `templates` (Fase 2) + uso real.
- [x] Crear tabla `template_slots` (Fase 2) + uso real.
- [x] Crear editor de slots (mover/redimensionar/zoom/grid/teclado).
- [x] Permitir slot de foto.
- [x] Permitir slot de QR.
- [x] Guardar `template.json`.
- [x] Validar que existan slots suficientes (≥2 fotos).
- [x] Crear preview de plantilla (en editor con demo + fit modes).
- [x] Duplicar plantilla (+ exportar/importar .zip).

---

## Fase 4 (MASTER_PLAN Fase 5) — Cámara

- [x] Crear `CameraService` (adaptadores renderer + SessionService main).
- [x] Listar cámaras disponibles (enumerateDevices + mock).
- [x] Seleccionar cámara (persistente en settings).
- [x] Mostrar preview (CameraPreview con lente).
- [x] Crear countdown (configurable, gigante).
- [x] Capturar imagen (canvas → JPEG).
- [x] Guardar original (al instante, disco + DB).
- [x] Manejar errores de cámara (sin cerrar la app).
- [x] Repetir foto (upsert) / repetir sesión (discard).
- [x] Completar sesiones de 2/3/4 fotos.

---

## Fase 5 (MASTER_PLAN Fase 6) — Composición

- [x] Crear `TemplateEngine` (composeSession en canvas).
- [x] Cargar plantilla + slots.
- [x] Insertar fotos.
- [x] Aplicar modo cover/contain/stretch (computeDrawRect).
- [x] Insertar QR opcional (QRService + slot QR + link válido).
- [x] Insertar textos dinámicos (slots de texto).
- [x] Exportar PNG y JPG.
- [x] Generar miniatura.
- [x] Guardar resultado final (antes de imprimir) + session_outputs.

---

## Fase 6 (MASTER_PLAN Fase 7) — Impresión

- [x] Crear `PrintService` + adaptadores (image/pdf/windows).
- [x] Listar impresoras disponibles (getPrintersAsync).
- [x] Seleccionar/probar impresora.
- [x] Configurar tamaño de papel / orientación.
- [x] Crear preview de impresión (hoja real).
- [x] Imprimir imagen final (guardar antes de imprimir).
- [x] Seleccionar número de copias.
- [x] Crear `PrintSheetBuilder` (computeSheetCells).
- [x] Acomodar varias tiras / sesiones en una hoja.
- [x] Reimprimir (nuevo print_jobs).
- [x] Registrar `print_jobs` con todas las opciones + estados + reintento.

---

## Fase 7 (MASTER_PLAN Fase 9) — Modo evento real

- [x] Modo pantalla completa (app.setFullscreen + /evento).
- [x] Vista para invitados (pose/countdown/flash, sin admin).
- [x] Vista para operador (botones grandes, estados).
- [x] Sonidos de countdown / shutter (respetan setting).
- [x] Flash visual.
- [x] Botones grandes.
- [x] Mensajes amigables (errores con acción).
- [x] Diagnóstico pre-evento (Fase 8) + marcar listo.
- [x] Modo bloqueo/configuración protegida (salida con confirmación).

---

## Fase 8 (MASTER_PLAN Fase 10) — Producto / Release 1.0

- [x] Empaquetar app (ensamblado directo desde runtime Electron; `.exe` empaquetado verificado a 1.0.0 con DB — DEC-020).
- [x] Crear instalador Windows (instalador por usuario sin admin: `Install.ps1`/`Instalar.bat` + accesos directos + desinstalador `HKCU`, verificado — DEC-020). NSIS clásico vía `npm run package` en máquina con admin/red (DEC-019).
- [x] Versión portable (carpeta + ZIP `MH-Photo-Booth-Studio-1.0.0-win-x64-Installer.zip`; el `.exe` arranca standalone).
- [x] Exportar/importar eventos (BackupService, round-trip test).
- [x] Exportar/importar plantillas (Fase 4).
- [x] Versión visible ("Acerca de", v1.0.0).
- [x] Logs exportables (diagnóstico .zip).
- [x] Documentar instalación (docs/USER_GUIDE.md).
- [x] Licencia local básica no bloqueante.

---

## Mejoras post-1.0

### Fase 11 — Borrar plantilla
- [x] `TemplateService.delete` + IPC `templates:delete` + `StorageService.removeDir`.
- [x] Botón "Borrar" con confirmación en TemplatesScreen (no borra nada automáticamente).
- [x] Limpia referencia en eventos y avisa; conserva fotos/resultados pasados. Tests añadidos.

### Fase 12 — Impresión compacta (sin desperdicio de hoja)
- [x] `computeStripGrid` empaca en rejilla rows×cols que llena la hoja (8 = 4×2) según aspecto. Tests añadidos.
- [x] `buildSheet` deriva el aspecto y usa la rejilla; márgenes/gaps reducidos.
- [x] `SHEET_LAYOUTS` ampliado a 12 por hoja.

### Fase 13 — Plantillas de impresión por evento
- [x] Entidad `print_templates` (+ slots normalizados) por evento, migración 003 con cascada.
- [x] `PrintTemplateService` + `computePrintCells` (grid/custom/full) + IPC/preload/tipos. Tests añadidos.
- [x] UI: gestor de plantillas de impresión en la sección Impresión (crear/seleccionar/borrar por evento).
- [x] Editor de acomodo (formato de hoja + colocar tiras / auto-acomodo / hoja completa) + vista previa.
- [x] Integrar la plantilla seleccionada en `buildSheet` (cells desde `computePrintCells`) + opción "hoja completa".

### Fase 14 — Vista al público (2º monitor) + modo automático
- [x] Ventana pública (`/publico`) en 2º monitor, fullscreen, sin admin; refleja cámara + estado en vivo.
- [x] Botones "Vista al público" + toggle "Modo automático" en Sesión, sin alterar el flujo del operador.
- [x] "Modo evento" abre la ventana pública; canal IPC `live:*` + `display:*`.
- [x] Automático ON: público inicia/imprime (toque o botonera por teclado). OFF: espejo del operador.
- [x] Verificado por capturas (pública, sesión, plantillas, impresión) + reinstalación del paquete.

---

## Backlog avanzado

- [ ] QR por sesión.
- [ ] Galería online.
- [ ] Subida automática a Drive/nube.
- [ ] Editor avanzado de capas.
- [ ] IA para poses.
- [ ] Filtros.
- [ ] Integración DSLR específica.
- [ ] Pantalla secundaria avanzada.
- [ ] Branding multi-cliente.
- [ ] Modo multi-idioma.
