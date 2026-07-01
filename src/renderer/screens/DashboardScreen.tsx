import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Stepper, Button, Icon, StatusBadge, EmptyState, type IconName } from '@renderer/components/ui';
import { useBranding } from '@renderer/theme/ThemeProvider';
import { useEvents } from '@renderer/state/EventsProvider';
import { eventTypeLabel } from '@shared/constants/eventTypes';
import './screens.css';

const WORKFLOW = ['Evento', 'Plantilla', 'Sesión', 'Composición', 'Impresión'];

interface QuickLink {
  to: string;
  icon: IconName;
  title: string;
  desc: string;
}

const QUICK_LINKS: QuickLink[] = [
  { to: '/eventos', icon: 'events', title: 'Eventos', desc: 'Crea y selecciona el evento activo.' },
  { to: '/plantillas', icon: 'templates', title: 'Plantillas', desc: 'Importa diseños y marca los slots.' },
  { to: '/configuracion', icon: 'settings', title: 'Configuración', desc: 'Cámara, impresora y carpeta de datos.' },
  { to: '/diagnostico', icon: 'diagnostics', title: 'Diagnóstico', desc: 'Verifica todo antes del evento.' }
];

export function DashboardScreen() {
  const navigate = useNavigate();
  const branding = useBranding();
  const { activeEvent } = useEvents();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!activeEvent) {
      setReady(false);
      return;
    }
    void window.photoBooth.events.isReady(activeEvent.id).then((r) => {
      if (r.ok) setReady(r.data);
    });
  }, [activeEvent]);

  // CTAs enable once event + template exist; camera readiness is handled inside the
  // session/event screens (the "Iniciar" button there waits for the camera).
  const sessionBlockedReason = !activeEvent
    ? 'Selecciona un evento activo en Eventos.'
    : !activeEvent.templateId
      ? 'Asigna una plantilla al evento (en Plantillas).'
      : null;

  return (
    <div className="pb-dash">
      <Card elevated className="pb-dash__hero">
        <p className="pb-dash__welcome">{branding.welcomeText}</p>
        <h2 className="pb-dash__heroTitle">{branding.productName}</h2>
        <p className="pb-dash__heroText">
          Cabina fotográfica para eventos en {branding.venueName}. Prepara el evento, captura,
          compón e imprime al momento — todo sin depender de internet.
        </p>
      </Card>

      <Card title="Evento activo" icon="events">
        {activeEvent ? (
          <div className="pb-dash__active">
            <div className="pb-dash__activeHead">
              <div>
                <h3>{activeEvent.name}</h3>
                <span className="pb-dash__activeType">
                  <Icon name="events" size={15} /> {eventTypeLabel(activeEvent.eventType)}
                </span>
              </div>
              <div className="pb-dash__badges">
                <StatusBadge tone="success" icon="check">
                  Activo
                </StatusBadge>
                {ready && (
                  <StatusBadge tone="success" icon="success">
                    Listo
                  </StatusBadge>
                )}
              </div>
            </div>
            <dl className="pb-dash__activeMeta">
              <div>
                <dt>Fotos por sesión</dt>
                <dd>{activeEvent.defaultPhotoCount}</dd>
              </div>
              <div>
                <dt>Copias</dt>
                <dd>{activeEvent.defaultCopies}</dd>
              </div>
              <div>
                <dt>QR</dt>
                <dd>{activeEvent.qrEnabled ? 'Sí' : 'No'}</dd>
              </div>
            </dl>
            <div className="pb-dash__sessionCta">
              <Button
                size="lg"
                icon="session"
                disabled={sessionBlockedReason !== null}
                onClick={() => navigate('/sesion')}
              >
                Iniciar sesión
              </Button>
              <Button
                size="lg"
                variant="secondary"
                icon="fullscreen"
                disabled={sessionBlockedReason !== null}
                onClick={() => navigate('/evento')}
              >
                Modo evento (pantalla completa)
              </Button>
              {sessionBlockedReason && (
                <p className="pb-dash__blocked">
                  <Icon name="info" size={15} /> {sessionBlockedReason}
                </p>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            icon="events"
            title="Sin evento activo"
            description="Crea o selecciona un evento para empezar a operar la cabina."
            action={
              <Button icon="events" onClick={() => navigate('/eventos')}>
                Ir a Eventos
              </Button>
            }
          />
        )}
      </Card>

      <Card title="Flujo del evento" icon="session">
        <Stepper steps={WORKFLOW} current={activeEvent ? 1 : 0} />
        <p className="pb-dash__hint">
          Comienza preparando un evento y su plantilla. Cuando estén listos, la sesión de fotos
          quedará disponible.
        </p>
      </Card>

      <Card title="Accesos rápidos" icon="dashboard">
        <div className="pb-dash__grid">
          {QUICK_LINKS.map((link) => (
            <button key={link.to} type="button" className="pb-quick" onClick={() => navigate(link.to)}>
              <span className="pb-quick__icon">
                <Icon name={link.icon} size={24} />
              </span>
              <span className="pb-quick__title">{link.title}</span>
              <span className="pb-quick__desc">{link.desc}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
