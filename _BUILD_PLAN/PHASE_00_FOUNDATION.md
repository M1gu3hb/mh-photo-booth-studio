# PHASE_00_FOUNDATION.md — Fundación & Tooling

## Objetivo
Base técnica que arranca en Windows y queda lista para crecer modularmente, sin lógica
de negocio todavía.

## Depende de
Nada (fase inicial). Lee antes: `CLAUDE.md`, `docs/TECH_ARCHITECTURE.md`,
`docs/SECURITY_AND_LICENSE.md`, `docs/RELEASE_PACKAGING.md`.

## En alcance
- Inicializar proyecto **Electron + React + TypeScript** con **Vite** (electron-vite o
  equivalente). Empaquetador previsto: **electron-builder** (se usa a fondo en Fase 10).
- Estructura de carpetas EXACTA de `docs/TECH_ARCHITECTURE.md`:
  `src/{main,preload,renderer,shared}` con subcarpetas (`main/ipc`, `main/services/...`,
  `renderer/{routes,screens,components,hooks,state,styles}`, `shared/{types,constants,schemas,utils}`).
- **Seguridad Electron** (`docs/SECURITY_AND_LICENSE.md`): `contextIsolation: true`,
  `nodeIntegration: false`, `sandbox` razonable, preload con API mínima y tipada.
- Puente **IPC tipado** vacío pero real: patrón `window.photoBooth.<area>.<método>()` con
  validación y respuesta estructurada `{ok,data}` / `{ok:false,code,message,action}`.
- Config de **lint** (ESLint), **typecheck** (tsc), **test runner** (Vitest) y formato.
- Scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `package` (placeholder para Fase 10).
- Ventana principal que abre a un shell vacío (sin features), con título del producto.
- `.gitignore` correcto (node_modules, dist, data local, sin secretos).

## Fuera de alcance
UI con estilo (Fase 1), DB (Fase 2), cualquier feature de negocio.

## Datos & IPC
- Sin tablas todavía. Definir tipos base en `shared/types` (p. ej. `Result<T>`).
- Definir el **shape del puente IPC** y un canal de prueba `app.getVersion()` real.

## Pantallas / Componentes
- Una ventana en blanco con el nombre del producto desde config (no hardcodear marca
  comercial; leer de constante de branding por defecto).

## Notas de diseño
Ninguna estética aún; solo asegurar que el renderer monta React correctamente.

## Flujo completo (anti-huérfano)
- El canal IPC de prueba (`getVersion`) debe **mostrarse** en pantalla (p. ej. en un
  footer "v0.1.0"): demuestra que main→preload→renderer funciona de punta a punta.

## Skills
`security-review` (revisar config Electron), `full-output-enforcement`.

## Criterio de salida (checklist)
- [ ] `npm run dev` abre la app en Windows.
- [ ] `typecheck`, `lint`, `test` pasan.
- [ ] `build` de producción genera artefacto ejecutable de prueba.
- [ ] `contextIsolation` on, `nodeIntegration` off verificado.
- [ ] IPC de prueba viaja main→preload→renderer y se ve la versión en UI.

## Audit Gate 0
Automático verde + seguridad Electron confirmada + IPC de prueba visible. Registrar en
`AUDIT_LOG.md`. Crear DEC-011 documentando stack concreto elegido (Vite/electron-builder/
better-sqlite3/sharp/qr lib) como confirmación de `DEC-002`.
