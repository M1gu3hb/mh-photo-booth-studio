# PHASE_02_DATA_SETTINGS.md — Capa de Datos (SQLite) & Settings

## Objetivo
Persistencia local sólida (offline-first) y configuración global funcional.

## Depende de
Fases 0-1. Lee antes: `docs/DATABASE_SCHEMA.md`, `docs/FILE_STORAGE.md`,
`docs/OFFLINE_MODE.md`, `docs/POSE_SYSTEM.md`.

## En alcance
- Integrar **SQLite** (better-sqlite3 en el main process; el renderer accede solo por IPC).
- **Migraciones versionadas** (`migrations/001_initial_schema.sql`) creando TODAS las
  tablas de `docs/DATABASE_SCHEMA.md`: `events`, `templates`, `template_slots`,
  `sessions`, `session_photos`, `session_outputs`, `print_jobs`, `settings`, `pose_packs`,
  `poses`, `qr_links`. IDs tipo UUID/CUID; `created_at`/`updated_at` en todo.
- **Runner de migraciones** idempotente al iniciar (registra versión de schema).
- **Capa de repositorios** tipados por tabla (CRUD base) en `main/services/database`.
- **StorageService**: data root configurable + estructura de `docs/FILE_STORAGE.md`
  (`database/`, `templates/`, `events/`, `logs/`, `backups/`), creación de carpetas,
  **escritura segura** (temp → verificar tamaño → rename → registrar).
- **SettingsService** + IPC: data root, idioma inicial, pantalla completa, sonido,
  countdown por defecto. Persisten en `settings`.
- **Seed** de `pose_packs` + `poses` por defecto (XV, boda, bautizo, graduación, empresa,
  fiesta, general) de `docs/POSE_SYSTEM.md`.
- Pantalla **Configuración** funcional (lee/escribe settings reales).

## Fuera de alcance
Lógica de eventos/plantillas/etc. (sus fases). Branding editable (Fase 10).

## Datos & IPC
Todas las tablas creadas. IPC: `settings.get/set`, `storage.getDataRoot/setDataRoot`,
`db.migrate/status`. Validar inputs en IPC.

## Pantallas / Componentes
Configuración (data root con selector de carpeta real, toggles de sonido/fullscreen,
selector de idioma, countdown por defecto). Todo persistente.

## Notas de diseño
Formularios skeuo legibles; feedback con Toast al guardar; estados claros.

## Flujo completo (anti-huérfano)
- Cambiar **data root** mueve realmente dónde se guardará todo y se refleja en Diagnóstico (Fase 8).
- Cada toggle/select de Configuración **persiste** y luego **afecta** comportamiento real
  (sonido→sesión; fullscreen→modo evento; countdown→captura). Si una preferencia no
  afecta nada todavía, no la expongas aún.
- Las poses sembradas se usarán en la sesión (Fase 5): verifica que existan.

## Skills
`full-output-enforcement`, `review`.

## Criterio de salida (checklist)
- [ ] DB se crea en el data root; migración corre 2 veces sin romper (idempotente).
- [ ] Las 11 tablas existen con sus campos.
- [ ] Repos con tests unitarios verdes.
- [ ] Settings se leen/escriben y **persisten tras reiniciar**.
- [ ] Data root cambiable; estructura de carpetas creada.
- [ ] Pose packs sembrados.

## Audit Gate 2
Tests de repos + idempotencia de migración + rutas relativas + persistencia verificada.
Registrar en `AUDIT_LOG.md`.
