import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, StatusBadge, Icon } from '@renderer/components/ui';
import { useBranding } from '@renderer/theme/ThemeProvider';
import { useEvents } from '@renderer/state/EventsProvider';
import { SessionScreen } from './SessionScreen';
import './eventmode.css';

/**
 * Fullscreen event experience for non-technical operators. Lives OUTSIDE the
 * admin shell (no sidebar) so guests never see admin controls. Exiting requires
 * an explicit confirmation (config lock) and restores windowed mode.
 */
export function EventModeScreen() {
  const navigate = useNavigate();
  const branding = useBranding();
  const { activeEvent } = useEvents();
  const [confirmExit, setConfirmExit] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    void window.photoBooth.app.setFullscreen(true);
    // Entering event mode opens the guest-facing public view (second monitor).
    void window.photoBooth.display.openPublic();
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  async function exit() {
    await window.photoBooth.app.setFullscreen(false);
    await window.photoBooth.display.closePublic();
    navigate('/');
  }

  return (
    <div className="pb-eventmode">
      <header className="pb-eventmode__bar">
        <div className="pb-eventmode__brand">
          <span className="pb-eventmode__mark" aria-hidden>
            <Icon name="session" size={22} />
          </span>
          <div>
            <strong>{branding.venueName}</strong>
            {activeEvent && <small>{activeEvent.name}</small>}
          </div>
        </div>
        <div className="pb-eventmode__right">
          {!online && (
            <StatusBadge tone="info" icon="info">
              Sin conexión (no es necesaria)
            </StatusBadge>
          )}
          <Button variant="secondary" icon="power" onClick={() => setConfirmExit(true)}>
            Salir del modo evento
          </Button>
        </div>
      </header>

      <div className="pb-eventmode__stage">
        <SessionScreen />
      </div>

      <Modal
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        title="¿Salir del modo evento?"
        size="sm"
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmExit(false)}>
              Seguir en el evento
            </Button>
            <Button variant="danger" icon="power" onClick={() => void exit()}>
              Salir
            </Button>
          </>
        }
      >
        <p>
          Saldrás de la pantalla completa y volverás al panel de administración. Las fotos y
          sesiones ya están guardadas.
        </p>
      </Modal>
    </div>
  );
}
