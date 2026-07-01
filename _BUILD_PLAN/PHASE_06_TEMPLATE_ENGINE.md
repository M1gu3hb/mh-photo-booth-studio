# PHASE_06_TEMPLATE_ENGINE.md — Template Engine (Composición)

## Objetivo
Generar automáticamente la imagen final profesional de cada sesión, guardada antes de imprimir.

## Depende de
Fases 0-5. Lee antes: `docs/TEMPLATE_ENGINE.md`, `docs/QR_GALLERY.md`,
`docs/FILE_STORAGE.md (outputs/)`, `docs/DATABASE_SCHEMA.md (session_outputs, qr_links)`.

## En alcance
- **TemplateEngine** (canvas/sharp) con el **pipeline** de `docs/TEMPLATE_ENGINE.md`:
  cargar base + `template.json` + fotos originales → canvas del tamaño final → fondo →
  procesar slots por zIndex → insertar fotos con **fit** (cover/contain/stretch) →
  insertar QR → textos → exportar → miniatura → registrar.
- **QRService**: validar link, generar QR, guardar en `events/event_<id>/qr/`,
  registrar `qr_links`; **insertar QR solo si** evento QR-on + plantilla con slot QR +
  link válido (si falta slot pero QR es opcional, advertir sin bloquear).
- **Textos dinámicos** básicos: nombre del evento, fecha (de `events`).
- **Export** PNG y JPG alta calidad; **miniatura** para historial; **escritura segura**.
- Registrar `session_outputs` (strip/postcard/thumbnail) y actualizar
  `sessions.final_output_path`/`thumbnail_path`.
- Soportar salidas **tira vertical** y **postal/4x6**.
- **Guardar SIEMPRE antes de cualquier impresión** (regla dura).

## Fuera de alcance
Impresión y print sheet (Fase 7). QR por sesión / galería online (Fase 11+).

## Datos & IPC
`session_outputs`, `qr_links`, update `sessions`. IPC: `engine.compose`,
`qr.generate/validate`. Errores `TEMPLATE_FILE_MISSING/TEMPLATE_INVALID/SLOT_COUNT_MISMATCH`.

## Pantallas / Componentes
Preview de resultado tras la sesión (operador decide imprimir/guardar/repetir).
`TemplatePreview`/result viewer con la imagen final real.

## Notas de diseño
Mostrar el resultado en marco premium; "Preparando tu foto" mientras compone; calidad
visible. Operador ve acciones claras (Imprimir / Cambiar copias / Repetir / Guardar / Siguiente).

## Flujo completo (anti-huérfano)
- Los **slots** (Fase 4) y las **fotos** (Fase 5) se combinan aquí en una salida real.
- El **toggle QR + link** (Fase 3) realmente produce un QR insertado y escaneable.
- `fit_mode` por slot afecta el recorte final.
- El resultado **se guarda** y **se ve** en preview e historial, y **se consume** por
  impresión (Fase 7).
- Si la plantilla no tiene slots suficientes para `photo_count`: `SLOT_COUNT_MISMATCH`
  con acción (no componer basura).

## Skills
`review`, `full-output-enforcement`.

## Criterio de salida (checklist)
- [ ] Cada sesión genera imagen final + miniatura, guardadas y registradas.
- [ ] 20 composiciones seguidas correctas (alineación/recorte razonables).
- [ ] QR se inserta y es **escaneable** cuando aplica; se omite limpio cuando no.
- [ ] Resultado guardado en `outputs/` **antes** de cualquier impresión.
- [ ] Tira vertical y postal soportadas.

## Audit Gate 6 (fase grande → verificación reforzada)
Calidad de salida (resolución/alineación); QR escaneado de prueba; save-before-print
verificado; anti-huérfano (toggle/slot QR realmente reflejado). Registrar en `AUDIT_LOG.md`.
