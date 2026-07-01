# BUILD_CRITERIA.md — Criterio Propio y Reglas de Calidad

Tienes **criterio de ingeniero senior**. No eres un ejecutor ciego de los MDs ni un
inventor sin freno. Este documento define el margen exacto en el que decides.

---

## 1. El contrato QUÉ vs CÓMO

- **El QUÉ es sagrado:** alcance, contratos de datos, reglas duras y comportamiento
  vienen de `docs/` + `_BUILD_PLAN/`. No los recortes, no los infles, no los reinterpretes
  para evitar trabajo.
- **El CÓMO es tuyo:** estructura de archivos fina, nombres, librerías concretas, patrón
  de estado, forma de un componente, algoritmo de acomodo del print sheet, etc. Elige lo
  mejor y más simple que cumpla el QUÉ.

## 2. Cuándo PUEDES usar tu criterio (y debes)

- Elegir la implementación más simple, estable y mantenible.
- Mejorar UX/rendimiento/accesibilidad **sin** cambiar el alcance.
- Resolver ambigüedades menores con el default más razonable y **registrarlo** en
  `DECISIONS.md` (formato DEC-XXX: contexto/decisión/consecuencia).
- Reordenar tareas **dentro** de una fase si mejora el resultado.
- Añadir validaciones, estados de error o de vacío que el sentido común exige aunque
  no estén escritos (eso es completar un flujo, no inventar alcance).

## 3. Cuándo NO puedes improvisar

- No agregues módulos/pantallas/features que no se deriven de `docs/` o del MASTER_PLAN.
- No adelantes funciones de Fase 11+ (galería online, QR por sesión, nube, IA poses,
  DSLR SDK, filtros) al MVP.
- No rompas reglas duras: offline-first, guardar-antes-de-imprimir, adaptadores de
  hardware, sin datos personales, Windows, sin rutas absolutas.
- No cambies contratos de `docs/DATABASE_SCHEMA.md` sin una migración + DEC documentada.
- Ante una ambigüedad **grande** que cambie el producto: elige el camino más conservador,
  documéntalo en `DECISIONS.md` y continúa (no te detengas a preguntar; es modo /goal).

## 4. Prohibido: placeholders muertos y cascarones

Un control que existe **debe funcionar de punta a punta**. Está prohibido entregar:

- Botones que no hacen nada / con `onClick` vacío / con `alert("TODO")`.
- Inputs o selects que no persisten ni afectan nada.
- Pantallas "bonitas" sin lógica detrás.
- Datos quemados disfrazados de reales (mock no etiquetado como mock).
- `// TODO`, `// pendiente`, `throw new Error("not implemented")` en rutas que el
  usuario puede alcanzar.
- Estados vacíos resueltos con texto falso en vez de un `EmptyState` real.

Si una función no se puede completar en su fase, **no la pongas en la UI todavía**.
Mejor un módulo pequeño 100% funcional que diez a medias.

> Excepción legítima: adaptadores de hardware con **mock claramente etiquetado** cuando
> el dispositivo real no existe aún (`docs/HARDWARE.md`). El mock debe comportarse de
> forma realista y estar marcado como mock en código y en UI de diagnóstico.

## 5. Cada función con su flujo completo

Toda función nace de una causa y produce una consecuencia **registrada y/o visible**.
Es la regla central; su detalle y ejemplos están en `FLOW_COMPLETENESS.md`. Antes de
dar por hecha una función, responde: ¿de dónde viene su input? ¿quién lo consume? ¿dónde
se persiste? ¿dónde se ve después? Si alguna queda en blanco, el flujo está incompleto.

## 6. Calidad de código

- TypeScript estricto, tipos claros, sin `any` salvo justificación.
- Servicios desacoplados (UI nunca contiene lógica de composición/impresión).
- IPC tipado y validado; nunca exponer Node crudo al renderer.
- Archivos chicos y cohesionados; nada de "god files".
- Errores traducidos a `{code,userMessage,action,severity,module}` (`ERROR_HANDLING.md`).
- Pruebas en la lógica central (repos, engine, sheet builder, validaciones).
- Commits/comentarios sin datos personales.

## 7. Cómo decides en 10 segundos (heurística)

1. ¿Lo pide `docs/`/MASTER_PLAN? → hazlo.
2. ¿Lo prohíbe una regla dura o es Fase 11+? → no lo hagas.
3. ¿Es una mejora del CÓMO sin cambiar alcance? → hazlo y, si no es trivial, registra DEC.
4. ¿Es ambiguo y grande? → opción conservadora + DEC + sigue.
5. ¿Deja un control sin consecuencia? → no lo entregues hasta cerrar el flujo.
