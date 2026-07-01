import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
  PrimaryButton,
  DangerButton,
  EmptyState,
  ErrorState,
  StatusBadge,
  CameraPreview,
  CountdownDisplay,
  PoseCard,
  TemplatePreview,
  Toggle,
  Icon,
  useToast
} from '@renderer/components/ui';
import type { LiveSessionState, LiveCommand } from '@shared/types/live';
import { useEvents } from '@renderer/state/EventsProvider';
import { useCamera } from '@renderer/hooks/useCamera';
import { playBeep, playShutter } from '@renderer/lib/sound';
import { composeSession, CompositionError } from '@renderer/lib/composition/composeSession';
import { buildSheet } from '@renderer/lib/composition/buildSheet';
import { eventTypeLabel } from '@shared/constants/eventTypes';
import type { SessionStartResult } from '@shared/types/session';
import type { CameraErrorInfo } from '@renderer/lib/camera/types';
import './session.css';

type Mode = 'setup' | 'capturing' | 'composing' | 'review';
interface Problem {
  userMessage: string;
  action: string;
}

/** Web publish (folio + QR) progress for the session in review (Fase 17). */
interface PublishState {
  status: 'idle' | 'uploading' | 'done' | 'failed';
  folio: string | null;
  pageUrl: string | null;
  qrDataUrl: string | null;
  message: string | null;
}
const IDLE_PUBLISH: PublishState = {
  status: 'idle',
  folio: null,
  pageUrl: null,
  qrDataUrl: null,
  message: null
};

/** Seconds the QR screen stays before auto-resetting for the next guest. */
const QR_AUTO_RESET_SECONDS = 20;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SessionScreen() {
  const navigate = useNavigate();
  const inEventMode = useLocation().pathname.startsWith('/evento');
  const { activeEvent } = useEvents();
  const { notify } = useToast();
  const ready = Boolean(activeEvent && activeEvent.templateId);
  const camera = useCamera(ready);
  const cameraReady = camera.status === 'ready';
  const [printingQuick, setPrintingQuick] = useState(false);

  // Fase 14 — public view (second monitor) + automatic mode.
  const [autoMode, setAutoMode] = useState(false);
  const [publicOpen, setPublicOpen] = useState(false);
  // Fase 17 — auto mode variant: show the QR instead of print/next buttons.
  const [qrInsteadOfPrint, setQrInsteadOfPrint] = useState(false);
  // Fase 17 — web publish state for the current session (folio + QR).
  const [publish, setPublish] = useState<PublishState>(IDLE_PUBLISH);
  const publishForceRef = useRef(false);

  const [mode, setMode] = useState<Mode>('setup');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdownSecs, setCountdownSecs] = useState(3);
  const [session, setSession] = useState<SessionStartResult | null>(null);
  const [captures, setCaptures] = useState<(string | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [poseText, setPoseText] = useState('');
  const [flashing, setFlashing] = useState(false);
  const [captureError, setCaptureError] = useState<CameraErrorInfo | null>(null);
  const [composed, setComposed] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<Problem | null>(null);
  const [working, setWorking] = useState(false);
  const capturesRef = useRef<(string | null)[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    void window.photoBooth.settings.get().then((r) => {
      if (r.ok) {
        setSoundEnabled(r.data.soundEnabled);
        setCountdownSecs(r.data.defaultCountdownSeconds);
      }
    });
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  // Reflect whether the public window is already open (e.g. opened by event mode).
  useEffect(() => {
    void window.photoBooth.display.isPublicOpen().then((r) => {
      if (r.ok) setPublicOpen(r.data.open);
    });
  }, []);

  // Broadcast the live session state to the public-display window on every change.
  useEffect(() => {
    const phase: LiveSessionState['phase'] =
      mode === 'setup'
        ? 'idle'
        : mode === 'composing'
          ? 'composing'
          : mode === 'review'
            ? 'review'
            : flashing
              ? 'flash'
              : countdown !== null
                ? 'countdown'
                : 'capturing';
    const liveState: LiveSessionState = {
      phase,
      photoIndex: currentIndex,
      photoCount: session?.photoCount ?? activeEvent?.defaultPhotoCount ?? 0,
      countdown,
      poseText,
      autoMode,
      eventName: activeEvent?.name ?? '',
      qrDataUrl: mode === 'review' ? publish.qrDataUrl : null,
      folio: mode === 'review' ? publish.folio : null,
      qrInsteadOfPrint
    };
    void window.photoBooth.live.publishState(liveState);
  }, [
    mode,
    flashing,
    countdown,
    currentIndex,
    poseText,
    composed,
    autoMode,
    session,
    activeEvent,
    publish,
    qrInsteadOfPrint
  ]);

  // Keep the latest command handler (auto mode) without re-subscribing each render.
  const commandRef = useRef<(command: LiveCommand) => void>(() => undefined);
  useEffect(() => {
    commandRef.current = (command) => {
      if (!autoMode) return;
      // 'start' works from setup OR review (a new guest can begin immediately —
      // starting from review overwrites the previous result → infinite sessions).
      if (command === 'start' && (mode === 'setup' || mode === 'review') && cameraReady && !working) {
        void startSession();
      } else if (command === 'print' && mode === 'review' && composed && !printingQuick) {
        void quickPrint();
      } else if (command === 'finalize' && mode === 'review') {
        finalize();
      } else if (command === 'retake' && mode === 'review') {
        void repeatSession();
      }
    };
  });
  useEffect(() => window.photoBooth.live.onCommand((command) => commandRef.current(command)), []);

  // Fase 17 — auto mode with QR screen: reset for the next guest after a pause
  // (in case nobody presses "Siguiente" on the public screen).
  const finalizeRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    finalizeRef.current = finalize;
  });
  useEffect(() => {
    if (!(autoMode && qrInsteadOfPrint && mode === 'review')) return;
    const timer = setTimeout(() => finalizeRef.current(), QR_AUTO_RESET_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [autoMode, qrInsteadOfPrint, mode]);

  const togglePublic = useCallback(async () => {
    if (publicOpen) {
      await window.photoBooth.display.closePublic();
      setPublicOpen(false);
    } else {
      const r = await window.photoBooth.display.openPublic();
      setPublicOpen(r.ok ? r.data.open : true);
    }
  }, [publicOpen]);

  async function captureOne(active: SessionStartResult, index: number): Promise<boolean> {
    setCurrentIndex(index);
    setPoseText(active.poses[index] ?? 'Sonrían');
    setCountdown(null);
    await delay(1300);
    if (cancelledRef.current) return false;

    for (let n = countdownSecs; n >= 1; n -= 1) {
      setCountdown(n);
      if (soundEnabled) playBeep(n === 1 ? 1046 : 784, 180);
      await delay(900);
      if (cancelledRef.current) return false;
    }

    setCountdown(0);
    setFlashing(true);
    if (soundEnabled) playShutter();
    try {
      const result = await camera.capture();
      const saved = await window.photoBooth.sessions.savePhoto(
        active.session.id,
        index,
        result.bytes,
        result.width,
        result.height
      );
      if (!saved.ok) {
        setCaptureError({ userMessage: saved.error.userMessage, action: saved.error.action });
        setFlashing(false);
        return false;
      }
      capturesRef.current[index] = result.dataUrl;
      setCaptures([...capturesRef.current]);
      await delay(220);
      setFlashing(false);
      return true;
    } catch {
      setCaptureError({ userMessage: 'No se pudo tomar la foto.', action: 'Reintenta la foto o revisa la cámara.' });
      setFlashing(false);
      return false;
    }
  }

  async function runSequence(active: SessionStartResult, indices: number[]): Promise<boolean> {
    for (const index of indices) {
      const ok = await captureOne(active, index);
      if (!ok) return false;
    }
    return true;
  }

  async function composeAndSave(active: SessionStartResult): Promise<void> {
    if (!activeEvent?.templateId) return;
    setComposeError(null);
    try {
      const [tplRes, imgRes] = await Promise.all([
        window.photoBooth.templates.get(activeEvent.templateId),
        window.photoBooth.templates.getImage(activeEvent.templateId)
      ]);
      if (!tplRes.ok) return setComposeError({ userMessage: tplRes.error.userMessage, action: tplRes.error.action });
      if (!imgRes.ok) return setComposeError({ userMessage: imgRes.error.userMessage, action: imgRes.error.action });

      let qrDataUrl: string | null = null;
      if (activeEvent.qrEnabled) {
        const q = await window.photoBooth.qr.ensureForEvent(activeEvent.id);
        if (q.ok) qrDataUrl = q.data;
      }
      const date = activeEvent.eventDate
        ? new Date(activeEvent.eventDate).toLocaleDateString('es-MX', { dateStyle: 'long' })
        : '';
      const texts: Record<string, string> = {
        '{event_name}': activeEvent.name,
        '{event_date}': date,
        '{event_type}': eventTypeLabel(activeEvent.eventType)
      };
      const photoUrls = capturesRef.current.filter((c): c is string => Boolean(c));
      const out = await composeSession({
        baseImageUrl: imgRes.data,
        widthPx: tplRes.data.template.widthPx,
        heightPx: tplRes.data.template.heightPx,
        slots: tplRes.data.slots,
        photoUrls,
        qrDataUrl,
        texts
      });
      const outputType = tplRes.data.template.formatLabel === 'postcard' ? 'postcard' : 'strip';
      const saved = await window.photoBooth.sessions.saveComposition(
        active.session.id,
        out.png,
        out.jpg,
        out.thumb,
        out.width,
        out.height,
        outputType
      );
      if (saved.ok) {
        setComposed(out.previewDataUrl);
        // Fase 17: publish to the web gallery (folio + QR) whenever the event
        // has it enabled — always, printer or not. Non-blocking for the UI.
        if (activeEvent.webUploadEnabled) {
          void publishToWeb(active.session.id);
        }
      } else {
        setComposeError({ userMessage: saved.error.userMessage, action: saved.error.action });
      }
    } catch (err) {
      if (err instanceof CompositionError) setComposeError({ userMessage: err.message, action: err.action });
      else setComposeError({ userMessage: 'No se pudo preparar la foto.', action: 'Reintenta o repite la sesión.' });
    }
  }

  /** Uploads the session final to the web gallery; retakes force a fresh folio. */
  async function publishToWeb(sessionId: string) {
    setPublish({ ...IDLE_PUBLISH, status: 'uploading' });
    const res = await window.photoBooth.web.publishSessionFinal(sessionId, publishForceRef.current);
    if (res.ok) {
      publishForceRef.current = true;
      setPublish({
        status: 'done',
        folio: res.data.folio,
        pageUrl: res.data.pageUrl,
        qrDataUrl: res.data.qrDataUrl,
        message: null
      });
    } else {
      setPublish({ ...IDLE_PUBLISH, status: 'failed', message: res.error.userMessage });
    }
  }

  async function startSession() {
    if (!activeEvent) return;
    setPublish(IDLE_PUBLISH);
    publishForceRef.current = false;
    setWorking(true);
    const started = await window.photoBooth.sessions.start(activeEvent.id);
    setWorking(false);
    if (!started.ok) {
      setCaptureError({ userMessage: started.error.userMessage, action: started.error.action });
      return;
    }
    const data = started.data;
    setSession(data);
    capturesRef.current = Array.from({ length: data.photoCount }, () => null);
    setCaptures([...capturesRef.current]);
    setComposed(null);
    setCaptureError(null);
    setMode('capturing');
    const ok = await runSequence(data, Array.from({ length: data.photoCount }, (_, i) => i));
    if (ok) {
      await window.photoBooth.sessions.complete(data.session.id).catch(() => undefined);
      setMode('composing');
      await composeAndSave(data);
      setMode('review');
    }
  }

  async function retakePhoto(index: number) {
    if (!session) return;
    setCaptureError(null);
    setMode('capturing');
    const ok = await captureOne(session, index);
    if (ok) {
      setMode('composing');
      await composeAndSave(session);
    }
    setMode('review');
  }

  async function retryCurrent() {
    if (!session) return;
    setCaptureError(null);
    const ok = await captureOne(session, currentIndex);
    if (!ok) return;
    const remaining = Array.from({ length: session.photoCount }, (_, i) => i).filter((i) => i > currentIndex);
    const done = await runSequence(session, remaining);
    if (done) {
      await window.photoBooth.sessions.complete(session.session.id).catch(() => undefined);
      setMode('composing');
      await composeAndSave(session);
      setMode('review');
    }
  }

  async function repeatSession() {
    setPublish(IDLE_PUBLISH);
    publishForceRef.current = false;
    if (session) await window.photoBooth.sessions.discard(session.session.id);
    setSession(null);
    setCaptures([]);
    capturesRef.current = [];
    setComposed(null);
    setCaptureError(null);
    setComposeError(null);
    setMode('setup');
  }

  async function quickPrint() {
    if (!session || !activeEvent) return;
    setPrintingQuick(true);
    try {
      const finalRes = await window.photoBooth.sessions.getFinal(session.session.id);
      if (!finalRes.ok) {
        notify({ tone: 'danger', title: 'No se pudo imprimir', message: finalRes.error.userMessage });
        return;
      }
      const sheet = await buildSheet({ finalUrls: [finalRes.data], paperKey: '4x6', orientation: 'portrait', cellCount: 1 });
      const res = await window.photoBooth.print.print({
        eventId: activeEvent.id,
        sessionId: session.session.id,
        sheetSessions: [session.session.id],
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
          title: res.data.status === 'completed' ? 'Impresión lista' : 'La impresión falló',
          message: `${activeEvent.defaultCopies} copia(s) · ${res.data.method}`
        });
      } else {
        notify({ tone: 'danger', title: 'No se pudo imprimir', message: res.error.userMessage });
      }
    } finally {
      setPrintingQuick(false);
    }
  }

  function finalize() {
    setPublish(IDLE_PUBLISH);
    publishForceRef.current = false;
    setSession(null);
    setCaptures([]);
    capturesRef.current = [];
    setComposed(null);
    setComposeError(null);
    setCaptureError(null);
    setCurrentIndex(0);
    setCountdown(null);
    setFlashing(false);
    setPoseText('');
    setWorking(false);
    setMode('setup');
  }

  // ---- Guards ----
  if (!activeEvent) {
    return (
      <Card>
        <EmptyState
          icon="events"
          title="Sin evento activo"
          description="Selecciona un evento para iniciar una sesión de fotos."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
        />
      </Card>
    );
  }
  if (!activeEvent.enablePhotos) {
    return (
      <Card>
        <EmptyState
          icon="camera"
          title="Este evento es solo de videos"
          description="La sesión de fotos está desactivada para este evento. Ve a la sección Videos, o edita el evento para activar las fotos."
          action={<Button icon="camera" onClick={() => navigate('/videos')}>Ir a Videos</Button>}
        />
      </Card>
    );
  }
  if (!activeEvent.templateId) {
    return (
      <Card>
        <EmptyState
          icon="templates"
          title="El evento no tiene plantilla"
          description="Asigna una plantilla al evento para poder capturar."
          action={<Button icon="templates" onClick={() => navigate('/plantillas')}>Ir a Plantillas</Button>}
        />
      </Card>
    );
  }

  const previewNode = camera.isMock ? (
    <div className="pb-mockcam">
      <Icon name="camera" size={40} />
      <span>Cámara simulada</span>
    </div>
  ) : (
    <video ref={camera.setVideo} className="pb-cam__video" autoPlay muted playsInline />
  );

  // ---- Capturing ----
  if (mode === 'capturing') {
    return (
      <div className="pb-capture">
        <div className="pb-capture__stage">
          <CameraPreview aspect="4 / 3">{previewNode}</CameraPreview>
          {flashing && <div className="pb-capture__flash" aria-hidden />}
          <div className="pb-capture__overlay">
            {poseText && <PoseCard pose={poseText} index={currentIndex + 1} total={session?.photoCount ?? 0} />}
            {countdown !== null && countdown > 0 && <CountdownDisplay value={countdown} />}
            {countdown === 0 && <CountdownDisplay value="¡Listo!" />}
          </div>
        </div>
        {captureError && (
          <ErrorState
            userMessage={captureError.userMessage}
            action={captureError.action}
            retry={
              <div className="pb-capture__errBtns">
                <Button size="sm" icon="retry" onClick={() => void retryCurrent()}>
                  Reintentar foto
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void repeatSession()}>
                  Cancelar sesión
                </Button>
              </div>
            }
          />
        )}
      </div>
    );
  }

  // ---- Composing ----
  if (mode === 'composing') {
    return (
      <Card>
        <EmptyState icon="image" title="Preparando tu foto…" description="Componiendo el diseño final." />
      </Card>
    );
  }

  // ---- Review ----
  if (mode === 'review') {
    return (
      <div className="pb-review">
        <Card title="Tu foto está lista" icon="success">
          {composeError ? (
            <ErrorState userMessage={composeError.userMessage} action={composeError.action} />
          ) : (
            <div className="pb-review__result">
              <TemplatePreview imageUrl={composed ?? undefined} />
            </div>
          )}
          <div className="pb-review__strip">
            {captures.map((url, index) => (
              <figure key={index} className="pb-review__item">
                {url ? <img src={url} alt={`Foto ${index + 1}`} /> : <div className="pb-review__missing" />}
                <figcaption>
                  <span>Foto {index + 1}</span>
                  <Button size="sm" variant="secondary" icon="retry" onClick={() => void retakePhoto(index)}>
                    Repetir
                  </Button>
                </figcaption>
              </figure>
            ))}
          </div>
          {Boolean(activeEvent.webUploadEnabled) && (
            <div className="pb-review__web">
              {publish.status === 'uploading' && (
                <StatusBadge tone="active" pulse>
                  Subiendo a la página web…
                </StatusBadge>
              )}
              {publish.status === 'failed' && (
                <div className="pb-review__webrow">
                  <StatusBadge tone="warning">Subida pendiente</StatusBadge>
                  <span className="pb-review__webmsg">{publish.message}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="retry"
                    onClick={() => session && void publishToWeb(session.session.id)}
                  >
                    Reintentar
                  </Button>
                </div>
              )}
              {publish.status === 'done' && publish.qrDataUrl && (
                <div className="pb-review__webrow">
                  <img className="pb-review__qr" src={publish.qrDataUrl} alt="QR para descargar" />
                  <div className="pb-review__webinfo">
                    <span className="pb-review__folio">Folio: {publish.folio}</span>
                    <span className="pb-review__webmsg">Escanea el QR para ver y descargar la foto.</span>
                    <div className="pb-review__webbtns">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon="duplicate"
                        onClick={() => {
                          void navigator.clipboard.writeText(publish.folio ?? '');
                          notify({ tone: 'success', title: 'Folio copiado', message: publish.folio ?? '' });
                        }}
                      >
                        Copiar folio
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="export"
                        onClick={() => publish.pageUrl && void window.photoBooth.web.openPage(publish.pageUrl)}
                      >
                        Abrir página
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="pb-review__note">
            La imagen final y los originales se guardaron en la carpeta del evento. La impresión llega
            en la siguiente etapa.
          </p>
          <div className="pb-review__actions">
            <DangerButton icon="retry" onClick={() => void repeatSession()}>
              Repetir sesión
            </DangerButton>
            <Button
              variant="secondary"
              icon="print"
              disabled={!composed || printingQuick}
              onClick={() => void quickPrint()}
            >
              Imprimir ({activeEvent.defaultCopies})
            </Button>
            {!inEventMode && (
              <Button variant="ghost" icon="print" onClick={() => navigate('/impresion')}>
                Más opciones
              </Button>
            )}
            <PrimaryButton icon="check" onClick={finalize}>
              Finalizar
            </PrimaryButton>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Setup ----
  return (
    <div className="pb-session">
      <Card title="Sesión de fotos" icon="session">
        <div className="pb-session__cols">
          <div className="pb-session__preview">
            <CameraPreview
              aspect="4 / 3"
              caption={
                camera.status === 'ready'
                  ? camera.isMock
                    ? 'Cámara simulada lista'
                    : 'Cámara lista'
                  : camera.status === 'starting'
                    ? 'Iniciando cámara…'
                    : undefined
              }
            >
              {camera.status === 'ready' ? previewNode : undefined}
            </CameraPreview>
            <div className="pb-session__camStatus">
              {camera.status === 'ready' && (
                <StatusBadge tone="success" icon="camera">
                  {camera.isMock ? 'Simulada' : 'Cámara lista'}
                </StatusBadge>
              )}
              {camera.status === 'starting' && (
                <StatusBadge tone="active" pulse>
                  Iniciando…
                </StatusBadge>
              )}
              {camera.status === 'error' && <StatusBadge tone="danger">Cámara con error</StatusBadge>}
            </div>
          </div>

          <div className="pb-session__info">
            <h3>{activeEvent.name}</h3>
            <p className="pb-session__type">
              <Icon name="events" size={15} /> {eventTypeLabel(activeEvent.eventType)}
            </p>
            <dl className="pb-session__meta">
              <div>
                <dt>Fotos por sesión</dt>
                <dd>{activeEvent.defaultPhotoCount}</dd>
              </div>
              <div>
                <dt>Copias (por defecto del evento)</dt>
                <dd>{activeEvent.defaultCopies}</dd>
              </div>
              <div>
                <dt>QR</dt>
                <dd>{activeEvent.qrEnabled ? 'Sí' : 'No'}</dd>
              </div>
            </dl>

            {camera.status === 'error' && camera.error ? (
              <ErrorState
                compact
                userMessage={camera.error.userMessage}
                action={camera.error.action}
                retry={
                  <div className="pb-capture__errBtns">
                    <Button size="sm" variant="secondary" icon="retry" onClick={() => camera.restart()}>
                      Reintentar
                    </Button>
                    <Button size="sm" variant="ghost" icon="settings" onClick={() => navigate('/configuracion')}>
                      Configurar cámara
                    </Button>
                  </div>
                }
              />
            ) : (
              <PrimaryButton size="lg" icon="session" disabled={!cameraReady || working} onClick={() => void startSession()}>
                Iniciar sesión
              </PrimaryButton>
            )}
            {captureError && camera.status !== 'error' && (
              <p className="pb-session__err">
                <Icon name="warning" size={15} /> {captureError.userMessage} {captureError.action}
              </p>
            )}

            <div className="pb-session__live">
              <Button
                variant={publicOpen ? 'primary' : 'secondary'}
                icon="fullscreen"
                onClick={() => void togglePublic()}
              >
                {publicOpen ? 'Cerrar vista al público' : 'Vista al público'}
              </Button>
              <Toggle
                label="Modo automático"
                checked={autoMode}
                onChange={setAutoMode}
              />
              {autoMode && (
                <Toggle
                  label="QR al terminar (en vez de imprimir)"
                  checked={qrInsteadOfPrint}
                  onChange={setQrInsteadOfPrint}
                />
              )}
            </div>
            <p className="pb-session__livehint">
              <Icon name="info" size={14} />{' '}
              {autoMode
                ? 'El público inicia e imprime desde la pantalla (toque o botonera).'
                : 'La vista al público refleja en vivo lo que hace el operador.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
