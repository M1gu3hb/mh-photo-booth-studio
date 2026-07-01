# SKILLS_GUIDE.md — Qué Skills Usar y Cuándo

Usa skills como **aceleradores de calidad**, no como muletas. Los principios clave ya
están escritos en estos MDs; si una skill no está instalada en tu entorno, **sigue el
MD correspondiente igual**. Si está, úsala para subir el nivel.

> Importante: este proyecto es **Electron + React + TypeScript**, NO Base44, NO Next.js.
> **Ignora cualquier skill `base44-*`** (asumen otra plataforma) y las de estética
> equivocada (`minimalist-ui`, `industrial-brutalist-ui`): chocan con la dirección
> skeuomórfica de lujo de `DESIGN_BRAND.md`.

---

## Diseño / UI (la app debe verse premium y skeuomórfica)

- **`ui-ux-pro-max`** — ÚSALA al inicio de la **Fase 1**. Corre su *Design System
  Generator* ANTES de escribir UI, alineándolo a los tokens de `DESIGN_BRAND.md`
  (verde-oro, skeuo). Vuelve a consultarla al crear pantallas nuevas (editor, sesión,
  impresión).
- **`high-end-visual-design`** — en toda fase con UI. Bloquea defaults "baratos de IA";
  refuerza sombras, materiales, jerarquía premium.
- **`emil-design-eng`** — para pulido fino, microinteracciones y decisiones de animación
  (botón táctil, countdown, flash). Fases 1, 5, 9.
- **`impeccable`** — para diseñar/criticar/pulir interfaces complejas (editor de slots,
  modo evento). Fases 4, 9 y en auditorías de UI.
- **`vercel-react-view-transitions`** — si decides transiciones de pantalla suaves
  (Fase 1/9). Opcional, respeta `prefers-reduced-motion`.

## Auditoría de calidad (Audit Gates)

- **`web-design-guidelines`** — revisa el código UI contra buenas prácticas. Gate de
  cada fase con UI.
- **`design:accessibility-review`** — auditoría WCAG AA (contraste, foco, teclado).
  Gates de Fases 1, 4, 5, 7, 9.
- **`review`** — revisión de código general en gates de fases grandes (5, 6, 7, 9, 10).
- **`security-review`** — seguridad de Electron/IPC. Fase 0 (setup), Fase 8 (errores/
  logs sin secretos) y Fase 10 (release).
- **`design:design-critique`** — feedback estructurado de pantallas clave (opcional).

## Anti-placeholders / completitud

- **`full-output-enforcement`** — actívala al generar componentes/módulos grandes para
  evitar truncados, `// resto del código`, imports faltantes y stubs. Refuerza la regla
  de `BUILD_CRITERIA.md §4`.

## Documentación de usuario (Fase 10)

- **`docx`** o **`pdf`** — para el quick-start / manual de usuario y release notes
  presentables. Solo si el dueño quiere el manual en ese formato; si no, Markdown basta.

---

## Tabla rápida por fase

| Fase | Skills sugeridas |
|---|---|
| 0 | `security-review` (setup Electron), `full-output-enforcement` |
| 1 | `ui-ux-pro-max` (design system primero), `high-end-visual-design`, `emil-design-eng`, `web-design-guidelines`, `design:accessibility-review` |
| 2 | `full-output-enforcement`, `review` |
| 3 | `ui-ux-pro-max`, `web-design-guidelines` |
| 4 | `impeccable`, `ui-ux-pro-max`, `design:accessibility-review` |
| 5 | `emil-design-eng`, `review`, `design:accessibility-review` |
| 6 | `review`, `full-output-enforcement` |
| 7 | `impeccable`, `review`, `design:accessibility-review` |
| 8 | `security-review`, `review` |
| 9 | `impeccable`, `emil-design-eng`, `high-end-visual-design`, `web-design-guidelines` |
| 10 | `security-review`, `review`, `docx`/`pdf` (manual) |

> Regla: la skill informa; el MD manda. Nunca dejes que una skill te empuje a una
> estética o stack distintos a los definidos aquí.
