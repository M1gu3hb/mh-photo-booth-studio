import type {
  PrintTemplateRecord,
  PrintTemplateSlotRecord,
  PrintTemplateMode
} from './entities';

/** A manual slot in normalized 0..1 sheet coordinates. */
export interface PrintTemplateSlotInput {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface PrintTemplateWithSlots {
  template: PrintTemplateRecord;
  slots: PrintTemplateSlotRecord[];
}

/** Fields chosen when creating a print template (before slot editing). */
export interface PrintTemplateCreateInput {
  name: string;
  photoTemplateId: string | null;
  paperKey: string;
  orientation: 'portrait' | 'landscape';
  mode: PrintTemplateMode;
  cellCount: number;
}

/** Full save payload (record fields + custom slots). */
export interface PrintTemplateSavePayload extends PrintTemplateCreateInput {
  slots: PrintTemplateSlotInput[];
}
