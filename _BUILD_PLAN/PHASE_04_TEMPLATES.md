# PHASE_04_TEMPLATES.md — Plantillas V1 (Import + Editor de Slots)

## Objetivo
Permitir crear plantillas personalizadas sobre PNG/JPG con slots configurables y preview.

## Depende de
Fases 0-3. Lee antes: `docs/TEMPLATE_EDITOR.md`, `docs/TEMPLATE_ENGINE.md (modelo)`,
`docs/DATABASE_SCHEMA.md (templates, template_slots)`, `docs/FILE_STORAGE.md (templates/)`.

## En alcance
- **TemplateService**: crear, importar imagen base (PNG/JPG), guardar metadatos
  (`templates`), definir tamaño final, duplicar, exportar/importar `.zip`
  (`template.png` + `template.json` + `preview.png` + `thumbnail.png`).
- **Editor de slots (skeuo)** sobre la imagen base:
  - herramientas: seleccionar, crear slot foto, crear slot QR, mover, redimensionar,
    eliminar, duplicar, ordenar (zIndex), zoom, grid opcional, nudge con teclado.
  - propiedades por slot: id, tipo, nombre visible, x, y, width, height, rotation,
    zIndex, fit (cover/contain/stretch), locked.
  - mostrar medidas; arrastre con mouse; ajuste fino con teclado; guías.
- Guardar **`template.json`** (coordenadas en px relativas al tamaño final).
- **Validación** (`docs/TEMPLATE_EDITOR.md §Validaciones`): nombre e imagen obligatorios,
  ≥2 slots de foto, sin tamaño 0, dentro del canvas, claves no duplicadas, QR opcional.
- **Preview** con fotos demo + QR demo (no datos reales del evento aún).
- Pantalla **Plantillas**: lista + editor + preview + duplicar/exportar/importar.

## Fuera de alcance
Editor de capas/textos avanzado V2 (Fase 11+). Composición real con fotos de sesión (Fase 6).

## Datos & IPC
`templates`, `template_slots`. IPC: `templates.import/create/get/list/update/duplicate/
export/import`, `templates.saveSlots`, `templates.validate`. Archivos vía StorageService
(escritura segura).

## Pantallas / Componentes
Plantillas (lista+editor), `TemplatePreview` ahora funcional con demo.

## Notas de diseño
Editor con lienzo enmarcado en latón; slots como recuadros con asas doradas; panel de
propiedades skeuo; botón guardar/cancelar claros; advertencias no destructivas.

## Flujo completo (anti-huérfano)
- Cada slot dibujado **se guarda** en `template_slots` y **se refleja** en el preview, y
  será **consumido** por el engine (Fase 6). Si un slot no se usa en composición, sobra.
- `fit_mode` elegido debe cambiar el recorte visible en el preview.
- Exportar genera archivo real; importar lo recupera (round-trip).
- Una plantilla **inválida no se puede guardar/usar**: el bloqueo es real, con mensaje.

## Skills
`impeccable` (editor complejo), `ui-ux-pro-max`, en gate `design:accessibility-review`.

## Criterio de salida (checklist)
- [ ] Subir un PNG real, marcar slots de 2/3/4 fotos + QR, guardar.
- [ ] Reabrir la app y la plantilla persiste con su preview correcto.
- [ ] Validación impide guardar plantillas incompletas (probado).
- [ ] Duplicar y export→import round-trip funcionan.
- [ ] `fit_mode` afecta el preview.

## Audit Gate 4
Validaciones probadas; round-trip export/import; anti-huérfano (slots→preview→engine).
Registrar en `AUDIT_LOG.md`.
