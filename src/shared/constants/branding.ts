/**
 * Default branding. Commercial names are NOT hardcoded in components (see DEC-010);
 * the UI reads branding from here (and from the `settings` table once Phase 2 lands).
 * Re-skinning to another client = changing tokens + this config, never component code.
 */
export interface BrandingConfig {
  /** Visible product name (window title, splash, headers). */
  productName: string;
  /** Venue / first deployment label. */
  venueName: string;
  /** Guest-facing welcome line. */
  welcomeText: string;
  /** Relative path (under data root) to a custom logo, or null for the default mark. */
  logoPath: string | null;
  /** Theme token set id. */
  themeId: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  productName: 'MH Photo Booth Studio',
  venueName: 'Jardines Club Hípico',
  welcomeText: '¡Bienvenidos!',
  logoPath: null,
  themeId: 'emerald-gold'
};
