import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  PrimaryButton,
  Input,
  Modal,
  EmptyState,
  StatusBadge,
  Icon,
  useToast,
  type StatusTone
} from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import type { WebUploadRecord, WebUploadStatus } from '@shared/types/entities';
import type { WebConnectionStatus, EventFolioResult } from '@shared/types/web';
import './web.css';

const STATUS_TONE: Record<WebUploadStatus, StatusTone> = {
  pending: 'warning',
  done: 'success',
  failed: 'danger'
};
const STATUS_LABEL: Record<WebUploadStatus, string> = {
  pending: 'Pendiente',
  done: 'Publicado',
  failed: 'Falló'
};

interface DetailModal {
  upload: WebUploadRecord;
  finalUrl: string | null;
  qrDataUrl: string | null;
}

/**
 * "Página web" admin (Fase 17): configure the gallery connection, see the
 * active event's master folio + QR, and audit/retry every publish. As the
 * administrator you can open any media's page and (for photos) view the final
 * + jump to the originals — guests only ever see finals on the public site.
 */
export function WebScreen() {
  const navigate = useNavigate();
  const { activeEvent, refresh: refreshEvents } = useEvents();
  const { notify } = useToast();

  const [siteUrl, setSiteUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [connection, setConnection] = useState<WebConnectionStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [folio, setFolio] = useState<EventFolioResult | null>(null);
  const [creatingFolio, setCreatingFolio] = useState(false);
  const [uploads, setUploads] = useState<WebUploadRecord[]>([]);
  const [retrying, setRetrying] = useState(false);
  const [detail, setDetail] = useState<DetailModal | null>(null);

  const eventId = activeEvent?.id ?? null;

  useEffect(() => {
    void window.photoBooth.web.getConfig().then((r) => {
      if (r.ok) {
        setSiteUrl(r.data.siteUrl);
        setApiKey(r.data.apiKey);
      }
    });
  }, []);

  const refreshUploads = useCallback(async () => {
    if (!eventId) {
      setUploads([]);
      return;
    }
    const r = await window.photoBooth.web.listUploads(eventId);
    if (r.ok) setUploads(r.data);
  }, [eventId]);

  useEffect(() => {
    void refreshUploads();
  }, [refreshUploads]);

  // Load the event folio QR when the event already has one.
  useEffect(() => {
    setFolio(null);
    if (!eventId || !activeEvent?.webEventFolio) return;
    let on = true;
    void window.photoBooth.web.ensureEventFolio(eventId).then((r) => {
      if (on && r.ok) setFolio(r.data);
    });
    return () => {
      on = false;
    };
  }, [eventId, activeEvent?.webEventFolio]);

  async function saveConfig() {
    setSavingConfig(true);
    const r = await window.photoBooth.web.setConfig({ siteUrl, apiKey });
    setSavingConfig(false);
    if (r.ok) {
      notify({ tone: 'success', title: 'Configuración guardada', message: r.data.siteUrl || 'Sin URL' });
      await testConnection();
    } else {
      notify({ tone: 'danger', title: 'No se pudo guardar', message: r.error.userMessage });
    }
  }

  async function testConnection() {
    setTesting(true);
    const r = await window.photoBooth.web.testConnection();
    setTesting(false);
    if (r.ok) setConnection(r.data);
  }

  async function createFolio() {
    if (!eventId) return;
    setCreatingFolio(true);
    const r = await window.photoBooth.web.ensureEventFolio(eventId);
    setCreatingFolio(false);
    if (r.ok) {
      setFolio(r.data);
      notify({ tone: 'success', title: 'Folio del evento', message: r.data.eventFolio });
      void refreshEvents();
    } else {
      notify({ tone: 'danger', title: 'No se pudo crear el folio', message: r.error.userMessage });
    }
  }

  async function retryPending() {
    if (!eventId) return;
    setRetrying(true);
    const r = await window.photoBooth.web.retryPending(eventId);
    setRetrying(false);
    if (r.ok) {
      notify({
        tone: r.data.succeeded > 0 ? 'success' : 'info',
        title: 'Reintento terminado',
        message: `${r.data.succeeded}/${r.data.retried} subidas completadas`
      });
      await refreshUploads();
    }
  }

  async function openDetail(upload: WebUploadRecord) {
    let finalUrl: string | null = null;
    if (upload.mediaType === 'photo' && upload.sessionId) {
      const r = await window.photoBooth.sessions.getFinal(upload.sessionId);
      if (r.ok) finalUrl = r.data;
    }
    setDetail({ upload, finalUrl, qrDataUrl: null });
  }

  return (
    <div className="pb-web">
      <div className="pb-web__main">
        <Card title="Conexión con la página" icon="web">
          <div className="pb-web__config">
            <Input
              label="URL de la página"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://…vercel.app"
            />
            <Input
              label="Clave API (x-api-key)"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              hint="Debe coincidir con UPLOAD_API_KEY configurada en Vercel."
            />
            <div className="pb-web__configbtns">
              <PrimaryButton icon="save" onClick={() => void saveConfig()} disabled={savingConfig}>
                Guardar
              </PrimaryButton>
              <Button variant="secondary" icon="retry" onClick={() => void testConnection()} disabled={testing}>
                {testing ? 'Probando…' : 'Probar conexión'}
              </Button>
              <Button
                variant="ghost"
                icon="export"
                disabled={!siteUrl}
                onClick={() => void window.photoBooth.web.openPage(siteUrl)}
              >
                Abrir página
              </Button>
            </div>
            {connection && (
              <StatusBadge tone={connection.reachable ? 'success' : 'danger'}>
                {connection.message}
              </StatusBadge>
            )}
          </div>
        </Card>

        <Card title="Publicaciones del evento" icon="qr">
          {!activeEvent ? (
            <EmptyState
              compact
              icon="events"
              title="Sin evento activo"
              action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
            />
          ) : uploads.length === 0 ? (
            <EmptyState
              compact
              icon="qr"
              title="Aún no hay publicaciones"
              description="Las fotos y videos publicados aparecerán aquí con su folio."
            />
          ) : (
            <>
              <div className="pb-web__toolbar">
                <span className="pb-web__count">{uploads.length} publicación(es)</span>
                <Button size="sm" variant="secondary" icon="retry" onClick={() => void retryPending()} disabled={retrying}>
                  {retrying ? 'Reintentando…' : 'Reintentar pendientes'}
                </Button>
              </div>
              <ul className="pb-web__list">
                {uploads.map((u) => (
                  <li key={u.id} className="pb-web__item">
                    <Icon name={u.mediaType === 'video' ? 'video' : 'image'} size={20} className="pb-web__itemicon" />
                    <div className="pb-web__meta">
                      <span className="pb-web__folio">{u.folio ?? 'Sin folio'}</span>
                      <span className="pb-web__sub">
                        {u.mediaType === 'video' ? 'Video' : 'Foto'} ·{' '}
                        {new Date(u.createdAt).toLocaleString('es-MX')}
                        {u.errorMessage ? ` · ${u.errorMessage}` : ''}
                      </span>
                    </div>
                    <StatusBadge tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</StatusBadge>
                    <div className="pb-web__actions">
                      <Button size="sm" variant="ghost" icon="image" onClick={() => void openDetail(u)}>
                        Detalle
                      </Button>
                      {u.pageUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="export"
                          onClick={() => u.pageUrl && void window.photoBooth.web.openPage(u.pageUrl)}
                        >
                          Abrir
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <aside className="pb-web__side">
        <Card title="Folio del evento" icon="qr">
          {!activeEvent ? (
            <EmptyState compact icon="events" title="Sin evento activo" />
          ) : folio ? (
            <div className="pb-web__foliocard">
              <img src={folio.qrDataUrl} alt="QR del evento" />
              <p className="pb-web__foliobig">{folio.eventFolio}</p>
              <p className="pb-web__sub">
                Este folio muestra TODO el evento. Compártelo solo con los anfitriones.
              </p>
              <div className="pb-web__configbtns">
                <Button
                  size="sm"
                  variant="secondary"
                  icon="duplicate"
                  onClick={() => {
                    void navigator.clipboard.writeText(folio.eventFolio);
                    notify({ tone: 'success', title: 'Folio copiado', message: folio.eventFolio });
                  }}
                >
                  Copiar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="export"
                  onClick={() => void window.photoBooth.web.openPage(folio.pageUrl)}
                >
                  Ver galería
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              compact
              icon="qr"
              title="Este evento aún no tiene folio"
              description="Créalo para poder publicar fotos y videos."
              action={
                <Button icon="add" onClick={() => void createFolio()} disabled={creatingFolio}>
                  {creatingFolio ? 'Creando…' : 'Crear folio'}
                </Button>
              }
            />
          )}
        </Card>
      </aside>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={`Detalle · ${detail?.upload.folio ?? ''}`}
        size="md"
        footer={
          <>
            {detail?.upload.mediaType === 'photo' && detail.upload.sessionId && (
              <Button
                variant="secondary"
                icon="folder"
                onClick={() =>
                  detail.upload.sessionId &&
                  void window.photoBooth.history.openOriginals(detail.upload.sessionId)
                }
              >
                Abrir originales
              </Button>
            )}
            {detail?.upload.pageUrl && (
              <Button
                variant="secondary"
                icon="export"
                onClick={() => detail.upload.pageUrl && void window.photoBooth.web.openPage(detail.upload.pageUrl)}
              >
                Abrir página
              </Button>
            )}
            <PrimaryButton icon="check" onClick={() => setDetail(null)}>
              Cerrar
            </PrimaryButton>
          </>
        }
      >
        {detail && (
          <div className="pb-web__detail">
            {detail.finalUrl ? (
              <img className="pb-web__detailimg" src={detail.finalUrl} alt="Foto final" />
            ) : (
              <p className="pb-web__sub">
                {detail.upload.mediaType === 'video'
                  ? 'Video publicado — ábrelo en la página para reproducirlo.'
                  : 'Sin vista previa disponible.'}
              </p>
            )}
            <p className="pb-web__sub">
              Los invitados solo ven la foto/video final en la página. Los originales viven en la
              carpeta del evento (solo administrador).
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
