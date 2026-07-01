import { useState } from 'react';
import {
  Card,
  Button,
  Modal,
  EmptyState,
  ErrorState,
  StatusBadge,
  Icon,
  useToast
} from '@renderer/components/ui';
import { EventForm } from '@renderer/components/events/EventForm';
import { useEvents } from '@renderer/state/EventsProvider';
import { eventTypeLabel } from '@shared/constants/eventTypes';
import type { EventRecord } from '@shared/types/entities';
import '@renderer/components/events/events.css';

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; event: EventRecord };

function formatDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-MX', { dateStyle: 'long' });
}

export function EventsScreen() {
  const { events, activeEvent, loading, error, createEvent, updateEvent, archiveEvent, setActiveEvent, refresh } =
    useEvents();
  const { notify } = useToast();
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [archiveTarget, setArchiveTarget] = useState<EventRecord | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleExport(event: EventRecord) {
    const res = await window.photoBooth.backup.exportEvent(event.id);
    if (res.ok && res.data) notify({ tone: 'success', title: 'Evento exportado', message: res.data });
    else if (!res.ok) notify({ tone: 'danger', title: 'No se pudo exportar', message: res.error.userMessage });
  }

  async function handleImport() {
    setBusy(true);
    const res = await window.photoBooth.backup.importEvent();
    setBusy(false);
    if (res.ok && res.data) {
      notify({ tone: 'success', title: 'Evento importado', message: res.data.name });
      await refresh();
    } else if (!res.ok) {
      notify({ tone: 'danger', title: 'No se pudo importar', message: res.error.userMessage });
    }
  }

  async function handleSetActive(event: EventRecord) {
    const result = await setActiveEvent(event.id);
    if (result.ok) notify({ tone: 'success', title: 'Evento activo', message: event.name });
    else notify({ tone: 'danger', title: 'No se pudo activar', message: result.error?.userMessage });
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    const result = await archiveEvent(archiveTarget.id);
    if (result.ok) notify({ tone: 'success', title: 'Evento archivado', message: archiveTarget.name });
    else notify({ tone: 'danger', title: 'No se pudo archivar', message: result.error?.userMessage });
    setArchiveTarget(null);
  }

  const submitForm = async (input: Parameters<typeof createEvent>[0]) => {
    const result =
      form.mode === 'edit' ? await updateEvent(form.event.id, input) : await createEvent(input);
    // Fase 17: si el evento publica a la web, crear su folio maestro (best-effort).
    if (result.ok && input.webUploadEnabled && !result.data.webEventFolio) {
      const folio = await window.photoBooth.web.ensureEventFolio(result.data.id);
      if (folio.ok) {
        notify({ tone: 'success', title: 'Folio del evento creado', message: folio.data.eventFolio });
        void refresh();
      } else {
        notify({ tone: 'warning', title: 'Folio pendiente', message: folio.error.userMessage });
      }
    }
    return result;
  };

  let body;
  if (loading) {
    body = (
      <Card>
        <EmptyState icon="events" title="Cargando eventos…" />
      </Card>
    );
  } else if (error && events.length === 0) {
    body = (
      <Card>
        <ErrorState userMessage={error} action="Verifica la carpeta de datos." />
      </Card>
    );
  } else if (events.length === 0) {
    body = (
      <Card>
        <EmptyState
          icon="events"
          title="Aún no hay eventos"
          description="Crea tu primer evento para comenzar: nombre, tipo, fotos por sesión, copias y QR."
          action={
            <Button icon="add" onClick={() => setForm({ mode: 'create' })}>
              Crear primer evento
            </Button>
          }
        />
      </Card>
    );
  } else {
    body = (
      <div className="pb-events__grid">
        {events.map((event) => {
          const isActive = activeEvent?.id === event.id;
          return (
            <Card key={event.id} className={`pb-eventcard ${isActive ? 'pb-eventcard--active' : ''}`.trim()}>
              <div className="pb-eventcard__head">
                <h3>{event.name}</h3>
                {isActive && <StatusBadge tone="success" icon="check">Activo</StatusBadge>}
              </div>
              <div className="pb-eventcard__type">
                <Icon name="events" size={16} />
                <span>{eventTypeLabel(event.eventType)}</span>
              </div>
              <dl className="pb-eventcard__meta">
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatDate(event.eventDate)}</dd>
                </div>
                <div>
                  <dt>Sesión</dt>
                  <dd>
                    {event.defaultPhotoCount} fotos · {event.defaultCopies}{' '}
                    {event.defaultCopies === 1 ? 'copia' : 'copias'}
                  </dd>
                </div>
                <div>
                  <dt>QR</dt>
                  <dd>{event.qrEnabled ? 'Activado' : 'Desactivado'}</dd>
                </div>
              </dl>
              <div className="pb-eventcard__actions">
                <Button
                  size="sm"
                  variant={isActive ? 'ghost' : 'primary'}
                  icon="check"
                  disabled={isActive}
                  onClick={() => void handleSetActive(event)}
                >
                  {isActive ? 'En uso' : 'Usar'}
                </Button>
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setForm({ mode: 'edit', event })}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" icon="export" onClick={() => void handleExport(event)}>
                  Exportar
                </Button>
                <Button size="sm" variant="ghost" icon="delete" onClick={() => setArchiveTarget(event)}>
                  Archivar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pb-events">
      <div className="pb-events__toolbar">
        <p className="pb-events__count">
          {events.length} {events.length === 1 ? 'evento activo' : 'eventos activos'}
        </p>
        <div className="pb-events__toolbarActions">
          <Button variant="secondary" icon="import" disabled={busy} onClick={() => void handleImport()}>
            Importar evento
          </Button>
          <Button icon="add" onClick={() => setForm({ mode: 'create' })}>
            Nuevo evento
          </Button>
        </div>
      </div>

      {body}

      <Modal
        open={form.mode !== 'closed'}
        onClose={() => setForm({ mode: 'closed' })}
        title={form.mode === 'edit' ? 'Editar evento' : 'Nuevo evento'}
        size="lg"
        closeOnBackdrop={false}
      >
        <EventForm
          initial={form.mode === 'edit' ? form.event : undefined}
          onCancel={() => setForm({ mode: 'closed' })}
          onSubmit={async (input) => {
            const result = await submitForm(input);
            if (result.ok) {
              notify({
                tone: 'success',
                title: form.mode === 'edit' ? 'Evento actualizado' : 'Evento creado',
                message: result.data.name
              });
              setForm({ mode: 'closed' });
            }
            return result;
          }}
        />
      </Modal>

      <Modal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="¿Archivar evento?"
        size="sm"
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" icon="delete" onClick={() => void handleArchive()}>
              Archivar
            </Button>
          </>
        }
      >
        <p>
          El evento <strong>{archiveTarget?.name}</strong> se ocultará de la lista. Sus fotos y
          archivos NO se eliminan; podrás encontrarlos en su carpeta.
        </p>
      </Modal>
    </div>
  );
}
