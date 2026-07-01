import { useEffect, useState } from 'react';
import { Card, Button, Select, Toggle, StatusBadge, CameraPreview, Icon, useToast } from '@renderer/components/ui';
import { useCamera } from '@renderer/hooks/useCamera';
import { listVideoInputs } from '@renderer/lib/camera/types';
import type { CameraConfig } from '@shared/types/camera';
import './settings-extra.css';

export function CameraSettingsCard() {
  const { notify } = useToast();
  const [config, setConfig] = useState<CameraConfig | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testing, setTesting] = useState(false);
  const test = useCamera(testing);

  useEffect(() => {
    let on = true;
    void window.photoBooth.camera.getConfig().then((r) => {
      if (on && r.ok) setConfig(r.data);
    });
    void listVideoInputs().then((d) => {
      if (on) setDevices(d);
    });
    return () => {
      on = false;
    };
  }, []);

  async function detectCameras() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // Permission denied / no device — we can still list (without labels) and offer mock.
    }
    setDevices(await listVideoInputs());
  }

  async function choose(value: string) {
    let next: CameraConfig;
    if (value === 'mock') {
      next = { kind: 'mock', deviceId: null, label: 'Cámara simulada (mock)' };
    } else if (value === 'default') {
      next = { kind: 'webcam', deviceId: null, label: 'Cámara predeterminada' };
    } else {
      const device = devices.find((d) => d.deviceId === value);
      next = { kind: 'webcam', deviceId: value, label: device?.label || 'Cámara' };
    }
    const result = await window.photoBooth.camera.setConfig(next);
    if (result.ok) {
      setConfig(result.data);
      notify({ tone: 'success', title: 'Cámara actualizada', message: result.data.label ?? undefined });
      if (testing) test.restart();
    } else {
      notify({ tone: 'danger', title: 'No se pudo guardar', message: result.error.userMessage });
    }
  }

  const currentValue = config?.kind === 'mock' ? 'mock' : config?.deviceId || 'default';
  const options = [
    { value: 'default', label: 'Cámara predeterminada' },
    ...devices.map((d, i) => ({ value: d.deviceId, label: d.label || `Cámara ${i + 1}` })),
    { value: 'mock', label: 'Cámara simulada (mock)' }
  ];

  return (
    <Card title="Cámara" icon="camera">
      <div className="pb-camset">
        <div className="pb-camset__controls">
          <Select label="Fuente de cámara" value={currentValue} onChange={(e) => void choose(e.target.value)} options={options} />
          <div className="pb-camset__btns">
            <Button size="sm" variant="secondary" icon="retry" onClick={() => void detectCameras()}>
              Buscar cámaras
            </Button>
            <Toggle checked={testing} onChange={setTesting} label="Probar cámara" />
          </div>
          <p className="pb-camset__hint">
            Si no hay cámara disponible, usa la cámara simulada para probar el flujo completo.
          </p>
        </div>

        {testing && (
          <div className="pb-camset__preview">
            <CameraPreview aspect="4 / 3" caption={config?.label ?? undefined}>
              {test.status === 'ready' ? (
                test.isMock ? (
                  <div className="pb-mockcam">
                    <Icon name="camera" size={32} />
                    <span>Cámara simulada</span>
                  </div>
                ) : (
                  <video ref={test.setVideo} className="pb-cam__video" autoPlay muted playsInline />
                )
              ) : undefined}
            </CameraPreview>
            <div className="pb-camset__status">
              {test.status === 'ready' && <StatusBadge tone="success" icon="camera">Vista previa OK</StatusBadge>}
              {test.status === 'starting' && <StatusBadge tone="active" pulse>Iniciando…</StatusBadge>}
              {test.status === 'error' && <StatusBadge tone="danger">{test.error?.userMessage ?? 'Error'}</StatusBadge>}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
