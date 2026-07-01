/**
 * Migration 003 — print templates (Fase 13). A print template belongs to ONE
 * event (unlike photo templates, which are universal) and describes how the
 * event's strips are arranged on a physical sheet:
 *   - mode 'grid'  → auto-pack `cell_count` strips in the tightest rows×cols grid
 *   - mode 'custom'→ manual slots placed by the operator (normalized 0..1 coords)
 *   - mode 'full'  → a single strip filling the whole sheet
 * `photo_template_id` records which photo template the layout was designed for.
 * Slot coordinates are stored as fractions of the sheet (0..1) so they survive
 * paper-size and orientation changes.
 */
export const MIGRATION_003_PRINT_TEMPLATES = /* sql */ `
CREATE TABLE IF NOT EXISTS print_templates (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_template_id TEXT,
  paper_key TEXT NOT NULL DEFAULT '4x6',
  orientation TEXT NOT NULL DEFAULT 'portrait',
  mode TEXT NOT NULL DEFAULT 'grid',
  cell_count INTEGER NOT NULL DEFAULT 2,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS print_template_slots (
  id TEXT PRIMARY KEY,
  print_template_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  rotation REAL NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (print_template_id) REFERENCES print_templates (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_print_templates_event ON print_templates (event_id);
CREATE INDEX IF NOT EXISTS idx_print_template_slots_pt ON print_template_slots (print_template_id);
`;
