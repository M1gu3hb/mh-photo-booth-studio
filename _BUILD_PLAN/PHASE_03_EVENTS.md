# PHASE_03_EVENTS.md — Eventos & Almacenamiento por Evento

## Objetivo
Crear y administrar eventos reales, con su carpeta y configuración, y un evento activo.

## Depende de
Fases 0-2. Lee antes: `docs/PRD.md §1`, `docs/UI_FLOWS.md §crear evento`,
`docs/FILE_STORAGE.md`, `docs/DATABASE_SCHEMA.md (events)`.

## En alcance
- **EventService**: crear, editar, archivar, seleccionar activo, listar recientes,
  resolver rutas del evento.
- Al crear evento: crear carpeta `events/event_<id>/` con subcarpetas (`originals/`,
  `outputs/`, `print_sheets/`, `qr/`, `exports/`) + `event.json`.
- **Configuración por evento**: nombre, tipo (XV/boda/bautizo/graduación/empresa/fiesta/
  otro), fecha, referencia/cliente opcional, número de fotos por sesión (2/3/4), copias
  por defecto, toggle QR + link, plantilla asignada (selector; lista vacía hasta Fase 4).
- Pantalla **Eventos**: lista (cards skeuo) + formulario crear/editar + acción archivar.
- **Evento activo** persistente, visible en topbar y Dashboard (card real).
- Dashboard: card de evento activo con datos reales + "Iniciar sesión" (deshabilitado con
  motivo claro si falta plantilla/cámara — no botón muerto).

## Fuera de alcance
Editor de plantilla (Fase 4), captura (Fase 5). El selector de plantilla puede quedar
vacío con `EmptyState` "Aún no hay plantillas — créalas en Plantillas".

## Datos & IPC
`events`, `settings` (active_event_id). IPC: `events.create/update/archive/list/
getActive/setActive`. Validación de campos obligatorios.

## Pantallas / Componentes
Eventos (lista+form), card de evento activo en Dashboard, selector de evento activo en topbar.

## Notas de diseño
Form skeuo con `Stepper` o secciones claras; validación inline; Toast al guardar; tipo de
evento con iconos reconocibles (anillo=boda, corona=XV, etc.).

## Flujo completo (anti-huérfano)
- Cada campo del form **se guarda** (`events`), **se relee** al editar y **se muestra**
  (Dashboard/topbar). Verifica con el contrato de 4 preguntas.
- `event_type` luego selecciona pose pack (Fase 5) y textos (Fase 6): déjalo consistente.
- `default_photo_count`/`default_copies`/`qr_*`/`template_id` se consumirán en Fases 4-7;
  guárdalos correctamente desde ya.
- "Iniciar sesión" deshabilitado debe explicar **por qué** (sin plantilla / sin cámara).

## Skills
`ui-ux-pro-max`, `web-design-guidelines`.

## Criterio de salida (checklist)
- [ ] Crear evento → guardado en DB + carpeta creada + `event.json`.
- [ ] Aparece como activo en Dashboard/topbar y **persiste tras reiniciar**.
- [ ] Editar y archivar funcionan.
- [ ] Recientes se listan ordenados.
- [ ] Tests de EventService verdes.

## Audit Gate 3
Anti-huérfano (cada campo guardado→releído→mostrado); carpeta coincide con DB; persistencia.
Registrar en `AUDIT_LOG.md`.
