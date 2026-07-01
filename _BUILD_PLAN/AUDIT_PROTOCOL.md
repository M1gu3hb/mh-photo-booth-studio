# AUDIT_PROTOCOL.md — Auditoría Entre Fases (Gate)

Entre una fase y la siguiente hay un **gate obligatorio**. No se avanza con bugs
critical/high abiertos. Esto evita arrastrar deuda y errores acumulados.

---

## Cuándo

Al terminar el trabajo de una fase, **antes** de tocar la siguiente.

## Pasos del Audit Gate (todos)

1. **Automático**
   - `typecheck` sin errores.
   - `lint` sin errores (warnings revisados).
   - `test` (unit/integration de esa fase) en verde.
   - `build` de producción exitoso (al menos desde Fase 0).

2. **Funcional vs criterio de salida**
   - Reproduce el "Criterio de salida" de la fase (en `00_MASTER_PLAN.md` y en el
     `PHASE_0X`). Cada punto: ✅/❌. Si hay ❌ no se cierra la fase.
   - Para flujos con hardware ausente, usa mocks realistas (`docs/HARDWARE.md`).

3. **Anti-funciones-huérfanas** (`FLOW_COMPLETENESS.md`)
   - Para cada control nuevo, llena el contrato de 4 preguntas. Cualquier hueco = bug high.

4. **Sin placeholders muertos** (`BUILD_CRITERIA.md §4`)
   - Busca en el código de la fase: `TODO`, `FIXME`, `not implemented`, `onClick` vacíos,
     `alert(`, datos quemados no etiquetados. Cero tolerancia en rutas alcanzables por el usuario.

5. **Conformidad visual** (si la fase tocó UI) (`DESIGN_BRAND.md §9`)
   - Tokens (no hex sueltos), skeuomorphism, estados de botón, iconos+label, contraste AA,
     modo evento/invitado correctos.

6. **Accesibilidad rápida** (si tocó UI)
   - Foco visible, navegación por teclado, labels, estado no-solo-color.

7. **Reglas duras**
   - Offline-first intacto, guardar-antes-de-imprimir, adaptadores, sin rutas absolutas,
     sin datos personales, seguridad Electron.

8. **Documentación viva**
   - Actualiza `CHANGELOG.md` (entrada de la fase), `TASKS.md` (marca hechas), 
     `DECISIONS.md` (DEC nuevas), `BUGS.md` (bugs encontrados/cerrados) y agrega el
     **reporte de auditoría** a `_BUILD_PLAN/AUDIT_LOG.md`.

9. **Veredicto**
   - Si todo ✅ y cero critical/high → cierra fase y avanza.
   - Si hay ❌ → corrige y repite el gate. No avances "para volver luego".

## Verificación reforzada (fases grandes: 5, 6, 7, 9, 10)

Ejecuta una **segunda pasada de revisión independiente** (idealmente un subagente con
rol revisor, o las skills `review` / `security-review` / `web-design-guidelines`):
- revisa diffs, busca regresiones, valida los criterios de salida sin sesgo,
- confirma que no se rompió una fase anterior (correr su smoke test).

---

## Plantilla de reporte (pegar en `AUDIT_LOG.md`)

```md
## Audit Gate — Fase {N}: {nombre}  ({YYYY-MM-DD})

### Automático
- typecheck: PASS/FAIL
- lint: PASS/FAIL
- tests: PASS/FAIL (X passed)
- build: PASS/FAIL/NA

### Criterio de salida
- [ ] punto 1 …
- [ ] punto 2 …

### Anti-huérfanos (contrato 4 preguntas)
- {control}: causa=… consumo=… persiste=… se ve en=…  → OK/FALTA

### Placeholders muertos
- Búsqueda TODO/FIXME/not-implemented/onClick vacío: NINGUNO / lista

### Visual + Accesibilidad (si aplica)
- tokens / skeuo / estados / iconos+label / contraste / teclado: OK/observaciones

### Reglas duras
- offline / save-before-print / adaptadores / rutas / privacidad / seguridad: OK

### Bugs encontrados
- BUG-XXX (sev) … estado

### Veredicto
- AVANZAR a Fase {N+1} / SE QUEDA (corrigiendo …)
```

> El `AUDIT_LOG.md` es la bitácora de calidad del proyecto. Debe crecer con una entrada
> por cada gate ejecutado.
