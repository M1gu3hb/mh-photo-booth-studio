/goal Construye COMPLETA la app "MH Photo Booth Studio" (cabina fotográfica para eventos; Windows; Electron+React+TypeScript+SQLite; offline-first; estética skeuomórfica de lujo verde-oro "Jardines Club Hípico") de inicio a fin y SIN DETENERTE hasta terminar y auditar la Fase 10.

PASO 0 — LEE PRIMERO (antes de escribir código), en orden:
1) C:\MH Photo Booth Studio\_BUILD_PLAN\01_READ_FIRST.md
2) C:\MH Photo Booth Studio\_BUILD_PLAN\00_MASTER_PLAN.md
3) En _BUILD_PLAN\: BUILD_CRITERIA.md, FLOW_COMPLETENESS.md, AUDIT_PROTOCOL.md, DESIGN_BRAND.md, SKILLS_GUIDE.md
4) Spec del dueño: C:\MH Photo Booth Studio\CLAUDE.md y TODO C:\MH Photo Booth Studio\docs\
Al iniciar cada fase, lee su _BUILD_PLAN\PHASE_<NN>_*.md completo.
Regla: docs\ define el QUÉ (alcance/contratos/reglas duras); _BUILD_PLAN\ define el CÓMO, el ORDEN y la CALIDAD. Si chocan en una regla dura, gana docs\ y lo registras en DECISIONS.md.

EJECUCIÓN (autónoma):
- Fase por fase EN ORDEN (0→10). No pidas confirmación entre fases.
- Al cerrar cada fase corre su AUDIT GATE (AUDIT_PROTOCOL.md): typecheck+lint+test+build verdes, criterio de salida, anti-huérfanos, cero placeholders, visual+accesibilidad si hubo UI, reglas duras. Corrige todo bug critical/high ANTES de avanzar; registra el reporte en _BUILD_PLAN\AUDIT_LOG.md y actualiza CHANGELOG/TASKS/DECISIONS/BUGS.
- Solo te detienes con la Fase 10 completa y auditada (criterios 1.0.0 + TESTING_CHECKLIST). Si un bloqueo externo real lo impide, documéntalo, usa un mock realista etiquetado y sigue.

CRITERIO PROPIO (BUILD_CRITERIA.md): decides el CÓMO y mejoras implementaciones cuando claramente sea mejor, registrando decisiones no triviales en DECISIONS.md. NO inventes alcance ni adelantes funciones de Fase 11+. No reinterpretes el QUÉ para evitar trabajo.

PROHIBIDO (se rechaza en auditoría):
- Botones/inputs/pantallas inertes; onClick vacíos; alert("TODO"); datos quemados sin etiquetar; "not implemented" en rutas alcanzables. Si una función no se completa en su fase, no la expongas aún.
- Funciones huérfanas: cada control nace de una causa y produce una consecuencia REGISTRADA y/o VISIBLE; antes de darla por hecha responde causa, consumo, persistencia y dónde se ve (FLOW_COMPLETENESS.md). Ej.: si dejas elegir copias/impresora/método, se guarda en print_jobs y se usa/ve.

DISEÑO (DESIGN_BRAND.md): skeuomorphism premium, fieltro verde + latón oro, una fuente de luz, botones táctiles, iconos inequívocos + label, contraste AA, fuentes locales, cero hex sueltos (todo por tokens). Branding configurable, Jardines por defecto. Invitado sin controles de admin; modo evento sin pantallas técnicas.

REGLAS DURAS: offline-first (capturar/componer/guardar/imprimir/reimprimir sin internet); guardar SIEMPRE antes de imprimir; cámara e impresora por adaptadores (mocks si falta hardware); Windows; rutas relativas al data root; sin datos personales en código/logs/commits; seguridad Electron (contextIsolation on, nodeIntegration off, IPC tipado).

SKILLS (SKILLS_GUIDE.md, si existen): en UI corre primero ui-ux-pro-max (design system) + high-end-visual-design + emil-design-eng + impeccable; en gates web-design-guidelines, design:accessibility-review, review, security-review; usa full-output-enforcement contra código truncado/placeholders. IGNORA skills base44-* y estéticas minimalist/brutalist.

Empieza ahora por el PASO 0 y la Fase 0. Mantén typecheck/lint/test verdes en cada paso. No pares hasta entregar la app 1.0.0 instalable en Windows, sin funciones huérfanas ni placeholders.
