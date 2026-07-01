import type { SessionRecord } from '@shared/types/entities';

/** Everything the capture UI needs after starting a session. */
export interface SessionStartResult {
  session: SessionRecord;
  /** Pose suggestions resolved from the event type's pose pack (in order). */
  poses: string[];
  photoCount: number;
}
