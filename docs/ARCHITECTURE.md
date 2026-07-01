# ARCHITECTURE.md

> Arquitectura **viva** (refleja el código actual). El diseño original está en `TECH_ARCHITECTURE.md`.
> Si hay conflicto, gana este archivo + el código.

## Visión general

Electron con 3 procesos y aislamiento estricto:

```
┌─────────────────────────────────────────────────────────────┐
│ MAIN (Node)  src/main/                                        │
│  ciclo de vida · ventanas · app:// + CSP · seguridad ·        │
│  SQLite (better-sqlite3) · servicios · IPC (Result<T>)        │
└───────────────▲───────────────────────────┬──────────────────┘
                │ IPC tipado (ipcMain.handle) │ webContents.send (live:*)
┌───────────────┴───────────────────────────▼──────────────────┐
│ PRELOAD  src/preload/index.ts                                 │
│  contextBridge → window.photoBooth (PhotoBoothApi)            │
└───────────────▲───────────────────────────────────────────────┘
                │ window.photoBooth.<area>.<método>
┌───────────────┴───────────────────────────────────────────────┐
│ RENDERER (React)  src/renderer/                                │
│  pantallas · UI kit skeuomórfico · hooks · cámara · canvas     │
│  Ventana principal (operador) + Ventana pública (2º monitor)   │
└────────────────────────────────────────────────────────────────┘
```

`src/shared/` es código sin proceso (tipos, constantes, matemática pura) usado por los tres lados.

## Proceso MAIN (`src/main/`)

- **`index.ts`** — `registerAppScheme()` (privileged) en top-level; en `whenReady`:
  `handleAppProtocol()` → `configurePermissions()` → `bootstrap()` (try/catch) →
  `registerIpcHandlers()` → `createMainWindow()`; aplica fullscreen-default; hook smoke env-gated
  (`PBS_SMOKE_*`); single-instance lock.
- **`bootstrap.ts`** — lee data root (`appConfig.ts`, override `PBS_DATA_ROOT`) → `ensureStructure` →
  backup de DB si sube de versión → `openBetterSqlite` → `runMigrations` → repos → seed pose packs →
  settings (defaults + licencia) → instancia TODOS los servicios → `setContext`. `changeDataRoot`.
- **`context.ts`** — `AppContext` (contenedor) + `getContext()/setContext()/hasContext()`.
- **`window.ts`** — ventana principal (webPreferences seguro; carga dev URL o `app://`).
- **`publicWindow.ts`** — ventana pública (Fase 14): 2º monitor fullscreen si existe; carga
  `<base>#/publico`; `openPublicWindow/closePublicWindow/isPublicOpen`; `broadcastLive(channel,payload)`.
- **`appProtocol.ts`** — protocolo `app://bundle/` que sirve `out/renderer` con CSP estricta en las
  respuestas (DEC-018/BUG-008). `APP_INDEX_URL`. **No volver a `file://`.**
- **`security.ts`** — `configurePermissions` (solo media) + `hardenNavigation` (permite `app://` y dev URL).
- **`services/`** — `database/` (driver, migraciones, repos), `storage`, `settings`, `events`,
  `templates`, `printTemplates`, `sessions`, `qr`, `print`, `diagnostics`, `backup`, `logging`.
- **`ipc/`** — un `*.handlers.ts` por área + `handle.ts` (wrapper `Result<T>`) + `index.ts` (registra todo).

### Capa de datos
- `database/types.ts` — interfaz `Db` (exec/prepare/transaction/close). Implementaciones:
  `betterSqlite.ts` (producción) y `test/helpers/nodeSqlite.ts` (tests, `node:sqlite`) — misma SQL.
- `migrate.ts` — corre migraciones pendientes en transacción, avanza `PRAGMA user_version`.
  `LATEST_SCHEMA_VERSION` = max de `migrations/index.ts` (hoy **3**).
- `BaseRepository.ts` — CRUD genérico (id TEXT + timestamps) con mapeo snake↔camel (`rowMapper.ts`).
- `repositories/` — set tipado (`createRepositories(db)`); repos especiales: Settings, PosePacks, Poses.

## Proceso PRELOAD (`src/preload/index.ts`)

Expone **solo** `window.photoBooth` (tipo `PhotoBoothApi` en `shared/types/api.ts`). Cada área llama
`ipcRenderer.invoke(IPC_CHANNELS.<area>.<m>, …)` → recibe `Result<T>`. Para eventos push (Fase 14):
`live.onState/onCommand` usan `ipcRenderer.on` y devuelven función de desuscripción.

## Proceso RENDERER (`src/renderer/`)

- `App.tsx` → `ThemeProvider` (carga branding por IPC) → `ToastProvider` → `EventsProvider` (evento
  activo) → `AppRouter` (HashRouter).
- `routes/router.tsx` — rutas dentro del AppShell + `/evento` y `/publico` fuera del shell.
- `screens/` — una por pantalla (ver PROJECT_CONTEXT §5).
- `components/ui/` — kit skeuomórfico (Button, Card, Modal, Select, Input, Toggle, Stepper, Icon,
  StatusBadge, EmptyState, ErrorState, ToastProvider, CameraPreview, CountdownDisplay, PoseCard,
  TemplatePreview, PrintPreview, SessionThumbnail).
- `components/{events,templates,print,settings,layout}/` — componentes por dominio (incluye
  `TemplateEditor` y `PrintTemplateEditor`).
- `hooks/useCamera.ts` + `lib/camera/` — adaptadores Webcam/Mock (callback ref `setVideo`).
- `lib/composition/` — `composeSession` (tira/diseño), `buildSheet` (hoja de impresión), `loadImage`.
- `theme/ThemeProvider.tsx` + `styles/tokens.css` — tema y tokens.

## Código compartido (`src/shared/`)

- `constants/ipc.ts` — `IPC_CHANNELS` (18 áreas: app, settings, storage, db, events, templates,
  printTemplates, sessions, camera, qr, print, history, diagnostics, branding, license, backup,
  display, live). **Contrato canal — sincronizar con preload + api.ts + handler.**
- `constants/` — `branding`, `event`, `eventTypes`, `print`, `settings`.
- `types/` — `api`, `entities`, `events`, `templates`, `printTemplates`, `session`, `camera`, `print`,
  `diagnostics`, `license`, `live`, `app`, `settings`, `result`.
- `errors/appError.ts` — `AppError` + `toAppError` (módulo + mensaje usuario + acción).
- `lib/` — `fit.ts` (`computeDrawRect`), `sheet.ts` (`computeSheetCells`, `computeStripGrid`),
  `printLayout.ts` (`computePrintCells`: grid/custom/full). **Puras y unit-testeadas.**

## Contratos clave a mantener sincronizados

Al agregar/cambiar una llamada IPC, tocar los 4 a la vez:
`shared/constants/ipc.ts` → `main/ipc/<area>.handlers.ts` → `preload/index.ts` →
`shared/types/api.ts`. El handler devuelve datos o lanza `AppError`; `handle()` envuelve en `Result<T>`.

## Empaque / runtime de producción

- Producción carga el renderer por `app://` (CSP estricta). Dev usa `ELECTRON_RENDERER_URL`.
- `better-sqlite3` es nativo: en producción va sin asar / en `resources/app/node_modules`. Tests no lo
  cargan (usan `node:sqlite`).
- Empaque actual: ensamblado manual desde `node_modules/electron/dist` + instalador por usuario
  (`release/Install.ps1`). Ver `docs/RELEASE_PACKAGING.md` y DECISIONS DEC-019/020.
