import { IPC_CHANNELS } from '@shared/constants/ipc';
import type { LiveSessionState, LiveCommand } from '@shared/types/live';
import { handle } from './handle';
import {
  openPublicWindow,
  closePublicWindow,
  isPublicOpen,
  broadcastLive,
  rememberLiveState
} from '../publicWindow';

/** Public-display window control + the operator↔public live channel (Fase 14). */
export function registerLiveDisplayHandlers(): void {
  handle(IPC_CHANNELS.display.openPublic, 'app', (): { open: boolean } => {
    openPublicWindow();
    return { open: isPublicOpen() };
  });

  handle(IPC_CHANNELS.display.closePublic, 'app', (): { open: boolean } => {
    closePublicWindow();
    return { open: false };
  });

  handle(IPC_CHANNELS.display.isPublicOpen, 'app', (): { open: boolean } => ({ open: isPublicOpen() }));

  handle(IPC_CHANNELS.live.publishState, 'app', (state: unknown): { ok: true } => {
    rememberLiveState(state as LiveSessionState);
    broadcastLive(IPC_CHANNELS.live.stateChannel, state as LiveSessionState);
    return { ok: true };
  });

  handle(IPC_CHANNELS.live.sendCommand, 'app', (command: unknown): { ok: true } => {
    broadcastLive(IPC_CHANNELS.live.commandChannel, command as LiveCommand);
    return { ok: true };
  });
}
