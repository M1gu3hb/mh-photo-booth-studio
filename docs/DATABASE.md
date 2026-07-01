# DATABASE.md

> Fuente **viva** del esquema (refleja las migraciones reales). El diseño original está en
> `DATABASE_SCHEMA.md`. Si hay conflicto, gana este archivo + el código.

## Resumen

- **Motor:** SQLite, un archivo por data root → `<dataRoot>/database/app.sqlite`.
- **Driver:** `better-sqlite3` en producción (main). Tests usan `node:sqlite` (misma SQL, evita
  el mismatch de ABI Electron↔Node).
- **Acceso:** interfaz `Db` (`src/main/services/database/types.ts`) + `BaseRepository` (CRUD genérico,
  mapeo snake_case↔camelCase) + repos en `repositories/`. Tipos de fila en `src/shared/types/entities.ts`.
- **Versión de esquema actual:** **4** (`PRAGMA user_version`; `LATEST_SCHEMA_VERSION` en `migrate.ts`).
- **Migraciones:** strings TS embebidos en `migrations/` (DEC-014). Nunca editar una aplicada; agregar
  una nueva versionada en `migrations/index.ts`. Al iniciar, si la versión sube, se hace **backup** de la DB.

## Entidades / tablas

### events
- **Propósito:** un evento (XV, boda, etc.). El evento "activo" se guarda en `settings.active_event_id`.
- **Campos clave:** `id`, `name`, `event_type`, `event_date?`, `client_reference?`, `template_id?`
  (plantilla de foto seleccionada, universal), `default_photo_count` (def 3), `default_copies` (def 1),
  `qr_enabled`, `qr_link?`, `status` (def 'active'), timestamps.
- **Relaciones:** referenciada por `sessions`, `print_jobs`, `print_templates`, `qr_links`.
- **Reglas:** borrar una plantilla de foto pone `template_id = NULL` en los eventos que la usaban.
- **Archivos:** `EventService.ts`, `events.handlers.ts`, `EventsScreen.tsx`, `EventsProvider.tsx`.

### templates (plantillas de foto — UNIVERSALES)
- **Propósito:** plantilla base (imagen PNG/JPG) + slots; cualquier evento puede usarla.
- **Campos clave:** `id`, `name`, `type` (def 'image_slots'), `base_image_path?`, `width_px`,
  `height_px`, `format_label?`, `is_archived`, timestamps.
- **Relaciones:** `template_slots` (CASCADE). Referida por `events.template_id`, `print_templates.photo_template_id`.
- **Reglas:** `list()` filtra `is_archived = 0`. `delete()` borra slots + fila + carpeta en disco y
  limpia referencia en eventos (Fase 11).
- **Archivos:** `TemplateService.ts`, `validateTemplate.ts`, `templates.handlers.ts`, `TemplatesScreen.tsx`, `TemplateEditor.tsx`.

### template_slots
- **Propósito:** recuadros dentro de una plantilla de foto.
- **Campos clave:** `id`, `template_id` (FK CASCADE), `slot_type` (photo/qr/text…), `slot_key`,
  `x,y,width,height` (px), `rotation`, `z_index`, `fit_mode` (def 'cover'), timestamps.
- **Reglas:** validación exige ≥2 slots de foto y placement dentro del lienzo (`validateTemplate.ts`).

### sessions
- **Propósito:** una sesión de fotos de un evento.
- **Campos clave:** `id`, `event_id` (FK), `template_id`, `photo_count`, `status` (def 'completed'),
  `final_output_path?`, `thumbnail_path?`, `notes?`, timestamps.
- **Relaciones:** `session_photos` (CASCADE), `session_outputs` (CASCADE).
- **Archivos:** `SessionService.ts`, `sessions.handlers.ts`, `SessionScreen.tsx`.

### session_photos
- **Propósito:** cada foto original capturada.
- **Campos clave:** `id`, `session_id` (FK CASCADE), `photo_index`, `original_path`, `processed_path?`,
  `width_px?`, `height_px?`, `created_at`. (Sin `updated_at`.)

### session_outputs
- **Propósito:** resultados compuestos (tira/postal/hoja/thumbnail).
- **Campos clave:** `id`, `session_id` (FK CASCADE), `output_type`, `file_path`, `width_px?`,
  `height_px?`, `format?`, `created_at`.

### print_jobs
- **Propósito:** historial/estado de impresiones (registro de cada envío).
- **Campos clave:** `id`, `event_id` (FK), `session_id?`, `print_sheet_path`, `printer_name?`,
  `paper_size?`, `copies`, `status` (def 'pending'), `error_code?`, `error_message?`, timestamps.
  Migración **002** añadió `method`, `layout`, `orientation`, `sheet_sessions`.
- **Reglas:** se guarda la hoja antes de imprimir; reimprimir crea un nuevo job.
- **Archivos:** `PrintService.ts`, `adapters.ts`, `print.handlers.ts`, `PrintScreen.tsx`.

### print_templates (plantillas de impresión — POR EVENTO) — migración 003
- **Propósito:** cómo se acomodan las tiras del evento en la hoja física.
- **Campos clave:** `id`, `event_id` (FK CASCADE), `name`, `photo_template_id?` (qué plantilla de foto
  usa), `paper_key` (def '4x6'), `orientation` (def 'portrait'), `mode` ('grid'|'custom'|'full', def
  'grid'), `cell_count` (def 2), timestamps.
- **Relaciones:** `print_template_slots` (CASCADE). Ligada a UN evento (no universal).
- **Archivos:** `PrintTemplateService.ts`, `printTemplates.handlers.ts`, `PrintTemplateEditor.tsx`,
  `shared/lib/printLayout.ts`.

### print_template_slots — migración 003
- **Propósito:** slots manuales (modo 'custom') de una plantilla de impresión.
- **Campos clave:** `id`, `print_template_id` (FK CASCADE), `x,y,width,height` **normalizados 0..1**,
  `rotation`, `z_index`. (Sin timestamps → manejada con SQL crudo en el servicio.)

### settings
- **Propósito:** clave/valor (incluye `active_event_id`, defaults, branding flags, licencia, y la
  conexión web: `web_site_url` + `web_api_key` — Fase 17).
- **Campos:** `key` (PK), `value`, `updated_at`. Acceso vía `SettingsRepository`/`SettingsService`.

### pose_packs / poses
- **Propósito:** packs de poses sugeridas por tipo de evento (seed inicial: 7 packs).
- **poses:** `id`, `pose_pack_id` (FK CASCADE), `text`, `display_order`, `is_active`, timestamps.

### qr_links
- **Propósito:** links QR por evento (opcional).
- **Campos clave:** `id`, `event_id?` (FK CASCADE), `label?`, `url`, `qr_image_path?`, `scope`
  (def 'event'), timestamps.
- **Archivos:** `QRService.ts`, `qr.handlers.ts`.

### videos — migración 004
- **Propósito:** clips grabados/importados por evento (archivos en events/event_x/videos/).
- **Campos:** id, event_id (FK CASCADE), file_path, source (recorded/imported), duration_ms?, size_bytes?, timestamps.
- **Archivos:** VideoService.ts, web.handlers.ts, VideosScreen.tsx.

### web_uploads — migración 004
- **Propósito:** cola/auditoría de publicaciones a la página web (folio + página + estado).
- **Campos:** id, event_id (FK CASCADE), session_id?, video_id?, media_type (photo/video), folio?, page_url?, media_url?, status (pending/done/failed), error_message?, timestamps.
- **Reglas:** idempotente por sesión/video (reuse de done salvo force); reintento por evento.
- **Archivos:** WebService.ts, WebScreen.tsx, SessionScreen.tsx.

### video_templates — migración 004
- **Propósito:** superposiciones de video (logo/texto) universales; config JSON (coords 0..1, 16:9).
- **Campos:** id, name, config_json, timestamps. events.video_template_id la referencia (se limpia al borrar).
- **Archivos:** VideoTemplateService.ts, VideoTemplateEditor.tsx, VideosScreen.tsx.

### schema_migrations
- Control interno del migrador (`version`, `name`, `applied_at`).

## Migraciones

| Versión | Nombre | Qué hace |
|---|---|---|
| 001 | initial_schema | 11 tablas base + índices |
| 002 | print_job_options | `print_jobs` += `method, layout, orientation, sheet_sessions` |
| 003 | print_templates | `print_templates` + `print_template_slots` (por evento, CASCADE) |
| 004 | videos_and_web | events += modos/web/folio/plantilla-video; tablas `videos`, `web_uploads`, `video_templates` |

## Reglas de negocio de datos

- Plantillas de foto **universales**; plantillas de impresión **por evento**.
- Evento activo = `settings.active_event_id`.
- Coords de `print_template_slots` normalizadas (independientes del papel/orientación).
- Borrados en CASCADE: slots de plantilla, fotos/outputs de sesión, slots y plantillas de impresión al
  borrar su evento, poses al borrar su pack, qr_links al borrar su evento.
- `FOREIGN KEY` requiere `PRAGMA foreign_keys = ON` (el driver de tests lo activa; verificar en
  producción si se depende del CASCADE de FK).
- Sesiones pasadas conservan sus imágenes aunque se borre la plantilla de foto (los outputs ya están
  en disco).
