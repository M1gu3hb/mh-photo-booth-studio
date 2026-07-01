/**
 * Migration 004 — Videos mode + web publishing (Fase 17).
 *  - events: which capture modes the event offers (photos/videos), whether its
 *    media publishes to the web gallery, the event's master web folio, and the
 *    video overlay template it uses.
 *  - videos: recorded/imported clips per event (files under events/event_x/videos).
 *  - web_uploads: every publish attempt (photo final or video) with its folio,
 *    page URL and status — the offline-tolerant upload queue + audit trail.
 *  - video_templates: overlay designs (logo/text over the video) stored as JSON
 *    config; universal like photo templates.
 */
export const MIGRATION_004_VIDEOS_AND_WEB = /* sql */ `
ALTER TABLE events ADD COLUMN enable_photos INTEGER NOT NULL DEFAULT 1;
ALTER TABLE events ADD COLUMN enable_videos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN web_upload_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE events ADD COLUMN web_event_folio TEXT;
ALTER TABLE events ADD COLUMN video_template_id TEXT;

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'recorded',
  duration_ms INTEGER,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS web_uploads (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  session_id TEXT,
  video_id TEXT,
  media_type TEXT NOT NULL,
  folio TEXT,
  page_url TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS video_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{"items":[]}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_event ON videos (event_id);
CREATE INDEX IF NOT EXISTS idx_web_uploads_event ON web_uploads (event_id);
CREATE INDEX IF NOT EXISTS idx_web_uploads_status ON web_uploads (status);
`;
