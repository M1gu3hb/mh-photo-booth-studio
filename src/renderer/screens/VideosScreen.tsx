import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  PrimaryButton,
  DangerButton,
  Select,
  Modal,
  EmptyState,
  StatusBadge,
  Icon,
  useToast
} from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { parseVideoTemplateConfig, type VideoOverlayItem } from '@shared/types/videoTemplates';
import type { VideoRecord, WebUploadRecord } from '@shared/types/entities';
import './videos.css';

const FRAME_W = 1280;
const FRAME_H = 720;

const OVERLAY_FONTS: Record<string, string> = {
  display: 'Cinzel, "Times New Roman", serif',
  script: '"Pinyon Script", "Segoe Script", cursive',
  ui: 'Inter, system-ui, sans-serif'
};

interface QrModal {
  folio: string;
  pageUrl: string;
  qrDataUrl: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Videos mode (Fase 17): connect any camera (USB / Bluetooth / WiFi cameras all
 * appear as video devices), record with the event's overlay template burned in,
 * or import an existing file — then publish to the web gallery (folio + QR).
 */
interface VideosScreenProps {
  /** Rendered inside the dual-mode grid (compact; camera picked by the parent). */
  embedded?: boolean;
  /** Controlled camera device (dual mode); hides the in-panel selector. */
  deviceId?: string;
}

export function VideosScreen({ embedded = false, deviceId: deviceIdProp }: VideosScreenProps = {}) {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();
  const { notify } = useToast();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIdState, setDeviceId] = useState('');
  // In dual mode the parent assigns the camera; otherwise use the local picker.
  const deviceId = embedded && deviceIdProp !== undefined ? deviceIdProp : deviceIdState;
  const [streamReady, setStreamReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [uploads, setUploads] = useState<WebUploadRecord[]>([]);
  const [qrModal, setQrModal] = useState<QrModal | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef(0);
  const startedAtRef = useRef(0);
  const overlayItemsRef = useRef<VideoOverlayItem[]>([]);
  const [overlayItems, setOverlayItems] = useState<VideoOverlayItem[]>([]);
  const [videoAspect, setVideoAspect] = useState(16 / 9);
  const overlayImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const eventId = activeEvent?.id ?? null;
  const videosEnabled = Boolean(activeEvent?.enableVideos);
  const uploadEnabled = Boolean(activeEvent?.webUploadEnabled);

  const refresh = useCallback(async () => {
    if (!eventId) return;
    const [v, u] = await Promise.all([
      window.photoBooth.videos.list(eventId),
      window.photoBooth.web.listUploads(eventId)
    ]);
    if (v.ok) setVideos(v.data);
    if (u.ok) setUploads(u.data);
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Load the event's overlay template (items + preloaded images).
  useEffect(() => {
    const templateId = activeEvent?.videoTemplateId;
    overlayItemsRef.current = [];
    overlayImagesRef.current = new Map();
    setOverlayItems([]);
    if (!templateId) return;
    let on = true;
    void window.photoBooth.videoTemplates.get(templateId).then((res) => {
      if (!on || !res.ok) return;
      const config = parseVideoTemplateConfig(res.data.configJson);
      overlayItemsRef.current = config.items;
      setOverlayItems(config.items);
      for (const item of config.items) {
        if (item.kind === 'image') {
          const img = new window.Image();
          img.src = item.dataUrl;
          overlayImagesRef.current.set(item.id, img);
        }
      }
    });
    return () => {
      on = false;
    };
  }, [activeEvent?.videoTemplateId]);

  // Camera lifecycle: enumerate + open the selected device.
  useEffect(() => {
    if (!videosEnabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
        setStreamReady(true);
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setDevices(all.filter((d) => d.kind === 'videoinput'));
      } catch {
        setStreamReady(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStreamReady(false);
    };
  }, [deviceId, videosEnabled]);

  // Elapsed timer while recording.
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [recording]);

  /** Overlay drawn INSIDE the video frame: coordinates are fractions of the
   * actual frame, and images keep their natural aspect (no distortion). */
  function drawOverlay(ctx: CanvasRenderingContext2D, frameW: number, frameH: number): void {
    for (const item of overlayItemsRef.current) {
      ctx.globalAlpha = item.opacity;
      if (item.kind === 'image') {
        const img = overlayImagesRef.current.get(item.id);
        if (img?.complete && img.naturalHeight > 0) {
          const w = item.width * frameW;
          const h = w / (img.naturalWidth / img.naturalHeight);
          ctx.drawImage(img, item.x * frameW, item.y * frameH, w, h);
        }
      } else {
        ctx.font = `600 ${Math.max(10, item.size * frameH)}px ${OVERLAY_FONTS[item.font] ?? OVERLAY_FONTS.ui}`;
        ctx.fillStyle = item.color;
        ctx.textBaseline = 'top';
        ctx.fillText(item.text, item.x * frameW, item.y * frameH);
      }
    }
    ctx.globalAlpha = 1;
  }

  function startRecording(): void {
    const source = videoRef.current;
    const stream = streamRef.current;
    if (!source || !stream || recording) return;

    // The recording canvas matches the CAMERA's real format (detected from the
    // stream) — no letterbox, so the overlay always lands inside the video.
    const vw = source.videoWidth || FRAME_W;
    const vh = source.videoHeight || FRAME_H;
    const scale = Math.min(1, 1920 / Math.max(vw, vh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(2, Math.round((vw * scale) / 2) * 2);
    canvas.height = Math.max(2, Math.round((vh * scale) / 2) * 2);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      drawOverlay(ctx, canvas.width, canvas.height);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    const canvasStream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      cancelAnimationFrame(rafRef.current);
      void persistRecording();
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
  }

  function stopRecording(): void {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function persistRecording(): Promise<void> {
    if (!eventId) return;
    setSaving(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      const bytes = await blob.arrayBuffer();
      const durationMs = Date.now() - startedAtRef.current;
      const saved = await window.photoBooth.videos.saveRecorded(eventId, bytes, 'webm', durationMs);
      if (!saved.ok) {
        notify({ tone: 'danger', title: 'No se pudo guardar el video', message: saved.error.userMessage });
        return;
      }
      notify({ tone: 'success', title: 'Video guardado', message: `${Math.round(durationMs / 1000)} s` });
      await refresh();
      if (uploadEnabled) await publishVideo(saved.data.id);
    } finally {
      setSaving(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (!eventId) return;
    const res = await window.photoBooth.videos.importVideo(eventId);
    if (res.ok && res.data) {
      notify({ tone: 'success', title: 'Video importado', message: '' });
      await refresh();
      if (uploadEnabled) await publishVideo(res.data.id);
    } else if (!res.ok) {
      notify({ tone: 'danger', title: 'No se pudo importar', message: res.error.userMessage });
    }
  }

  async function publishVideo(videoId: string): Promise<void> {
    setPublishingId(videoId);
    try {
      const res = await window.photoBooth.web.publishVideo(videoId);
      if (res.ok) {
        setQrModal({ folio: res.data.folio, pageUrl: res.data.pageUrl, qrDataUrl: res.data.qrDataUrl });
      } else {
        notify({ tone: 'warning', title: 'Subida pendiente', message: res.error.userMessage });
      }
      await refresh();
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(videoId: string): Promise<void> {
    const res = await window.photoBooth.videos.delete(videoId);
    if (res.ok) {
      notify({ tone: 'success', title: 'Video borrado', message: '' });
      await refresh();
    }
  }

  function uploadFor(videoId: string): WebUploadRecord | undefined {
    return uploads.find((u) => u.videoId === videoId && u.status === 'done');
  }

  // Live overlay preview: a box matching the video's displayed rect inside the
  // 16:9 stage (object-fit: contain), so items land exactly where they record.
  const STAGE_ASPECT = 16 / 9;
  const overlayPrevStyle: React.CSSProperties =
    videoAspect >= STAGE_ASPECT
      ? { width: '100%', height: `${(STAGE_ASPECT / videoAspect) * 100}%` }
      : { height: '100%', width: `${(videoAspect / STAGE_ASPECT) * 100}%` };

  // ---- Guards ----
  if (!activeEvent) {
    return (
      <Card>
        <EmptyState
          icon="events"
          title="Sin evento activo"
          description="Selecciona un evento para grabar videos."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
        />
      </Card>
    );
  }
  if (!videosEnabled) {
    return (
      <Card>
        <EmptyState
          icon="video"
          title="Este evento no tiene videos activados"
          description="Edita el evento y activa la opción 'Videos (cámara 360)'."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Editar evento</Button>}
        />
      </Card>
    );
  }

  return (
    <div className={embedded ? 'pb-videos pb-videos--embedded' : 'pb-videos'}>
      <Card title="Grabar video" icon="video">
        <div className="pb-videos__cols">
          <div className="pb-videos__stagewrap">
            <div className="pb-videos__stage">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(e) =>
                  setVideoAspect(e.currentTarget.videoWidth / Math.max(1, e.currentTarget.videoHeight))
                }
              />
              {overlayItems.length > 0 && (
                <div className="pb-videos__ovprev" style={overlayPrevStyle} aria-hidden>
                  {overlayItems.map((item) =>
                    item.kind === 'image' ? (
                      <img
                        key={item.id}
                        src={item.dataUrl}
                        alt=""
                        style={{
                          left: `${item.x * 100}%`,
                          top: `${item.y * 100}%`,
                          width: `${item.width * 100}%`,
                          opacity: item.opacity
                        }}
                      />
                    ) : (
                      <span
                        key={item.id}
                        style={{
                          left: `${item.x * 100}%`,
                          top: `${item.y * 100}%`,
                          fontSize: `${item.size * 100}cqh`,
                          fontFamily: OVERLAY_FONTS[item.font] ?? OVERLAY_FONTS.ui,
                          color: item.color,
                          opacity: item.opacity
                        }}
                      >
                        {item.text}
                      </span>
                    )
                  )}
                </div>
              )}
              {recording && (
                <span className="pb-videos__rec">
                  <Icon name="record" size={14} /> REC {elapsed}s
                </span>
              )}
            </div>
          </div>
          <div className="pb-videos__side">
            {!embedded && (
              <Select
                label="Cámara (USB / Bluetooth / WiFi)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                options={
                  devices.length > 0
                    ? devices.map((d, i) => ({
                        value: d.deviceId,
                        label: d.label || `Cámara ${i + 1}`
                      }))
                    : [{ value: '', label: streamReady ? 'Cámara predeterminada' : 'Buscando cámaras…' }]
                }
                hint="Las cámaras 360 conectadas por Bluetooth o WiFi aparecen aquí como cámaras del sistema."
              />
            )}
            {activeEvent.videoTemplateId ? (
              <StatusBadge tone="success" icon="templates">
                Superposición activa
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Sin superposición</StatusBadge>
            )}
            {!recording ? (
              <PrimaryButton
                size="lg"
                icon="record"
                disabled={!streamReady || saving}
                onClick={startRecording}
              >
                {saving ? 'Guardando…' : 'Grabar'}
              </PrimaryButton>
            ) : (
              <DangerButton size="lg" icon="stop" onClick={stopRecording}>
                Detener ({elapsed}s)
              </DangerButton>
            )}
            <Button variant="secondary" icon="import" onClick={() => void handleImport()} disabled={recording}>
              Subir un video existente
            </Button>
            {uploadEnabled && (
              <p className="pb-videos__hint">
                <Icon name="qr" size={14} /> Al terminar se sube a la página y se genera folio + QR.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card title="Videos del evento" icon="history">
        {videos.length === 0 ? (
          <EmptyState compact icon="video" title="Aún no hay videos" />
        ) : (
          <ul className="pb-videos__list">
            {videos.map((v) => {
              const upload = uploadFor(v.id);
              return (
                <li key={v.id} className="pb-videos__item">
                  <Icon name="video" size={22} className="pb-videos__itemicon" />
                  <div className="pb-videos__meta">
                    <span className="pb-videos__name">
                      {v.source === 'recorded' ? 'Grabado en cabina' : 'Importado'} ·{' '}
                      {new Date(v.createdAt).toLocaleString('es-MX')}
                    </span>
                    <span className="pb-videos__sub">
                      {v.durationMs ? `${Math.round(v.durationMs / 1000)} s · ` : ''}
                      {formatSize(v.sizeBytes)}
                      {upload?.folio ? ` · Folio ${upload.folio}` : ''}
                    </span>
                  </div>
                  {upload ? (
                    <StatusBadge tone="success" icon="qr">
                      Publicado
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Local</StatusBadge>
                  )}
                  <div className="pb-videos__actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="qr"
                      disabled={publishingId === v.id}
                      onClick={() => void publishVideo(v.id)}
                    >
                      {publishingId === v.id ? 'Subiendo…' : upload ? 'Ver QR' : 'Subir y QR'}
                    </Button>
                    <Button size="sm" variant="ghost" icon="delete" onClick={() => void handleDelete(v.id)}>
                      Borrar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={qrModal !== null}
        onClose={() => setQrModal(null)}
        title="Video publicado"
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
            <PrimaryButton icon="check" onClick={() => setQrModal(null)}>
              Listo
            </PrimaryButton>
          </>
        }
      >
        {qrModal && (
          <div className="pb-videos__qrmodal">
            <img src={qrModal.qrDataUrl} alt="QR del video" />
            <p className="pb-videos__folio">{qrModal.folio}</p>
            <p className="pb-videos__sub">Escanea el QR o entra a la página con el folio para descargar.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
