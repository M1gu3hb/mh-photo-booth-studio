import type { Db } from './types';
import type { Repositories } from './repositories';

interface SeedPack {
  name: string;
  eventType: string | null;
  isDefault: boolean;
  poses: string[];
}

/**
 * Default pose packs from docs/POSE_SYSTEM.md. Consumed by the capture session
 * (Phase 5) — the General pack is the fallback when an event type has no pack.
 */
const SEED_PACKS: SeedPack[] = [
  {
    name: 'General',
    eventType: null,
    isDefault: true,
    poses: ['Prepárense', 'Sonrían', 'Ahora una pose divertida', 'Todos juntos', 'Última foto']
  },
  {
    name: 'XV años',
    eventType: 'xv',
    isDefault: false,
    poses: [
      'La festejada al centro',
      'Todos sonrían',
      'Pose elegante',
      'Pose divertida',
      'Manos arriba',
      'Abrazo grupal'
    ]
  },
  {
    name: 'Boda',
    eventType: 'boda',
    isDefault: false,
    poses: [
      'Novios al centro',
      'Todos mirando a cámara',
      'Brindis imaginario',
      'Pose elegante',
      'Pose divertida',
      'Abrazo grupal'
    ]
  },
  {
    name: 'Bautizo',
    eventType: 'bautizo',
    isDefault: false,
    poses: ['Familia unida', 'Todos sonrían', 'Pose tierna', 'Miren a la cámara', 'Abrazo grupal']
  },
  {
    name: 'Graduación',
    eventType: 'graduacion',
    isDefault: false,
    poses: ['Levanten el diploma', 'Sonrisa de orgullo', 'Pose divertida', 'Todos juntos', 'Birrete arriba']
  },
  {
    name: 'Evento empresarial',
    eventType: 'empresa',
    isDefault: false,
    poses: ['Foto formal', 'Todos sonriendo', 'Pulgares arriba', 'Equipo completo', 'Pose divertida']
  },
  {
    name: 'Fiesta privada',
    eventType: 'fiesta',
    isDefault: false,
    poses: ['¡A divertirse!', 'Sonrían', 'Pose divertida', 'Todos juntos', 'Última foto']
  }
];

/** Idempotent: seeds default pose packs only when none exist yet. */
export function seedPosePacks(db: Db, repos: Repositories): boolean {
  if (repos.posePacks.count() > 0) {
    return false;
  }

  db.transaction(() => {
    for (const pack of SEED_PACKS) {
      const created = repos.posePacks.create({
        name: pack.name,
        eventType: pack.eventType,
        isDefault: pack.isDefault ? 1 : 0
      });
      pack.poses.forEach((text, index) => {
        repos.poses.create({
          posePackId: created.id,
          text,
          displayOrder: index,
          isActive: 1
        });
      });
    }
  });

  return true;
}
