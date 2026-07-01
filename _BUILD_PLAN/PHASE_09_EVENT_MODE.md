# PHASE_09_EVENT_MODE.md — Modo Evento Real & Offline Hardening

## Objetivo
Dejar la app lista para operar en un evento real por personal **no técnico**, en
fullscreen, con flujo corto y a prueba de estrés, 100% offline.

## Depende de
Fases 0-8 (flujo completo ya funcional). Lee antes: `docs/DESIGN_SYSTEM.md (modo
evento)`, `docs/UI_FLOWS.md`, `docs/OFFLINE_MODE.md`, `docs/TESTING_CHECKLIST.md`.

## En alcance
- **Modo fullscreen** real (setting de Fase 2 lo activa).
- **Vista operador** vs **vista invitado** bien separadas:
  - operador: botones grandes (Iniciar, Repetir foto/sesión, Imprimir, Reimprimir,
    Siguiente grupo, Salir de fullscreen), estado de cámara/impresión siempre visible.
  - invitado: countdown gigante, pose, flash, sonidos, bienvenida ceremonial; **cero
    controles de admin**.
- **Configuración protegida/bloqueada** durante el evento (evitar salir por accidente;
  desbloqueo intencional).
- Pulido de **microinteracciones** y transiciones (sin retrasar el flujo).
- **Badge de conectividad** no alarmante.
- **Simulación de 30 sesiones** end-to-end **offline** (`docs/TESTING_CHECKLIST.md
  §evento simulado`): crear evento → plantilla → 30 sesiones → imprimir algunas →
  reimprimir 5 → desconectar internet → reiniciar a mitad → confirmar cero pérdida →
  exportar evento.

## Fuera de alcance
Empaque/instalador (Fase 10). Doble pantalla avanzada (Fase 11+).

## Datos & IPC
Sin tablas nuevas; orquesta lo existente. Posible `settings` para "modo evento activo/
bloqueo".

## Pantallas / Componentes
Shell de modo evento (operador/invitado), refinamiento de Sesión/Resultado/Impresión en
contexto fullscreen.

## Notas de diseño
Aquí el skeuomorphism brilla cara al invitado: ceremonial, premium, emocionante; operador
impecable y rápido. Aplicar `impeccable`/`emil-design-eng`. Respetar reduced-motion.

## Flujo completo (anti-huérfano)
- Todo lo construido (evento, plantilla, cámara, engine, impresión, historial) se
  encadena en una experiencia continua: cada paso lleva al siguiente sin callejones.
- "Siguiente grupo" reinicia limpio para la siguiente sesión.
- El bloqueo de configuración realmente impide salir sin intención.

## Skills
`impeccable`, `emil-design-eng`, `high-end-visual-design`, en gate `web-design-guidelines`.

## Criterio de salida (checklist)
- [ ] Operador no técnico completa **30 sesiones** seguidas en fullscreen sin pantallas técnicas.
- [ ] Vistas operador/invitado correctas; admin no visible para invitado.
- [ ] Todo offline; reiniciar a mitad no pierde datos.
- [ ] Config protegida durante evento.
- [ ] Flujo corto, estable, sin trabas.

## Audit Gate 9 (fase grande → verificación reforzada)
Simulación 30 sesiones (cámara/impresora mock) sin fallos críticos; offline checklist
verde; revisión UX operador/invitado. Registrar en `AUDIT_LOG.md`.
