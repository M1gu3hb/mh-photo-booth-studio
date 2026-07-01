# BUGS_PENDING.md

> Lista **viva** de bugs/limitaciones conocidas. Histórico completo de bugs resueltos (BUG-001…008)
> en `docs/BUGS.md`.

## Bugs abiertos (critical / high)

**Ninguno.** No hay bugs critical ni high abiertos. Gate verde: typecheck 0, lint 0, 54 tests, build 0.

## Limitaciones conocidas (no son bugs de código; documentadas)

### LIM-1 — Instalador NSIS `.exe` no generable en este entorno
- **Impacto:** no hay instalador `.exe` clásico con asistente; se entrega instalador por usuario
  (`release/Install.ps1`) + ZIP portable.
- **Causa:** la extracción de `winCodeSign` (electron-builder) usa `7za -snld`, que requiere privilegio
  de crear enlaces simbólicos; la cuenta no es admin ni tiene Modo desarrollador. `@electron/packager`
  también falla (el sandbox corta la descompresión en streaming). Ver DECISIONS DEC-019/020.
- **Archivos:** `package.json` (build), `release/`.
- **Prioridad:** media (afecta distribución masiva, no el uso). **Estado:** workaround entregado.
- **Cómo resolver:** correr `npm run package` en una máquina Windows con admin/Modo desarrollador + red.

### LIM-2 — Vista al público: dos lecturas de cámara simultáneas
- **Impacto:** la ventana pública abre su propia cámara (mismo dispositivo que el operador). Algunos
  drivers no permiten 2 `getUserMedia` del mismo device → la pública cae a cámara simulada.
- **Causa:** acceso exclusivo del dispositivo según driver. Ver DEC-021.
- **Archivos:** `PublicViewScreen.tsx`, `hooks/useCamera.ts`.
- **Prioridad:** media (validar con el hardware real del evento). **Estado:** fallback funcional + overlays siguen.
- **Cómo mitigar:** validar en 2 monitores físicos con la cámara definitiva; si falla, considerar
  streaming de frames del operador a la pública.

## Riesgos a vigilar (no bugs)
- Hardware final (cámara/impresora) sin confirmar → mantener adaptadores (no acoplar a un modelo).
- Tamaños de hoja reales de la impresora de sublimación pueden diferir de `PAPER_SIZES`; ajustar al confirmar.
- Docs de diseño antiguos coexisten con los de transferencia; los de transferencia son la fuente viva.

## Histórico (resueltos) — ver docs/BUGS.md
BUG-001 (binario Electron), BUG-002 (hex sueltos → tokens), BUG-003 (node:sqlite en tests),
BUG-004 (import CSS), BUG-005 (id de plantilla vs carpeta), BUG-006 (session.id), BUG-007 (tests print/FK),
**BUG-008 (critical, fixed): CSP sobre file:// → protocolo app://** (DEC-018).
