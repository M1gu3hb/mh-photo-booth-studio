import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraConfig } from '@shared/types/camera';
import { createAdapter } from '@renderer/lib/camera/createAdapter';
import { describeCameraError, type CameraAdapter, type CaptureResult, type CameraErrorInfo } from '@renderer/lib/camera/types';

type CameraStatus = 'idle' | 'starting' | 'ready' | 'error';

interface UseCamera {
  status: CameraStatus;
  error: CameraErrorInfo | null;
  isMock: boolean;
  config: CameraConfig | null;
  /** Callback ref for the preview <video>; rebinds the stream on each mount. */
  setVideo: (el: HTMLVideoElement | null) => void;
  restart: () => void;
  capture: () => Promise<CaptureResult>;
}

/**
 * Loads the persisted camera config and manages the adapter lifecycle while
 * `active`. A callback ref rebinds the live stream whenever the preview <video>
 * mounts (so switching screens/modes never loses the picture). Errors surface
 * via state rather than throwing into the UI.
 */
export function useCamera(active: boolean): UseCamera {
  const [config, setConfig] = useState<CameraConfig | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<CameraErrorInfo | null>(null);
  const [attempt, setAttempt] = useState(0);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const adapterRef = useRef<CameraAdapter | null>(null);

  const bindStream = useCallback(() => {
    const el = videoElRef.current;
    const stream = adapterRef.current?.getStream() ?? null;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
      void el.play().catch(() => undefined);
    }
  }, []);

  const setVideo = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
      bindStream();
    },
    [bindStream]
  );

  useEffect(() => {
    if (!active) return;
    let on = true;
    void window.photoBooth.camera.getConfig().then((r) => {
      if (!on) return;
      setConfig(r.ok ? r.data : { kind: 'webcam', deviceId: null, label: null });
    });
    return () => {
      on = false;
    };
  }, [active, attempt]);

  useEffect(() => {
    if (!active || !config) return;
    let cancelled = false;
    const adapter = createAdapter(config);
    adapterRef.current = adapter;
    setStatus('starting');
    setError(null);

    void adapter
      .start()
      .then(() => {
        if (cancelled) {
          adapter.stop();
          return;
        }
        setStatus('ready');
        bindStream();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(describeCameraError(err));
      });

    return () => {
      cancelled = true;
      adapter.stop();
      adapterRef.current = null;
      if (videoElRef.current) videoElRef.current.srcObject = null;
    };
  }, [active, config, attempt, bindStream]);

  const capture = useCallback(async (): Promise<CaptureResult> => {
    const adapter = adapterRef.current;
    if (!adapter) throw new Error('La cámara no está lista.');
    return adapter.capture(videoElRef.current);
  }, []);

  const restart = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    status,
    error,
    isMock: config?.kind === 'mock',
    config,
    setVideo,
    restart,
    capture
  };
}
