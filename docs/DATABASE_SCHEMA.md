# DATABASE_SCHEMA.md — Esquema de Base de Datos

## Base de datos

SQLite local.

La base guarda metadatos. Los archivos pesados se guardan en disco.

---

## Tablas principales

### events

Eventos creados.

Campos sugeridos:

```txt
id TEXT PRIMARY KEY
name TEXT NOT NULL
event_type TEXT NOT NULL
event_date TEXT
client_reference TEXT
template_id TEXT
default_photo_count INTEGER DEFAULT 3
default_copies INTEGER DEFAULT 1
qr_enabled INTEGER DEFAULT 0
qr_link TEXT
status TEXT DEFAULT 'active'
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### templates

Plantillas disponibles.

```txt
id TEXT PRIMARY KEY
name TEXT NOT NULL
type TEXT DEFAULT 'image_slots'
base_image_path TEXT
width_px INTEGER NOT NULL
height_px INTEGER NOT NULL
format_label TEXT
is_archived INTEGER DEFAULT 0
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### template_slots

Slots de una plantilla.

```txt
id TEXT PRIMARY KEY
template_id TEXT NOT NULL
slot_type TEXT NOT NULL
slot_key TEXT NOT NULL
x REAL NOT NULL
y REAL NOT NULL
width REAL NOT NULL
height REAL NOT NULL
rotation REAL DEFAULT 0
z_index INTEGER DEFAULT 0
fit_mode TEXT DEFAULT 'cover'
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

`slot_type` puede ser:
- photo
- qr
- text
- logo
- decoration

---

### sessions

Sesiones fotográficas realizadas.

```txt
id TEXT PRIMARY KEY
event_id TEXT NOT NULL
template_id TEXT NOT NULL
photo_count INTEGER NOT NULL
status TEXT DEFAULT 'completed'
final_output_path TEXT
thumbnail_path TEXT
notes TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### session_photos

Fotos originales de una sesión.

```txt
id TEXT PRIMARY KEY
session_id TEXT NOT NULL
photo_index INTEGER NOT NULL
original_path TEXT NOT NULL
processed_path TEXT
width_px INTEGER
height_px INTEGER
created_at TEXT NOT NULL
```

---

### session_outputs

Resultados generados.

```txt
id TEXT PRIMARY KEY
session_id TEXT NOT NULL
output_type TEXT NOT NULL
file_path TEXT NOT NULL
width_px INTEGER
height_px INTEGER
format TEXT
created_at TEXT NOT NULL
```

`output_type` puede ser:
- strip
- postcard
- print_sheet
- thumbnail

---

### print_jobs

Trabajos de impresión.

```txt
id TEXT PRIMARY KEY
event_id TEXT NOT NULL
session_id TEXT
print_sheet_path TEXT NOT NULL
printer_name TEXT
paper_size TEXT
copies INTEGER DEFAULT 1
status TEXT DEFAULT 'pending'
error_code TEXT
error_message TEXT
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### settings

Configuración global.

```txt
key TEXT PRIMARY KEY
value TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### pose_packs

Paquetes de poses.

```txt
id TEXT PRIMARY KEY
name TEXT NOT NULL
event_type TEXT
is_default INTEGER DEFAULT 0
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### poses

Pose individual.

```txt
id TEXT PRIMARY KEY
pose_pack_id TEXT NOT NULL
text TEXT NOT NULL
display_order INTEGER DEFAULT 0
is_active INTEGER DEFAULT 1
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

---

### qr_links

QRs configurados.

```txt
id TEXT PRIMARY KEY
event_id TEXT
label TEXT
url TEXT NOT NULL
qr_image_path TEXT
scope TEXT DEFAULT 'event'
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

`scope` puede ser:
- event
- session
- global

---

## Migraciones

Usar migraciones versionadas:

```txt
migrations/
  001_initial_schema.sql
  002_add_print_jobs.sql
  003_add_pose_packs.sql
```

---

## Reglas

- Todos los registros importantes deben tener `created_at` y `updated_at`.
- Usar IDs tipo UUID o CUID.
- No guardar imágenes pesadas como blobs.
- Guardar rutas relativas al data root cuando sea posible.
- Preparar migraciones para cambios futuros.
- No borrar físicamente sin confirmación; preferir archivar.
