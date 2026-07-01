import { AppError } from '@shared/errors/appError';
import type { VideoTemplateRecord } from '@shared/types/entities';
import type { VideoTemplateInput } from '@shared/types/videoTemplates';
import type { Repositories } from '../database/repositories';

function vtError(userMessage: string, action: string): AppError {
  return new AppError({
    code: 'VIDEO_TEMPLATE_ERROR',
    message: userMessage,
    userMessage,
    action,
    severity: 'medium',
    module: 'template'
  });
}

/**
 * Video overlay templates (Fase 17): universal designs (logo/text over the
 * video frame) stored as JSON config. Referenced by events.video_template_id
 * and burned into recordings by the renderer's canvas pipeline.
 */
export class VideoTemplateService {
  private readonly repos: Repositories;

  constructor(repos: Repositories) {
    this.repos = repos;
  }

  list(): VideoTemplateRecord[] {
    return this.repos.videoTemplates.list({ orderBy: 'updated_at DESC' });
  }

  get(id: string): VideoTemplateRecord {
    const record = this.repos.videoTemplates.getById(id);
    if (!record) throw vtError('La plantilla de video ya no existe.', 'Actualiza la lista.');
    return record;
  }

  create(input: VideoTemplateInput): VideoTemplateRecord {
    return this.repos.videoTemplates.create({
      name: input.name.trim().slice(0, 90) || 'Plantilla de video',
      configJson: JSON.stringify(input.config ?? { items: [] })
    });
  }

  save(id: string, input: VideoTemplateInput): VideoTemplateRecord {
    this.get(id);
    return this.repos.videoTemplates.update(id, {
      name: input.name.trim().slice(0, 90) || 'Plantilla de video',
      configJson: JSON.stringify(input.config ?? { items: [] })
    });
  }

  /** Deletes the template and clears the reference from events using it. */
  delete(id: string, db: { prepare(sql: string): { run(...p: unknown[]): unknown } }): void {
    db.prepare('UPDATE events SET video_template_id = NULL WHERE video_template_id = ?').run(id);
    this.repos.videoTemplates.delete(id);
  }
}
