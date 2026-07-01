# FILE_MAP.md

> Mapa **vivo** de archivos/carpetas clave. Formato: ruta — propósito · qué contiene · riesgo al
> modificar. (~152 archivos en `src/`; aquí los relevantes para continuar.)

## Raíz / configuración
- `package.json` — v1.0.0, scripts (`dev/build/typecheck/lint/test/package/rebuild`), deps, config
  `build` de electron-builder. **Riesgo:** no agregar `"type":"module"` (rompe main/preload CJS).
- `electron.vite.config.ts` — build de main/preload/renderer. **Riesgo:** alias `@renderer`/`@shared`/`@main`.
- `tsconfig*.json`, `eslint.config.mjs` (flat), `vitest.config.ts` — toolchain.
- `CLAUDE.md`, `PROJECT_CONTEXT.md` — entrada obligatoria de cada sesión.
- `release/` — `Install.ps1`/`Uninstall.ps1`/`Instalar.bat`/`LEEME-INSTALACION.txt` + app empaquetada
  + ZIP. **Riesgo:** `Install.ps1` instala en `%LOCALAPPDATA%\Programs` (per-user, sin admin).
- `_BUILD_PLAN/` — plan de construcción + `AUDIT_LOG.md` (bitácora de auditorías por fase).

## MAIN — `src/main/`
- `index.ts` — ciclo de vida + smoke hook (`PBS_SMOKE_*`) + single-instance. **No romper** orden de boot.
- `bootstrap.ts` — arma servicios + contexto + migraciones con backup. Riesgo alto: punto único de wiring.
- `context.ts` — `AppContext`. Al agregar un servicio, registrarlo aquí + en bootstrap.
- `window.ts` — ventana principal (webPreferences seguro). 
- `publicWindow.ts` — ventana pública 2º monitor + `broadcastLive`. **No bajar** la seguridad del webPreferences.
- `appProtocol.ts` — `app://` + CSP. **No volver a `file://`** (BUG-008).
- `security.ts` — permisos (solo media) + nav-guard. **No abrir** navegación a orígenes externos.
- `services/storage/StorageService.ts` — data root, `safeWrite` (temp→verify→rename), `removeDir`. Rutas relativas.
- `services/storage/appConfig.ts` — resuelve data root (override `PBS_DATA_ROOT`, default Documents/PhotoBoothData).
- `services/database/{betterSqlite,types,migrate}.ts` + `migrations/` + `BaseRepository.ts` + `repositories/` — capa DB.
- `services/events/EventService.ts` — CRUD eventos, evento activo (`active_event_id`), carpeta por evento.
- `services/templates/TemplateService.ts` — import/save/duplicate/export/import/**delete** plantillas de foto.
- `services/printTemplates/PrintTemplateService.ts` — CRUD plantillas de impresión por evento (Fase 13).
- `services/sessions/SessionService.ts` — start/savePhoto/complete/saveComposition/discard/listForEvent/getFinal/getThumbnail.
- `services/print/{PrintService,adapters}.ts` — imprimir, listar impresoras, reintentar, jobs; adaptadores.
- `services/qr/QRService.ts` — QR por evento. `services/diagnostics/DiagnosticsService.ts` — chequeos.
- `services/backup/BackupService.ts` — export/import evento (.zip, remapeo de ids).
- `services/logging/logger.ts` — log sin PII.
- `ipc/handle.ts` — wrapper `Result<T>`. `ipc/index.ts` — registra todos. `ipc/*.handlers.ts` — por área.
  **Riesgo:** mantener sincronía ipc.ts ↔ handler ↔ preload ↔ api.ts.

## PRELOAD — `src/preload/index.ts`
- Bridge `window.photoBooth` (`PhotoBoothApi`). **No exponer** Node/ipcRenderer crudo. `live.onState/onCommand`
  devuelven función de desuscripción.

## SHARED — `src/shared/`
- `constants/ipc.ts` — `IPC_CHANNELS` (18 áreas). Contrato canal.
- `constants/{branding,event,eventTypes,print,settings}.ts` — defaults (Jardines, PAPER_SIZES, SHEET_LAYOUTS[1..12], etc.).
- `types/*.ts` — contratos. `entities.ts` = filas DB; `api.ts` = superficie IPC; `live.ts` = estado/comandos vista pública.
- `errors/appError.ts` — `AppError`/`toAppError`.
- `lib/fit.ts` — `computeDrawRect` (cover/contain/stretch). `lib/sheet.ts` — `computeSheetCells`,
  `computeStripGrid` (rejilla compacta 8=4×2). `lib/printLayout.ts` — `computePrintCells` (grid/custom/full).
  **Puras y unit-testeadas — no meter side effects.**

## RENDERER — `src/renderer/`
- `App.tsx` — Theme→Toast→Events→Router. `routes/router.tsx` — rutas (incl. `/evento`, `/publico` fuera del shell).
- `screens/` — `Dashboard`, `Events`, `Templates`, `Session`, `History`, `Print`, `Settings`,
  `Diagnostics`, `Gallery`, `EventMode`, `PublicView`, `Placeholder`. (co-located `*.css`).
- `components/ui/` — kit skeuomórfico (button/controls/domain/feedback/surface + `Icon.tsx`).
- `components/templates/TemplateEditor.tsx` — editor de slots de plantilla de foto.
- `components/print/PrintTemplateEditor.tsx` (+ `printTemplates.css`) — editor de plantilla de impresión (Fase 13).
- `components/{events,settings,layout}/` — dominio + AppShell/Sidebar/Topbar.
- `hooks/useCamera.ts` + `lib/camera/` — adaptadores cámara (Webcam/Mock).
- `lib/composition/{composeSession,buildSheet,loadImage}.ts` — composición canvas (tira + hoja).
- `state/EventsProvider.tsx` — evento activo. `theme/ThemeProvider.tsx` — branding.
- `styles/tokens.css` — **tokens de diseño** (único lugar con hex; cero hex sueltos fuera de aquí).

## TESTS — `test/`
- `helpers/nodeSqlite.ts` — adaptador `Db` con `node:sqlite` (createRequire). 
- `main/*.test.ts` — database, eventService, sessionService, printService, printTemplateService, backupService.
- `shared/*.test.ts` — fit, sheet (grid), printLayout, appError. (54 tests, 11 archivos.)

## Riesgo al modificar (resumen)
- **Alto:** `bootstrap.ts`, `appProtocol.ts`, `security.ts`, `ipc/handle.ts`, migraciones aplicadas,
  `tokens.css`, `package.json` (`type`).
- **Medio:** servicios, handlers, contrato IPC (4 archivos a la vez), `useCamera`, composición.
- **Bajo:** pantallas/CSS individuales (pero respetar tokens y estados de UI).
