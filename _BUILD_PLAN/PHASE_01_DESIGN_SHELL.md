# PHASE_01_DESIGN_SHELL.md — Design System Skeuomórfico & App Shell

## Objetivo
Identidad visual Jardines y navegación completa, con una librería de componentes
skeuomórficos reutilizables, antes de cualquier lógica de negocio.

## Depende de
Fase 0. Lee antes: `DESIGN_BRAND.md`, `docs/DESIGN_SYSTEM.md`, `docs/UI_FLOWS.md`.

## En alcance
- **Tokens de tema** (`renderer/styles/theme.ts` + CSS vars) según `DESIGN_BRAND.md §3-5`.
- **ThemeProvider** + sistema de branding configurable (Jardines por defecto; preparado
  para reskin desde settings en Fase 10). Nada de hex sueltos.
- **Fuentes locales** empaquetadas (Cinzel display, Inter UI, script de acento medido).
- **Librería de componentes** de `docs/DESIGN_SYSTEM.md` con estados skeuo
  (hover/active/disabled táctiles): `Button`, `PrimaryButton`, `DangerButton`, `Card`,
  `Modal`, `Toast`, `StatusBadge`, `Stepper`, `Toggle`, `Input`, `Select`, `EmptyState`,
  `ErrorState`, y los específicos que se rellenarán en sus fases (`CameraPreview`,
  `CountdownDisplay`, `PoseCard`, `TemplatePreview`, `PrintPreview`, `SessionThumbnail`)
  creados como componentes base presentables (sin datos falsos: usan props/EmptyState).
- **Layout** con sidebar de latón sobre fieltro + topbar con evento activo (placeholder
  vía EmptyState "Sin evento activo", NO texto falso).
- **Router** y las 8 pantallas navegables vacías: Dashboard, Eventos, Plantillas, Sesión,
  Historial, Impresión, Configuración, Diagnóstico (cada una con su `EmptyState` real).
- **Galería de componentes** interna (ruta dev) para revisar todos los componentes y estados.

## Fuera de alcance
Lógica de cada pantalla (sus fases). Aquí solo cascarón visual + navegación REAL.

## Datos & IPC
Ninguno nuevo (sin DB aún). Estado local de UI/tema.

## Pantallas / Componentes
Las 8 pantallas + galería de componentes + layout. Dashboard maqueta sus secciones con
`EmptyState` (no inventar métricas).

## Notas de diseño (skeuo)
Aplicar `DESIGN_BRAND.md`: paneles de fieltro, botones de latón con press, una sola
fuente de luz, iconos oro + label, contraste AA. Sensación de objeto premium.

## Flujo completo (anti-huérfano)
- Cada item del sidebar **navega** a su pantalla (nada decorativo).
- "Evento activo" en topbar refleja estado real (vacío hasta Fase 3) vía EmptyState, no
  un nombre inventado.
- El selector de tema/branding, si se muestra, cambia tokens en vivo (si no está listo,
  no se muestra todavía).

## Skills
`ui-ux-pro-max` (Design System Generator PRIMERO, alineado a tokens), `high-end-visual-design`,
`emil-design-eng`, luego en gate `web-design-guidelines` + `design:accessibility-review`.

## Criterio de salida (checklist)
- [ ] Se navega entre las 8 pantallas con el layout skeuo.
- [ ] ~18 componentes base existen con estados hover/active/disabled.
- [ ] Galería de componentes muestra todos los estados.
- [ ] Cumple `DESIGN_BRAND.md §9` (cero hex sueltos, fuentes locales, iconos+label, AA).
- [ ] Ningún botón muerto: lo que no tiene lógica aún muestra `EmptyState`, no acción falsa.

## Audit Gate 1
Conformidad visual + accesibilidad (skills). Verificar que el Dashboard no muestra datos
quemados. Registrar en `AUDIT_LOG.md`.
