import { SETTING_KEYS, SETTINGS_DEFAULTS } from '@shared/constants/settings';
import { DEFAULT_BRANDING, type BrandingConfig } from '@shared/constants/branding';
import type { UpdatableSettings } from '@shared/types/settings';
import type { CameraConfig, CameraKind } from '@shared/types/camera';
import type { LicenseStatus } from '@shared/types/license';
import type { SettingsRepository } from '../database/repositories';

type SettingValues = {
  soundEnabled: boolean;
  fullscreenDefault: boolean;
  defaultCountdownSeconds: number;
  language: string;
};

/** Reads/writes typed global settings on top of the key/value SettingsRepository. */
export class SettingsService {
  private readonly repo: SettingsRepository;

  constructor(repo: SettingsRepository) {
    this.repo = repo;
  }

  /** Writes default values for any setting that has never been set. */
  ensureDefaults(): void {
    if (this.repo.get(SETTING_KEYS.soundEnabled) === null) {
      this.repo.set(SETTING_KEYS.soundEnabled, SETTINGS_DEFAULTS.soundEnabled ? '1' : '0');
    }
    if (this.repo.get(SETTING_KEYS.fullscreenDefault) === null) {
      this.repo.set(SETTING_KEYS.fullscreenDefault, SETTINGS_DEFAULTS.fullscreenDefault ? '1' : '0');
    }
    if (this.repo.get(SETTING_KEYS.defaultCountdownSeconds) === null) {
      this.repo.set(SETTING_KEYS.defaultCountdownSeconds, String(SETTINGS_DEFAULTS.defaultCountdownSeconds));
    }
    if (this.repo.get(SETTING_KEYS.language) === null) {
      this.repo.set(SETTING_KEYS.language, SETTINGS_DEFAULTS.language);
    }
  }

  getValues(): SettingValues {
    return {
      soundEnabled: this.repo.get(SETTING_KEYS.soundEnabled) === '1',
      fullscreenDefault: this.repo.get(SETTING_KEYS.fullscreenDefault) === '1',
      defaultCountdownSeconds: this.parseCountdown(),
      language: this.repo.get(SETTING_KEYS.language) ?? SETTINGS_DEFAULTS.language
    };
  }

  update(partial: UpdatableSettings): void {
    if (partial.soundEnabled !== undefined) {
      this.repo.set(SETTING_KEYS.soundEnabled, partial.soundEnabled ? '1' : '0');
    }
    if (partial.fullscreenDefault !== undefined) {
      this.repo.set(SETTING_KEYS.fullscreenDefault, partial.fullscreenDefault ? '1' : '0');
    }
    if (partial.defaultCountdownSeconds !== undefined) {
      this.repo.set(SETTING_KEYS.defaultCountdownSeconds, String(partial.defaultCountdownSeconds));
    }
  }

  getCameraConfig(): CameraConfig {
    const kind = this.repo.get(SETTING_KEYS.cameraKind);
    return {
      kind: kind === 'mock' ? 'mock' : 'webcam',
      deviceId: this.repo.get(SETTING_KEYS.cameraDeviceId) || null,
      label: this.repo.get(SETTING_KEYS.cameraLabel) || null
    };
  }

  setCameraConfig(config: CameraConfig): void {
    const kind: CameraKind = config.kind === 'mock' ? 'mock' : 'webcam';
    this.repo.set(SETTING_KEYS.cameraKind, kind);
    this.repo.set(SETTING_KEYS.cameraDeviceId, config.deviceId ?? '');
    this.repo.set(SETTING_KEYS.cameraLabel, config.label ?? '');
  }

  getBranding(): BrandingConfig {
    return {
      productName: this.repo.get(SETTING_KEYS.brandingProductName) || DEFAULT_BRANDING.productName,
      venueName: this.repo.get(SETTING_KEYS.brandingVenueName) || DEFAULT_BRANDING.venueName,
      welcomeText: this.repo.get(SETTING_KEYS.brandingWelcomeText) || DEFAULT_BRANDING.welcomeText,
      themeId: this.repo.get(SETTING_KEYS.brandingThemeId) || DEFAULT_BRANDING.themeId,
      logoPath: this.repo.get(SETTING_KEYS.brandingLogoPath) || null
    };
  }

  setBranding(partial: Partial<BrandingConfig>): BrandingConfig {
    if (partial.productName !== undefined) this.repo.set(SETTING_KEYS.brandingProductName, partial.productName.trim());
    if (partial.venueName !== undefined) this.repo.set(SETTING_KEYS.brandingVenueName, partial.venueName.trim());
    if (partial.welcomeText !== undefined) this.repo.set(SETTING_KEYS.brandingWelcomeText, partial.welcomeText.trim());
    if (partial.themeId !== undefined) this.repo.set(SETTING_KEYS.brandingThemeId, partial.themeId);
    if (partial.logoPath !== undefined) this.repo.set(SETTING_KEYS.brandingLogoPath, partial.logoPath ?? '');
    return this.getBranding();
  }

  /** Ensures a local, non-blocking license record exists (informational only). */
  ensureLicense(): void {
    if (this.repo.get(SETTING_KEYS.licenseActivatedAt) === null) {
      this.repo.set(SETTING_KEYS.licenseInstallationName, DEFAULT_BRANDING.venueName);
      this.repo.set(SETTING_KEYS.licenseActivatedAt, new Date().toISOString());
      this.repo.set(SETTING_KEYS.licenseEdition, 'standard');
    }
  }

  getLicense(): LicenseStatus {
    return {
      installationName: this.repo.get(SETTING_KEYS.licenseInstallationName) || DEFAULT_BRANDING.venueName,
      activatedAt: this.repo.get(SETTING_KEYS.licenseActivatedAt) || new Date().toISOString(),
      edition: this.repo.get(SETTING_KEYS.licenseEdition) || 'standard',
      blocking: false
    };
  }

  private parseCountdown(): number {
    const raw = this.repo.get(SETTING_KEYS.defaultCountdownSeconds);
    const parsed = raw ? Number.parseInt(raw, 10) : SETTINGS_DEFAULTS.defaultCountdownSeconds;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : SETTINGS_DEFAULTS.defaultCountdownSeconds;
  }
}
