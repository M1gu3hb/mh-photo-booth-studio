# PROMPTS.md

> Prompts y comandos útiles para continuar el proyecto en otra sesión/IA.

## Arranque de sesión (pegar al inicio)

```
Antes de tocar código, lee CLAUDE.md y PROJECT_CONTEXT.md, luego
docs/ARCHITECTURE.md, docs/DATABASE.md, docs/FILE_MAP.md, docs/DECISIONS.md,
docs/BUGS_PENDING.md y docs/NEXT_STEPS.md. Inspecciona el estado real del código.
Si la doc contradice al código, actualízala antes de cambios importantes.
Respeta "Cosas que NO se deben romper" (PROJECT_CONTEXT §14). Al terminar,
actualiza la documentación viva y entrega el bloque de cierre (cambios, archivos,
docs, bugs, próximo paso).
```

## Gate de verificación (correr tras cada grupo de cambios)

```
npm run typecheck && npm run lint && npm test && npm run build
```
Esperado: typecheck 0, lint 0, 54 tests (o más), build 0.

## Ver el cambio en la app instalada (reconstruir + reinstalar)

La app que abre el owner es el snapshot en `%LOCALAPPDATA%\Programs\MH Photo Booth Studio`, NO el
código fuente. Para que un cambio se vea:

1. `npm run build`
2. Reensamblar el paquete (electron-builder está bloqueado en este entorno, DEC-019/020): copiar
   `node_modules/electron/dist` + `out/` fresco + deps de producción del proceso main a
   `release/MH Photo Booth Studio-win32-x64/` (eliminar `default_app.asar`, crear `resources/app/`,
   renombrar `electron.exe` → `MH Photo Booth Studio.exe`).
3. `release/Install.ps1` (instala por usuario, sin admin) → abrir desde Menú Inicio/Escritorio.

> Síntoma típico: "no veo los cambios" = paquete instalado viejo. Solución = reconstruir + reinstalar.

## Verificación headless (sin abrir ventana, sin tocar datos reales)

Smoke harness en `src/main/index.ts` (env-gated). Usar el Electron del proyecto:

```
MSYS_NO_PATHCONV=1 PBS_DATA_ROOT="<rootTemporal>" PBS_SMOKE_EXIT=1 \
  PBS_SMOKE_SHOT="<salida>.png" PBS_SMOKE_ROUTE='#/impresion' \
  PBS_SMOKE_EVAL='document.querySelector(".pb-public")?"OK":"NO"' \
  node_modules/electron/dist/electron.exe . --no-sandbox --disable-gpu
```
- `PBS_DATA_ROOT` aísla un data root (no toca `Documents/PhotoBoothData` del owner).
- `MSYS_NO_PATHCONV=1` evita que Git Bash mangle `#/ruta`.
- Para capturar UI tras un click: en `PBS_SMOKE_EVAL` hacer `.click()` y `await new Promise(r=>setTimeout(r,700))`
  antes de retornar (el harness espera el promise antes de la captura).

## Sembrar datos de prueba (data root aislado)

Usar `node:sqlite` (vía `createRequire`) sobre `<root>/database/app.sqlite` tras un primer arranque
(que crea la DB). Insertar evento + plantilla (+ PNG en `<root>/templates/template_<id>/template.png`)
y `settings.active_event_id = <eventId>`. Ejemplo en el historial de la sesión 2026-06-30 (CHANGELOG).

## Reglas de oro al editar
- Mantener sincronía IPC: `shared/constants/ipc.ts` ↔ `main/ipc/<area>.handlers.ts` ↔
  `preload/index.ts` ↔ `shared/types/api.ts`.
- Colores solo por tokens (`src/renderer/styles/tokens.css`); cero hex sueltos.
- Guardar antes de imprimir; offline-first; adaptadores para hardware; sin PII.
