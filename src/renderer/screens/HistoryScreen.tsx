import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, EmptyState, SessionThumbnail, useToast } from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { buildSheet } from '@renderer/lib/composition/buildSheet';
import type { SessionRecord } from '@shared/types/entities';
import './history.css';

function formatStamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();
  const { notify } = useToast();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<SessionRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const eventId = activeEvent?.id ?? null;

  const load = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    const res = await window.photoBooth.sessions.listForEvent(eventId);
    if (res.ok) {
      setSessions(res.data);
      const entries = await Promise.all(
        res.data.map(async (s) => {
          const t = await window.photoBooth.sessions.getThumbnail(s.id);
          return [s.id, t.ok ? t.data : ''] as const;
        })
      );
      setThumbs(new Map(entries));
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reprint(session: SessionRecord) {
    if (!activeEvent) return;
    setBusyId(session.id);
    try {
      const finalRes = await window.photoBooth.sessions.getFinal(session.id);
      if (!finalRes.ok) {
        notify({ tone: 'danger', title: 'No se pudo reimprimir', message: finalRes.error.userMessage });
        return;
      }
      const sheet = await buildSheet({ finalUrls: [finalRes.data], paperKey: '4x6', orientation: 'portrait', cellCount: 1 });
      const res = await window.photoBooth.print.print({
        eventId: activeEvent.id,
        sessionId: session.id,
        sheetSessions: [session.id],
        printerName: null,
        method: 'image',
        paperSize: '4x6',
        orientation: 'portrait',
        layout: '1-up',
        copies: activeEvent.defaultCopies,
        sheetBytes: sheet.png,
        sheetWidth: sheet.width,
        sheetHeight: sheet.height
      });
      if (res.ok) {
        notify({
          tone: res.data.status === 'completed' ? 'success' : 'danger',
          title: res.data.status === 'completed' ? 'Reimpresión creada' : 'La reimpresión falló',
          message: `Nuevo trabajo · ${res.data.copies} copia(s)`
        });
      } else {
        notify({ tone: 'danger', title: 'No se pudo reimprimir', message: res.error.userMessage });
      }
    } finally {
      setBusyId(null);
    }
  }

  async function exportSession(session: SessionRecord) {
    const res = await window.photoBooth.history.exportSession(session.id);
    if (res.ok && res.data) notify({ tone: 'success', title: 'Sesión exportada', message: res.data });
    else if (!res.ok) notify({ tone: 'danger', title: 'No se pudo exportar', message: res.error.userMessage });
  }

  async function openFinal(session: SessionRecord) {
    const res = await window.photoBooth.history.openFinal(session.id);
    if (!res.ok || !res.data) notify({ tone: 'warning', title: 'No se pudo abrir la imagen final' });
  }

  async function openOriginals(session: SessionRecord) {
    const res = await window.photoBooth.history.openOriginals(session.id);
    if (!res.ok || !res.data) notify({ tone: 'warning', title: 'No se pudo abrir la carpeta' });
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    const res = await window.photoBooth.history.archive(archiveTarget.id);
    if (res.ok) notify({ tone: 'success', title: 'Sesión archivada' });
    else notify({ tone: 'danger', title: 'No se pudo archivar', message: res.error.userMessage });
    setArchiveTarget(null);
    await load();
  }

  if (!activeEvent) {
    return (
      <Card>
        <EmptyState
          icon="history"
          title="Sin evento activo"
          description="Selecciona un evento para ver su historial de sesiones."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="pb-history">
      <Card title={`Historial · ${activeEvent.name}`} icon="history">
        {loading ? (
          <EmptyState icon="history" title="Cargando historial…" />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="session"
            title="Aún no hay sesiones"
            description="Las sesiones capturadas aparecerán aquí para reabrir, reimprimir o exportar."
            action={<Button icon="session" onClick={() => navigate('/sesion')}>Ir a Sesión</Button>}
          />
        ) : (
          <div className="pb-history__grid">
            {sessions.map((s) => (
              <div key={s.id} className="pb-history__card">
                <SessionThumbnail
                  thumbnailUrl={thumbs.get(s.id) || undefined}
                  label="Sesión"
                  timestamp={formatStamp(s.createdAt)}
                  onOpen={() => void openFinal(s)}
                />
                <div className="pb-history__actions">
                  <Button size="sm" variant="secondary" icon="reprint" disabled={busyId === s.id} onClick={() => void reprint(s)}>
                    Reimprimir
                  </Button>
                  <Button size="sm" variant="ghost" icon="folder" onClick={() => void openOriginals(s)}>
                    Originales
                  </Button>
                  <Button size="sm" variant="ghost" icon="export" onClick={() => void exportSession(s)}>
                    Exportar
                  </Button>
                  <Button size="sm" variant="ghost" icon="delete" onClick={() => setArchiveTarget(s)}>
                    Archivar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        title="¿Archivar sesión?"
        size="sm"
        closeOnBackdrop={false}
        footer={
          <>
            <Button variant="ghost" onClick={() => setArchiveTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" icon="delete" onClick={() => void confirmArchive()}>
              Archivar
            </Button>
          </>
        }
      >
        <p>
          La sesión se ocultará del historial. Sus archivos (originales y resultado) NO se
          eliminan; siguen en la carpeta del evento.
        </p>
      </Modal>
    </div>
  );
}
