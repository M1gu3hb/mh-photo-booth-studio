/** Migration 001 — full initial schema (docs/DATABASE_SCHEMA.md). */
export const MIGRATION_001_INITIAL_SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT,
  client_reference TEXT,
  template_id TEXT,
  default_photo_count INTEGER NOT NULL DEFAULT 3,
  default_copies INTEGER NOT NULL DEFAULT 1,
  qr_enabled INTEGER NOT NULL DEFAULT 0,
  qr_link TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image_slots',
  base_image_path TEXT,
  width_px INTEGER NOT NULL,
  height_px INTEGER NOT NULL,
  format_label TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_slots (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  rotation REAL NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  fit_mode TEXT NOT NULL DEFAULT 'cover',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  photo_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  final_output_path TEXT,
  thumbnail_path TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id)
);

CREATE TABLE IF NOT EXISTS session_photos (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  photo_index INTEGER NOT NULL,
  original_path TEXT NOT NULL,
  processed_path TEXT,
  width_px INTEGER,
  height_px INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS session_outputs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  output_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  width_px INTEGER,
  height_px INTEGER,
  format TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  session_id TEXT,
  print_sheet_path TEXT NOT NULL,
  printer_name TEXT,
  paper_size TEXT,
  copies INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pose_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS poses (
  id TEXT PRIMARY KEY,
  pose_pack_id TEXT NOT NULL,
  text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pose_pack_id) REFERENCES pose_packs (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qr_links (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  label TEXT,
  url TEXT NOT NULL,
  qr_image_path TEXT,
  scope TEXT NOT NULL DEFAULT 'event',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events (status);
CREATE INDEX IF NOT EXISTS idx_template_slots_template ON template_slots (template_id);
CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions (event_id);
CREATE INDEX IF NOT EXISTS idx_session_photos_session ON session_photos (session_id);
CREATE INDEX IF NOT EXISTS idx_session_outputs_session ON session_outputs (session_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_event ON print_jobs (event_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_session ON print_jobs (session_id);
CREATE INDEX IF NOT EXISTS idx_poses_pack ON poses (pose_pack_id);
CREATE INDEX IF NOT EXISTS idx_qr_links_event ON qr_links (event_id);
`;
