# 01_READ_FIRST.md — Léeme antes de escribir una sola línea de código

Eres el desarrollador senior a cargo de construir **MH Photo Booth Studio** de
principio a fin, de forma autónoma y por fases auditadas. Este archivo es lo
**primero** que debes leer. No improvises hasta haber leído el orden completo.

---

## 0. Orden de lectura obligatorio

1. **Este archivo** (`_BUILD_PLAN/01_READ_FIRST.md`).
2. `_BUILD_PLAN/00_MASTER_PLAN.md` — el plan madre con todas las fases.
3. `_BUILD_PLAN/BUILD_CRITERIA.md` — cómo decides y qué nunca haces.
4. `_BUILD_PLAN/FLOW_COMPLETENESS.md` — la regla anti-funciones-huérfanas.
5. `_BUILD_PLAN/AUDIT_PROTOCOL.md` — la auditoría entre fases.
6. `_BUILD_PLAN/DESIGN_BRAND.md` — identidad visual + skeuomorphism.
7. `_BUILD_PLAN/SKILLS_GUIDE.md` — qué skills usar y cuándo.
8. La **especificación fuente** del dueño del producto:
   `CLAUDE.md` y TODO `docs/` (PRD, TECH_ARCHITECTURE, ROADMAP, DATABASE_SCHEMA,
   FILE_STORAGE, UI_FLOWS, CAMERA_CAPTURE, TEMPLATE_ENGINE, TEMPLATE_EDITOR,
   PRINT_PIPELINE, QR_GALLERY, POSE_SYSTEM, OFFLINE_MODE, ERROR_HANDLING,
   HARDWARE, SECURITY_AND_LICENSE, RELEASE_PACKAGING, TESTING_CHECKLIST,
   DECISIONS, BUGS, CHANGELOG, TASKS).
9. Al empezar cada fase, lee su archivo `_BUILD_PLAN/PHASE_0X_*.md` completo.

> Regla de oro: **`docs/` define el QUÉ (alcance, contratos, reglas). `_BUILD_PLAN/`
> define el CÓMO, el ORDEN y la CALIDAD.** Si algo del `_BUILD_PLAN` contradijera una
> regla dura de `docs/` (offline-first, no acoplar hardware, guardar antes de
> imprimir, no datos personales), gana `docs/` y lo registras en `DECISIONS.md`.

---

## 1. Qué vas a construir (en una frase)

App de escritorio **Windows (Electron + React + TypeScript + SQLite)**, offline-first,
para operar una cabina fotográfica en eventos: Evento → Plantilla → Cámara → Countdown
→ Fotos → Composición → Guardado → Impresión → Reimpresión → Historial, con estética
**skeuomórfica de lujo verde-oro (Jardines)**.

---

## 2. Reglas no negociables (resumen; el detalle está en cada doc)

1. **Offline-first**: capturar, componer, guardar, imprimir y reimprimir funcionan SIN internet.
2. **Guardar antes de imprimir**: jamás se pierde una sesión por un fallo de impresión.
3. **Hardware por adaptadores**: cámara e impresora abstractas; nada acoplado a un modelo. Usa mocks si falta hardware, no te bloquees.
4. **Sin funciones huérfanas**: cada control existe por una causa y produce una consecuencia registrada/visible (ver `FLOW_COMPLETENESS.md`).
5. **Sin placeholders muertos**: nada de botones que no hacen nada, inputs falsos, "TODO", datos quemados o pantallas decorativas sin lógica. Si lo pones, funciona.
6. **Skeuomorphism + marca Jardines** en todo lo visual (`DESIGN_BRAND.md`).
7. **Tolerancia a errores**: errores con código → mensaje claro + acción (nunca stack traces en modo evento).
8. **Documentación viva**: actualiza `CHANGELOG.md`, `TASKS.md`, `DECISIONS.md`, `BUGS.md` y `_BUILD_PLAN/AUDIT_LOG.md` al cerrar cada fase.
9. **Privacidad**: sin datos personales en código, logs, commits ni semillas. Solo "Miguel" (owner) y "Jardines Club Hípico" (primer uso).
10. **Windows**: rutas relativas al data root, sin rutas absolutas de una máquina.

---

## 3. Cómo operas (modo /goal autónomo)

- Trabaja **fase por fase, en orden**, sin detenerte ni pedir confirmación entre fases.
- Al terminar una fase: ejecuta su **Audit Gate** (`AUDIT_PROTOCOL.md`). Corrige TODO
  bug critical/high antes de avanzar. Registra el resultado en `AUDIT_LOG.md`.
- Solo te detienes cuando: (a) la **Fase 10** está completa y auditada, o (b) un
  bloqueo externo real lo impide — en ese caso documenta en `DECISIONS.md`/`BUGS.md`,
  aplica un mock/fallback y sigue.
- Mantén un TODO interno por fase. Haz cambios pequeños, verificables, con typecheck/lint/test verdes.
- Tienes **criterio propio**: puedes mejorar el "cómo" si claramente es mejor, pero
  sin inventar alcance nuevo ni salirte de los contratos de `docs/`.

---

## 4. Definición de "terminado" global

La app cumple los **Criterios para 1.0.0** de `docs/RELEASE_PACKAGING.md` y pasa el
`docs/TESTING_CHECKLIST.md` (incluida la simulación de 30 sesiones offline), instalable
en una Windows limpia, con estética Jardines skeuomórfica, sin funciones huérfanas ni
placeholders. Recién entonces el /goal se considera cumplido.
