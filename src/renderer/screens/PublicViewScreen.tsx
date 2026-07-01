import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@renderer/components/ui';
import { useCamera } from '@renderer/hooks/useCamera';
import { useBranding } from '@renderer/theme/ThemeProvider';
import { useEvents } from '@renderer/state/EventsProvider';
import type { LiveSessionState } from '@shared/types/live';
import './publicview.css';

/**
 * Guest-facing display (Fase 14/15), shown on the second monitor. No admin
 * controls. Mirrors the operator's live session (countdown / flash / final),
 * shows a framing guide matching the current photo's template slot, and — in
 * automatic mode — lets guests start and print by tapping the screen or using a
 * button box (Enter / Space / P keys).
 */
export function PublicViewScreen() {
  const branding = useBranding();
  const { activeEvent } = useEvents();
  const camera = useCamera(true);
  const [state, setState] = useState<LiveSessionState | null>(null);
  const [photoAspects, setPhotoAspects] = useState<number[]>([]);
  // Camera frame aspect (w/h) and screen aspect — used to place the framing
  // guide EXACTLY over the region the photo will keep.
  const [frameAspect, setFrameAspect] = useState(0);
  const [stageAspect, setStageAspect] = useState(() =>
    typeof window !== 'undefined' && window.innerHeight > 0
      ? window.innerWidth / window.innerHeight
      : 1.6
  );

  useEffect(() => window.photoBooth.live.onState(setState), []);

  useEffect(() => {
    const onResize = () => setStageAspect(window.innerWidth / Math.max(1, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load the active event template's photo-slot aspect ratios (same order the
  // composition uses) so the framing guide matches each photo's real footprint.
  useEffect(() => {
    const templateId = activeEvent?.templateId;
    if (!templateId) {
      setPhotoAspects([]);
      return;
    }
    let on = true;
    void window.photoBooth.templates.get(templateId).then((r) => {
      if (!on || !r.ok) return;
      const aspects = r.data.slots
        .filter((s) => s.slotType === 'photo')
        .sort((a, b) => a.slotKey.localeCompare(b.slotKey, undefined, { numeric: true }))
        .map((s) => (s.height > 0 ? s.width / s.height : 1));
      setPhotoAspects(aspects);
    });
    return () => {
      on = false;
    };
  }, [activeEvent?.templateId]);

  const phase = state?.phase ?? 'idle';
  const auto = state?.autoMode ?? false;
  const photoCount = state?.photoCount ?? 0;

  const sendCommand = useCallback((command: 'start' | 'print' | 'finalize') => {
    void window.photoBooth.live.sendCommand(command);
  }, []);

  const primaryAction = useCallback(() => {
    if (!auto) return;
    if (phase === 'idle') sendCommand('start');
    else if (phase === 'review') sendCommand('print');
  }, [auto, phase, sendCommand]);

  // Button box / touchscreen: Enter or Space = primary action, P = print.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        primaryAction();
      } else if (e.key.toLowerCase() === 'p' && auto && phase === 'review') {
        sendCommand('print');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [primaryAction, auto, phase, sendCommand]);

  const cameraNode = camera.isMock ? (
    <div className="pb-public__mock">
      <Icon name="camera" size={64} />
      <span>Cámara simulada</span>
    </div>
  ) : (
    <video
      ref={camera.setVideo}
      className="pb-public__video"
      autoPlay
      muted
      playsInline
      onLoadedMetadata={(e) =>
        setFrameAspect(e.currentTarget.videoWidth / Math.max(1, e.currentTarget.videoHeight))
      }
    />
  );

  const isLive = phase === 'idle' || phase === 'countdown' || phase === 'capturing' || phase === 'flash';
  const showCountdown = phase === 'countdown' && state?.countdown != null && state.countdown > 0;
  const showReady = phase === 'flash';

  // Framing guide sized to the EXACT region the photo keeps: the capture uses the
  // full camera frame and the composition fits it into the slot with 'cover', so
  // the kept region is the centered crop of the frame at the slot's aspect. We
  // then map that onto the on-screen frame (shown 'contain') as % of the screen.
  const slotAspect = isLive ? (photoAspects[state?.photoIndex ?? 0] ?? photoAspects[0] ?? null) : null;
  let guideStyle: { width: string; height: string } | null = null;
  if (slotAspect && !camera.isMock && frameAspect > 0) {
    const cf = frameAspect;
    const sl = slotAspect;
    const sa = stageAspect;
    const cropW = sl <= cf ? sl / cf : 1; // crop of the frame kept by the slot
    const cropH = sl <= cf ? 1 : cf / sl;
    const frameW = sa >= cf ? cf / sa : 1; // on-screen frame box (contain) vs screen
    const frameH = sa >= cf ? 1 : sa / cf;
    guideStyle = {
      width: `${(frameW * cropW * 100).toFixed(3)}%`,
      height: `${(frameH * cropH * 100).toFixed(3)}%`
    };
  }

  return (
    <div
      className="pb-public"
      role="button"
      tabIndex={0}
      onClick={primaryAction}
      onKeyDown={() => undefined}
    >
      <div className="pb-public__stage">
        {phase === 'review' && state?.finalUrl ? (
          <img className="pb-public__final" src={state.finalUrl} alt="Tu foto" />
        ) : (
          cameraNode
        )}

        {/* Imaginary framing guide: no border — just a subtle dim over everything
            outside the exact region the photo will keep. */}
        {guideStyle && <div className="pb-public__guide" style={guideStyle} aria-hidden />}

        {showCountdown && (
          <div className="pb-public__countdown" key={state?.countdown} aria-live="assertive">
            {state?.countdown}
          </div>
        )}

        {showReady && <div className="pb-public__ready">¡Listo!</div>}

        {phase === 'composing' && <div className="pb-public__composing">Preparando tu foto…</div>}

        {phase === 'flash' && <div className="pb-public__flash" aria-hidden />}
      </div>

      {/* Decorative brass frame around the whole screen. */}
      <div className="pb-public__frame" aria-hidden />

      <header className="pb-public__top">
        <strong>{branding.venueName}</strong>
        {photoCount > 0 && <span className="pb-public__count">{photoCount} fotos por sesión</span>}
      </header>

      <footer className="pb-public__cta">
        {phase === 'idle' &&
          (auto ? (
            <button type="button" className="pb-public__btn pb-public__btn--pulse" onClick={() => sendCommand('start')}>
              <Icon name="camera" size={30} /> Toca para empezar
            </button>
          ) : (
            <span className="pb-public__hint">¡Prepárate! El operador iniciará la sesión.</span>
          ))}

        {phase === 'review' &&
          (auto ? (
            <div className="pb-public__btnrow">
              <button type="button" className="pb-public__btn" onClick={() => sendCommand('print')}>
                <Icon name="print" size={26} /> Imprimir
              </button>
              <button
                type="button"
                className="pb-public__btn pb-public__btn--ghost"
                onClick={() => sendCommand('finalize')}
              >
                <Icon name="check" size={26} /> Listo
              </button>
            </div>
          ) : (
            <span className="pb-public__hint">¡Tu foto está lista!</span>
          ))}
      </footer>
    </div>
  );
}
