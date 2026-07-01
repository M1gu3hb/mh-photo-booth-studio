import type { TemplateSlotInput, TemplateValidation } from '@shared/types/templates';

/** Rounding tolerance (px) for "inside the canvas" checks. */
const EDGE_TOLERANCE = 1;
const MIN_PHOTO_SLOTS = 2;

/**
 * Validates a template before it can be saved or used (docs/TEMPLATE_EDITOR §Validaciones).
 * Pure function — unit tested directly.
 */
export function validateTemplate(
  name: string,
  widthPx: number,
  heightPx: number,
  slots: TemplateSlotInput[]
): TemplateValidation {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('El nombre de la plantilla es obligatorio.');
  }
  if (!(widthPx > 0) || !(heightPx > 0)) {
    errors.push('Las dimensiones de la plantilla no son válidas.');
  }

  const photoSlots = slots.filter((s) => s.slotType === 'photo');
  if (photoSlots.length < MIN_PHOTO_SLOTS) {
    errors.push(`La plantilla necesita al menos ${MIN_PHOTO_SLOTS} espacios de foto.`);
  }

  const seenKeys = new Set<string>();
  for (const slot of slots) {
    if (!slot.slotKey || slot.slotKey.trim().length === 0) {
      errors.push('Hay un slot sin clave.');
    } else if (seenKeys.has(slot.slotKey)) {
      errors.push(`Clave de slot duplicada: ${slot.slotKey}.`);
    }
    seenKeys.add(slot.slotKey);

    if (slot.width <= 0 || slot.height <= 0) {
      errors.push(`El slot "${slot.slotKey}" tiene tamaño inválido.`);
    }
    if (
      slot.x < -EDGE_TOLERANCE ||
      slot.y < -EDGE_TOLERANCE ||
      slot.x + slot.width > widthPx + EDGE_TOLERANCE ||
      slot.y + slot.height > heightPx + EDGE_TOLERANCE
    ) {
      errors.push(`El slot "${slot.slotKey}" está fuera del lienzo.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
