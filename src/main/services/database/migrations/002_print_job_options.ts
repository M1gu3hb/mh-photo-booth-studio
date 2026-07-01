/**
 * Migration 002 — record every chosen print option on the job (anti-orphan):
 * method/adapter, sheet layout, orientation, and which sessions a multi-session
 * sheet contains. `paper_size` already exists from 001.
 */
export const MIGRATION_002_PRINT_JOB_OPTIONS = /* sql */ `
ALTER TABLE print_jobs ADD COLUMN method TEXT;
ALTER TABLE print_jobs ADD COLUMN layout TEXT;
ALTER TABLE print_jobs ADD COLUMN orientation TEXT;
ALTER TABLE print_jobs ADD COLUMN sheet_sessions TEXT;
`;
