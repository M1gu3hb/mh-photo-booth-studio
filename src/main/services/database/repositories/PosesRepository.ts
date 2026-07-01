import { BaseRepository } from '../BaseRepository';
import type { Db } from '../types';
import type { PoseRecord } from '@shared/types/entities';

export type PoseCreate = Omit<PoseRecord, 'id' | 'createdAt' | 'updatedAt'>;

export class PosesRepository extends BaseRepository<PoseRecord, PoseCreate> {
  constructor(db: Db) {
    super(db, 'poses');
  }

  /** Ordered poses for a pack (active only by default). */
  listByPack(posePackId: string, onlyActive = true): PoseRecord[] {
    return this.list({
      where: onlyActive ? 'pose_pack_id = ? AND is_active = 1' : 'pose_pack_id = ?',
      params: [posePackId],
      orderBy: 'display_order ASC'
    });
  }
}
