import type { TemplateRecord, TemplateSlotRecord, TemplateSlotType, FitMode } from '@shared/types/entities';

/** A slot as edited in the renderer (no id/timestamps — assigned on save). */
export interface TemplateSlotInput {
  slotType: TemplateSlotType;
  slotKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  fitMode: FitMode;
}

/** Payload sent when saving a template (metadata + full slot set). */
export interface TemplateSavePayload {
  name: string;
  formatLabel: string | null;
  slots: TemplateSlotInput[];
}

export interface TemplateWithSlots {
  template: TemplateRecord;
  slots: TemplateSlotRecord[];
}

/** Result of validating a template before save/use. */
export interface TemplateValidation {
  valid: boolean;
  errors: string[];
}
