import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  PrimaryButton,
  Modal,
  EmptyState,
  SessionThumbnail,
  StatusBadge,
  Icon,
  useToast
} from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { buildSheet } from '@renderer/lib/composition/buildSheet';
import type { SessionRecord, VideoRecord } from '@shared/types/entities';
import './history.css';

function formatStamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
}

/** One chronological entry of the event: a photo session or a video. */
type HistoryItem =
  | { kind: 'photo'; createdAt: string; session: SessionRecord }
  | { kind: 'video'; createdAt: string; video: VideoRecord };

interface QrModalState {
  title: string;
  folio: string;
  pageUrl: string;
  qrDataUrl: string;
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();
  const { notify } = useToast();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [archiveTarget, setArchiveTarget] = useState<SessionRecord | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<QrModalState | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);

  const eventId = activeEvent?.id ?? null;
  const uploadEnabled = Boolean(activeEvent?.webUploadEnabled);

  const load = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    const [sess, vids] = await Promise.all([
      window.photoBooth.sessions.listForEvent(eventId),
      window.photoBooth.videos.list(eventId)
    ]);
    if (sess.ok) {
      setSessions(sess.data);
      const entries = await Promise.all(
        sess.data.map(async (s) => {
          const t = await window.photoBooth.sessions.getThumbnail(s.id);
          return [s.id, t.ok ? t.data : ''] as const;
        })
      );
      setThumbs(new Map(entries));
    }
    if (vids.ok) setVideos(vids.data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Full event timeline: photos + videos, newest first.
  const items: HistoryItem[] = [
    ...sessions.map((s): HistoryItem => ({ kind: 'photo', createdAt: s.createdAt, session: s })),
    ...videos.map((v): HistoryItem => ({ kind: 'video', createdAt: v.createdAt, video: v }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /** Clicking any item pops its QR + folio (publishes if not yet published). */
  async function showQr(item: HistoryItem) {
    if (!uploadEnabled) {
      notify({
        tone: 'info',
        title: 'Este evento no publica a la web',
        message: 'Activa "Subir a la página web" en el evento para generar folios y QR.'
      });
      return;
    }
    const id = item.kind === 'photo' ? item.session.id : item.video.id;
    setQrLoadingId(id);
    try {
      const res =
        item.kind === 'photo'
          ? await window.photoBooth.web.publishSessionFinal(item.session.id)
          : await window.photoBooth.web.publishVideo(item.video.id);
      if (res.ok) {
        setQrModal({
          title: item.kind === 'photo' ? 'Foto publicada' : 'Video publicado',
          folio: res.data.folio,
          pageUrl: res.data.pageUrl,
          qrDataUrl: res.data.qrDataUrl
        });
      } else {
        notify({ tone: 'warning', title: 'Sin QR todavía', message: res.error.userMessage });
      }
    } finally {
      setQrLoadingId(null);
    }
  }

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
          description="Selecciona un evento para ver su historial."
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
        ) : items.length === 0 ? (
          <EmptyState
            icon="session"
            title="Aún no hay fotos ni videos"
            description="Las sesiones y videos del evento aparecerán aquí en orden."
            action={<Button icon="session" onClick={() => navigate('/sesion')}>Ir a Sesión</Button>}
          />
        ) : (
          <div className="pb-history__grid">
            {items.map((item) =>
              item.kind === 'photo' ? (
                <div key={item.session.id} className="pb-history__card">
                  <SessionThumbnail
                    thumbnailUrl={thumbs.get(item.session.id) || undefined}
                    label="Sesión de fotos"
                    timestamp={formatStamp(item.session.createdAt)}
                    onOpen={() => void showQr(item)}
                  />
                  <div className="pb-history__actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="qr"
                      disabled={qrLoadingId === item.session.id}
                      onClick={() => void showQr(item)}
                    >
                      {qrLoadingId === item.session.id ? 'Cargando…' : 'QR / Folio'}
                    </Button>
                    <Button size="sm" variant="ghost" icon="image" onClick={() => void openFinal(item.session)}>
                      Ver foto
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="reprint"
                      disabled={busyId === item.session.id}
                      onClick={() => void reprint(item.session)}
                    >
                      Reimprimir
                    </Button>
                    <Button size="sm" variant="ghost" icon="folder" onClick={() => void openOriginals(item.session)}>
                      Originales
                    </Button>
                    <Button size="sm" variant="ghost" icon="export" onClick={() => void exportSession(item.session)}>
                      Exportar
                    </Button>
                    <Button size="sm" variant="ghost" icon="delete" onClick={() => setArchiveTarget(item.session)}>
                      Archivar
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={item.video.id} className="pb-history__card">
                  <button type="button" className="pb-history__videocard" onClick={() => void showQr(item)}>
                    <Icon name="video" size={34} />
                    <span className="pb-history__videolabel">Video</span>
                    <span className="pb-history__videostamp">{formatStamp(item.video.createdAt)}</span>
                    <StatusBadge tone="neutral">
                      {item.video.source === 'recorded' ? 'Grabado' : 'Importado'}
                    </StatusBadge>
                  </button>
                  <div className="pb-history__actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="qr"
                      disabled={qrLoadingId === item.video.id}
                      onClick={() => void showQr(item)}
                    >
                      {qrLoadingId === item.video.id ? 'Cargando…' : 'QR / Folio'}
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Card>

      {/* QR + folio for the clicked photo/video. */}
      <Modal
        open={qrModal !== null}
        onClose={() => setQrModal(null)}
        title={qrModal?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              icon="duplicate"
              onClick={() => {
                void navigator.clipboard.writeText(qrModal?.folio ?? '');
                notify({ tone: 'success', title: 'Folio copiado', message: qrModal?.folio ?? '' });
              }}
            >
              Copiar folio
            </Button>
            <Button
              variant="ghost"
              icon="export"
              onClick={() => qrModal && void window.photoBooth.web.openPage(qrModal.pageUrl)}
            >
              Abrir página
            </Button>
            <PrimaryButton icon="check" onClick={() => setQrModal(null)}>
              Listo
            </PrimaryButton>
          </>
        }
      >
        {qrModal && (
          <div className="pb-history__qrmodal">
            <img src={qrModal.qrDataUrl} alt="QR" />
            <p className="pb-history__qrfolio">{qrModal.folio}</p>
            <p className="pb-history__qrhint">Escanea el QR o entra a la página con el folio.</p>
          </div>
        )}
      </Modal>

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
