/**
 * Video overlay template config (Fase 17). Coordinates are normalized 0..1
 * relative to a 16:9 video frame so overlays scale with any resolution.
 * Images are embedded as data URLs (logos are small) so templates are
 * self-contained and export/import cleanly.
 */

export interface VideoOverlayImage {
  kind: 'image';
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

export type OverlayFont = 'display' | 'script' | 'ui';

export interface VideoOverlayText {
  kind: 'text';
  id: string;
  text: string;
  x: number;
  y: number;
  /** Font size as fraction of frame height (e.g. 0.08). */
  size: number;
  font: OverlayFont;
  color: string;
  opacity: number;
}

export type VideoOverlayItem = VideoOverlayImage | VideoOverlayText;

export interface VideoTemplateConfig {
  items: VideoOverlayItem[];
}

export interface VideoTemplateInput {
  name: string;
  config: VideoTemplateConfig;
}

export function parseVideoTemplateConfig(json: string): VideoTemplateConfig {
  try {
    const parsed = JSON.parse(json) as VideoTemplateConfig;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}
