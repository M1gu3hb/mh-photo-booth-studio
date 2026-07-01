import { BaseRepository } from '../BaseRepository';
import type { Db } from '../types';
import type { PosePackRecord } from '@shared/types/entities';

export type PosePackCreate = Omit<PosePackRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class PosePacksRepository extends BaseRepository<PosePackRecord, PosePackCreate> {
  constructor(db: Db) {
    super(db, 'pose_packs');
  }

  /** Best pack for an event type, preferring a default within that type. */
  findByEventType(eventType: string): PosePackRecord | null {
    return (
      this.list({
        where: 'event_type = ?',
        params: [eventType],
        orderBy: 'is_default DESC',
        limit: 1
      })[0] ?? null
    );
  }

  findDefault(): PosePackRecord | null {
    return this.list({ where: 'is_default = 1', limit: 1 })[0] ?? null;
  }
}
