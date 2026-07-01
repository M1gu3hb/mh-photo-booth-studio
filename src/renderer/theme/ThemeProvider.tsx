import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { DEFAULT_BRANDING, type BrandingConfig } from '@shared/constants/branding';

interface ThemeContextValue {
  branding: BrandingConfig;
  setBranding: (partial: Partial<BrandingConfig>) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Applies the active theme + branding. Branding (product/venue/welcome/logo) is
 * loaded from settings over IPC so it is fully configurable (DEC-010) while the
 * Jardines "emerald-gold" token set remains the default. Colors/fonts live in
 * CSS variables keyed by `data-theme`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState<BrandingConfig>(DEFAULT_BRANDING);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', branding.themeId);
  }, [branding.themeId]);

  const refresh = useCallback(async () => {
    const result = await window.photoBooth.branding.get();
    if (result.ok) setBrandingState(result.data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setBranding = useCallback(async (partial: Partial<BrandingConfig>): Promise<boolean> => {
    const result = await window.photoBooth.branding.set(partial);
    if (result.ok) {
      setBrandingState(result.data);
      return true;
    }
    return false;
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ branding, setBranding, refresh }),
    [branding, setBranding, refresh]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export function useBranding(): BrandingConfig {
  return useTheme().branding;
}
