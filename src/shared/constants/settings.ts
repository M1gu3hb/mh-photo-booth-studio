/**
 * Global settings stored as key/value rows in the `settings` table.
 * Each exposed setting must affect real behavior (see FLOW_COMPLETENESS):
 *  - soundEnabled        → session beep/shutter (Phase 5) + "test sound" now
 *  - fullscreenDefault   → applied to the window immediately + event-mode default
 *  - defaultCountdownSeconds → capture countdown (Phase 5)
 * `language` is persisted for the future but NOT exposed as a control yet
 * (the app is Spanish-only; a no-op selector would be an orphan — see DEC-013).
 */
export const SETTING_KEYS = {
  soundEnabled: 'sound_enabled',
  fullscreenDefault: 'fullscreen_default',
  defaultCountdownSeconds: 'default_countdown_seconds',
  language: 'language',
  cameraKind: 'camera_kind',
  cameraDeviceId: 'camera_device_id',
  cameraLabel: 'camera_label',
  brandingProductName: 'branding_product_name',
  brandingVenueName: 'branding_venue_name',
  brandingWelcomeText: 'branding_welcome_text',
  brandingThemeId: 'branding_theme_id',
  brandingLogoPath: 'branding_logo_path',
  licenseInstallationName: 'license_installation_name',
  licenseActivatedAt: 'license_activated_at',
  licenseEdition: 'license_edition',
  webSiteUrl: 'web_site_url',
  webApiKey: 'web_api_key'
} as const;

export const SETTINGS_DEFAULTS = {
  soundEnabled: true,
  fullscreenDefault: false,
  defaultCountdownSeconds: 3,
  language: 'es'
} as const;

export const COUNTDOWN_OPTIONS = [3, 5, 10] as const;
