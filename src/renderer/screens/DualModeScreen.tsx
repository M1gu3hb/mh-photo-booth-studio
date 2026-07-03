import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Select, EmptyState, StatusBadge, Icon } from '@renderer/components/ui';
import { useEvents } from '@renderer/state/EventsProvider';
import { SessionScreen } from '@renderer/screens/SessionScreen';
import { VideosScreen } from '@renderer/screens/VideosScreen';
import './dual.css';

const LS_PHOTO = 'pb.dual.photoCam';
const LS_VIDEO = 'pb.dual.videoCam';

/**
 * Dual mode (Fase 20): run the photo session (with public view) AND video
 * recording at the SAME time on one machine, each pinned to its own camera.
 * Both publish to the same event; folios are unique+deterministic so a photo
 * and a video finishing at the same instant never collide.
 */
export function DualModeScreen() {
  const navigate = useNavigate();
  const { activeEvent } = useEvents();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [photoDeviceId, setPhotoDeviceId] = useState<string>(() => localStorage.getItem(LS_PHOTO) ?? '');
  const [videoDeviceId, setVideoDeviceId] = useState<string>(() => localStorage.getItem(LS_VIDEO) ?? '');
  const [permissionError, setPermissionError] = useState(false);

  // Unlock device labels (needs a one-time getUserMedia grant), then enumerate.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        probe.getTracks().forEach((t) => t.stop());
        const all = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const cams = all.filter((d) => d.kind === 'videoinput');
        setDevices(cams);
        // Sensible defaults: photo = first camera, video = second (or first).
        setPhotoDeviceId((prev) => prev || cams[0]?.deviceId || '');
        setVideoDeviceId((prev) => prev || cams[1]?.deviceId || cams[0]?.deviceId || '');
      } catch {
        if (!cancelled) setPermissionError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickPhoto = useCallback((id: string) => {
    setPhotoDeviceId(id);
    localStorage.setItem(LS_PHOTO, id);
  }, []);
  const pickVideo = useCallback((id: string) => {
    setVideoDeviceId(id);
    localStorage.setItem(LS_VIDEO, id);
  }, []);

  const deviceOptions = (fallbackLabel: string) =>
    devices.length > 0
      ? devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Cámara ${i + 1}` }))
      : [{ value: '', label: fallbackLabel }];

  const photoLabel = devices.find((d) => d.deviceId === photoDeviceId)?.label ?? null;
  const sameCamera = Boolean(photoDeviceId) && photoDeviceId === videoDeviceId;

  // ---- Guards ----
  if (!activeEvent) {
    return (
      <Card>
        <EmptyState
          icon="events"
          title="Sin evento activo"
          description="Selecciona un evento para usar el modo doble."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Ir a Eventos</Button>}
        />
      </Card>
    );
  }
  if (!activeEvent.enablePhotos || !activeEvent.enableVideos) {
    return (
      <Card>
        <EmptyState
          icon="camera"
          title="El evento no tiene fotos y videos a la vez"
          description="El modo doble requiere un evento con sesión de fotos Y videos activados. Edita el evento para habilitar ambos."
          action={<Button icon="events" onClick={() => navigate('/eventos')}>Editar evento</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="pb-dual">
      <Card title="Modo doble · fotos + videos a la vez" icon="camera">
        {permissionError ? (
          <StatusBadge tone="danger">No se pudo acceder a las cámaras. Revisa los permisos.</StatusBadge>
        ) : (
          <div className="pb-dual__cams">
            <Select
              label="Cámara de FOTOS"
              value={photoDeviceId}
              onChange={(e) => pickPhoto(e.target.value)}
              options={deviceOptions('Buscando cámaras…')}
            />
            <Select
              label="Cámara de VIDEOS"
              value={videoDeviceId}
              onChange={(e) => pickVideo(e.target.value)}
              options={deviceOptions('Buscando cámaras…')}
            />
            <div className="pb-dual__status">
              {sameCamera ? (
                <StatusBadge tone="warning">
                  <Icon name="warning" size={14} /> Misma cámara en ambos — usa dos distintas para grabar y fotografiar a la vez.
                </StatusBadge>
              ) : (
                <StatusBadge tone="success">
                  <Icon name="check" size={14} /> {devices.length} cámara(s) · una para fotos, otra para videos.
                </StatusBadge>
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="pb-dual__grid">
        <section className="pb-dual__panel" aria-label="Sesión de fotos">
          <SessionScreen embedded cameraOverride={{ deviceId: photoDeviceId || null, label: photoLabel }} />
        </section>
        <section className="pb-dual__panel" aria-label="Grabación de video">
          <VideosScreen embedded deviceId={videoDeviceId} />
        </section>
      </div>
    </div>
  );
}
