import type { Migration } from '../types';
import { MIGRATION_001_INITIAL_SCHEMA } from './001_initial_schema';
import { MIGRATION_002_PRINT_JOB_OPTIONS } from './002_print_job_options';
import { MIGRATION_003_PRINT_TEMPLATES } from './003_print_templates';

/**
 * Ordered migration list. Migrations are embedded as TS strings (not loose .sql
 * files) so they ship reliably inside the packaged asar and need no runtime
 * file resolution (DEC-014). Add new versioned entries here, never edit applied ones.
 */
export const MIGRATIONS: Migration[] = [
  { version: 1, name: 'initial_schema', sql: MIGRATION_001_INITIAL_SCHEMA },
  { version: 2, name: 'print_job_options', sql: MIGRATION_002_PRINT_JOB_OPTIONS },
  { version: 3, name: 'print_templates', sql: MIGRATION_003_PRINT_TEMPLATES }
];
