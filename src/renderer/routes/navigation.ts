import { type IconName } from '@renderer/components/ui';
import type { EventRecord } from '@shared/types/entities';

export interface NavItem {
  path: string;
  label: string;
  icon: IconName;
}

/** Primary navigation — every item routes to a real screen (no decorative links). */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/eventos', label: 'Eventos', icon: 'events' },
  { path: '/plantillas', label: 'Plantillas', icon: 'templates' },
  { path: '/sesion', label: 'Sesión', icon: 'session' },
  { path: '/videos', label: 'Videos', icon: 'video' },
  { path: '/historial', label: 'Historial', icon: 'history' },
  { path: '/impresion', label: 'Impresión', icon: 'print' },
  { path: '/web', label: 'Página web', icon: 'web' },
  { path: '/configuracion', label: 'Configuración', icon: 'settings' },
  { path: '/diagnostico', label: 'Diagnóstico', icon: 'diagnostics' }
];

/**
 * Navigation filtered by the active event's capture modes (Fase 17): photo-only
 * events hide Videos; video-only events hide Sesión/Impresión. With no active
 * event everything shows (setup time).
 */
export function navItemsForEvent(activeEvent: EventRecord | null): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!activeEvent) return true;
    if ((item.path === '/sesion' || item.path === '/impresion') && !activeEvent.enablePhotos) {
      return false;
    }
    if (item.path === '/videos' && !activeEvent.enableVideos) {
      return false;
    }
    return true;
  });
}

/** Internal component gallery (design QA), grouped separately in the sidebar. */
export const GALLERY_ITEM: NavItem = {
  path: '/galeria-ui',
  label: 'Galería UI',
  icon: 'gallery'
};
