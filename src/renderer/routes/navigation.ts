import { type IconName } from '@renderer/components/ui';

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
  { path: '/historial', label: 'Historial', icon: 'history' },
  { path: '/impresion', label: 'Impresión', icon: 'print' },
  { path: '/configuracion', label: 'Configuración', icon: 'settings' },
  { path: '/diagnostico', label: 'Diagnóstico', icon: 'diagnostics' }
];

/** Internal component gallery (design QA), grouped separately in the sidebar. */
export const GALLERY_ITEM: NavItem = {
  path: '/galeria-ui',
  label: 'Galería UI',
  icon: 'gallery'
};
