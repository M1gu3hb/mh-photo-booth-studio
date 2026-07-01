import { registerAppHandlers } from './app.handlers';
import { registerSettingsHandlers } from './settings.handlers';
import { registerStorageHandlers } from './storage.handlers';
import { registerEventHandlers } from './events.handlers';
import { registerTemplateHandlers } from './templates.handlers';
import { registerPrintTemplateHandlers } from './printTemplates.handlers';
import { registerSessionHandlers } from './sessions.handlers';
import { registerPrintHandlers } from './print.handlers';
import { registerHistoryHandlers } from './history.handlers';
import { registerBrandingHandlers } from './branding.handlers';
import { registerLiveDisplayHandlers } from './liveDisplay.handlers';

/**
 * Single entry point that wires every IPC area.
 */
export function registerIpcHandlers(): void {
  registerAppHandlers();
  registerSettingsHandlers();
  registerStorageHandlers();
  registerEventHandlers();
  registerTemplateHandlers();
  registerPrintTemplateHandlers();
  registerSessionHandlers();
  registerPrintHandlers();
  registerHistoryHandlers();
  registerBrandingHandlers();
  registerLiveDisplayHandlers();
}
